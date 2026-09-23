#!/usr/bin/env node
// Bulk read and write of Aspen records over the platform's batch data API, for loads too
// large for the runtime MCP's record tools (aspen_records_bulk_update tops out at 100
// updates, and no MCP tool deletes).
//
//   node aspen-data.mjs query  --xql "SELECT id_p, name_p FROM account_p" [--out rows.json]
//   node aspen-data.mjs count  --xql "ROWCOUNT FROM contact_p WHERE owner_p = CURRENT_USER()"
//   node aspen-data.mjs create --object account_p --file new.json     [--execute]
//   node aspen-data.mjs update --object contact_p --file changes.json [--execute]
//   node aspen-data.mjs delete --object task_p    --file ids.json     [--execute]
//   node aspen-data.mjs check                          # where identity comes from; no network
//
// Endpoints (all take the platform batch envelope {data:[...]}, all answer HTTP 200 with a
// per-row result plus an `overview` tally):
//
//   POST   <instance><api-base>/data/query    {query: "<XQL>"}        -> {data:[row,...]}
//   POST   <instance><api-base>/data/count    {query: "ROWCOUNT ..."} -> {count: n}
//   POST   <instance><api-base>/data/<object> {data:[{...}]}            create
//   PATCH  <instance><api-base>/data/<object> {data:[{id_p,...}]}       update
//   DELETE <instance><api-base>/data/<object> {data:[{id_p}]}           hard delete, no undo
//
// Identity, in order (the runtime MCP launcher's chain):
//   1. --instance / --token flags -- reach an instance you are not logged into, without
//      disturbing the stored login.
//   2. ASPEN_API_TOKEN / ASPEN_INSTANCE (or ASPEN_DEFAULT_INSTANCE) / ASPEN_API_BASE from
//      the environment. An EMPTY value counts as unset.
//   3. The same names from <config>/mcp/env, which install-runtime-mcp.sh writes.
//   4. The aspen CLI's stored login at <config>/credentials.json, when the secret is inline
//      in that file. A token past its stamped expiry is refused, not refreshed -- the CLI
//      owns refresh. Run any `aspen` command, then retry.
//   <config> is $ASPEN_CONFIG_DIR, else $XDG_CONFIG_HOME/aspen, else ~/.config/aspen.
//   OS-keyring credentials and OAuth pairs use the same reader as contact-merge.mjs.
//
// The token is never printed and never written anywhere; `check` names the source only.
//
// Writes are DRY RUN unless --execute: batches are built and summarised, nothing is sent.
//
// Output is one JSON object on stdout. Exit codes: 0 all rows succeeded; 1 one or more rows
// failed; 2 the request was rejected as a whole; 3 no usable identity; 4 usage.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fromAspenCli } from '../../contact-merge/scripts/contact-merge.mjs';

export const API_BASE_DEFAULT = '/api/v24.3';
export const QUERY_PAGE = 100;    // /data/query returns at most this many rows, whatever LIMIT says
export const BATCH_MAX = 500;     // batch create/update/delete cap per request
// Treat a stored access token as spent this long before its stamped expiry, so a request
// being built never races the real thing.
export const EXPIRY_BUFFER_MS = 60_000;

export const ACTIONS = ['query', 'count', 'create', 'update', 'delete', 'check'];
const METHOD = { create: 'POST', update: 'PATCH', delete: 'DELETE' };

export class UsageError extends Error {}
export class ConfigError extends Error {}
export class RequestError extends Error {
    constructor(message, detail) { super(message); this.detail = detail; }
}

export function parseArgs(argv) {
    const action = argv[0];
    if (!action || !ACTIONS.includes(action)) {
        throw new UsageError(`usage: aspen-data.mjs <${ACTIONS.join('|')}> [options]`);
    }
    const opts = { action, execute: false, batch: BATCH_MAX };
    for (let i = 1; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--execute') { opts.execute = true; continue; }
        if (!a.startsWith('--')) throw new UsageError(`unexpected argument: ${a}`);
        const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        const value = argv[++i];
        if (value === undefined) throw new UsageError(`${a} needs a value`);
        opts[key] = value;
    }
    const n = Number(opts.batch);
    if (!Number.isInteger(n) || n < 1 || n > BATCH_MAX) {
        throw new UsageError(`--batch must be an integer 1..${BATCH_MAX}`);
    }
    opts.batch = n;
    return opts;
}

/** KEY=VALUE lines as the installer writes them. An empty value counts as unset. */
export function parseEnvFile(text) {
    const out = {};
    for (const line of String(text).split('\n')) {
        const m = /^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
        if (!m) continue;
        // Unquote first, then re-trim: a quoted run of spaces is still an empty value,
        // and an empty value counts as unset.
        const value = m[2].trim().replace(/^(['"])(.*)\1$/, '$2').trim();
        if (value) out[m[1]] = value;
    }
    return out;
}

export function configRoot(env = process.env) {
    return env.ASPEN_CONFIG_DIR
        || join(env.XDG_CONFIG_HOME || join(env.HOME || homedir(), '.config'), 'aspen');
}

export function isExpired(expiresAt, nowMs = Date.now()) {
    const at = expiresAt ? Date.parse(expiresAt) : NaN;
    return Number.isFinite(at) && at - EXPIRY_BUFFER_MS <= nowMs;
}

export function resolveIdentity(opts = {}, env = process.env, { nowMs = Date.now(), os, run } = {}) {
    const root = configRoot(env);
    const envPath = join(root, 'mcp', 'env');
    const fileEnv = existsSync(envPath) ? parseEnvFile(readFileSync(envPath, 'utf8')) : {};

    const pick = (flag, ...names) => {
        if (opts[flag]) return { value: opts[flag], source: `--${flag}` };
        for (const n of names) if (env[n]) return { value: env[n], source: `env ${n}` };
        for (const n of names) if (fileEnv[n]) return { value: fileEnv[n], source: `${envPath} ${n}` };
        return null;
    };

    let instance = pick('instance', 'ASPEN_INSTANCE', 'ASPEN_DEFAULT_INSTANCE');
    let token = pick('token', 'ASPEN_API_TOKEN');
    const apiBase = pick('apiBase', 'ASPEN_API_BASE') || { value: API_BASE_DEFAULT, source: 'default' };

    if (!token || !instance) {
        const credsPath = join(root, 'credentials.json');
        if (existsSync(credsPath)) {
            let creds = {};
            try { creds = JSON.parse(readFileSync(credsPath, 'utf8')); } catch { creds = {}; }
            // Modern CLI credentials may live in the OS keyring or contain an OAuth
            // JSON pair. Reuse the merge helper's reader and keep token+instance paired.
            if (creds.token_storage && creds.method) {
                let cli;
                try { cli = fromAspenCli(root, { nowMs, os, run }); }
                catch (error) { throw new ConfigError(error.message); }
                if (cli) return { instance: cli.instance, token: cli.token, apiBase: apiBase.value,
                    sources: { instance: 'aspen-cli', token: 'aspen-cli', apiBase: apiBase.source } };
                throw new ConfigError('No usable aspen CLI login; ask the user to log in again.');
            }
            if (!instance && creds.instance) {
                instance = { value: creds.instance, source: `${credsPath} instance` };
            }
            if (!token && creds.token) {
                if (isExpired(creds.access_expires_at, nowMs)) {
                    throw new ConfigError(
                        'the aspen CLI login has expired and this script does not refresh it; '
                        + 'run any `aspen` command to refresh, or pass --token');
                }
                token = { value: creds.token, source: `${credsPath} token` };
            }
        }
    }

    if (!instance || !token) {
        const missing = [!instance && 'instance', !token && 'token'].filter(Boolean).join(' and ');
        throw new ConfigError(
            `no usable identity (missing ${missing}); pass --instance/--token, export `
            + 'ASPEN_INSTANCE/ASPEN_API_TOKEN, or run `aspen login`.');
    }
    return {
        instance: instance.value.replace(/\/+$/, ''),
        token: token.value,
        apiBase: apiBase.value,
        sources: { instance: instance.source, token: token.source, apiBase: apiBase.source },
    };
}

export function apiUrl(instance, apiBase, path) {
    return `${instance.replace(/\/+$/, '')}${apiBase}${path}`;
}

/**
 * Checkbox fields cross the JSON body as the STRINGS "true"/"false"; a real JSON boolean is
 * rejected with 'invalid type: boolean `false`, expected a string'. (An XQL WHERE clause is
 * the opposite -- there they must be UNQUOTED. Do not carry one convention to the other.)
 */
export function coerce(record) {
    const out = {};
    for (const [k, v] of Object.entries(record)) out[k] = typeof v === 'boolean' ? String(v) : v;
    return out;
}

export function chunk(list, n) {
    const out = [];
    for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
    return out;
}

/** A bare id string is accepted as shorthand for {id_p}. Non-create rows must carry an id. */
export function normalizeRecords(parsed, action) {
    if (!Array.isArray(parsed)) throw new UsageError('--file must contain a JSON array');
    if (parsed.length === 0) throw new UsageError('--file contains no records');
    const records = parsed.map((r) => (typeof r === 'string' ? { id_p: r } : coerce(r)));
    if (action !== 'create') {
        const missing = records.filter((r) => !r.id_p).length;
        if (missing) throw new UsageError(`${missing} record(s) have no id_p; ${action} needs one per row`);
    }
    return records;
}

/**
 * A malformed query can come back as an error payload under HTTP 200 -- most often a field
 * name that is not on the object. Without this check the caller sees an empty result and
 * reports "no such record", which sends you hunting for the wrong bug.
 */
export function rowsOrThrow(json, xql) {
    if (!json || !Object.prototype.hasOwnProperty.call(json, 'data')) {
        throw new RequestError(
            'query returned no data envelope -- usually a bad field or object name',
            { query: xql, response: json });
    }
    return json.data;
}

export async function call(id, method, path, body, fetchImpl = fetch) {
    let response;
    try {
        response = await fetchImpl(apiUrl(id.instance, id.apiBase, path), {
            method,
            headers: { Authorization: `Bearer ${id.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch (err) {
        throw new RequestError(`${method} ${path}: request failed`, { detail: String(err) });
    }
    const text = await response.text();
    let json;
    try { json = JSON.parse(text); } catch {
        throw new RequestError(`${method} ${path}: non-JSON response`,
            { http: response.status, body: text.slice(0, 400) });
    }
    if (!response.ok) {
        throw new RequestError(`${method} ${path}: HTTP ${response.status}`, { response: json });
    }
    return json;
}

/** Page past the 100-row ceiling. The caller must not supply LIMIT/OFFSET. */
export async function queryAll(id, xql, fetchImpl = fetch) {
    if (/\b(limit|offset)\b/i.test(xql)) {
        throw new UsageError(
            `do not put LIMIT/OFFSET in --xql; this pages for you (/data/query caps at ${QUERY_PAGE} rows)`);
    }
    const rows = [];
    for (let offset = 0; ; offset += QUERY_PAGE) {
        const page = rowsOrThrow(
            await call(id, 'POST', '/data/query',
                { query: `${xql} LIMIT ${QUERY_PAGE} OFFSET ${offset}` }, fetchImpl),
            xql);
        rows.push(...page);
        if (page.length < QUERY_PAGE) return rows;
    }
}

export async function main(argv, { env = process.env, fetchImpl = fetch, readFile = readFileSync,
    writeFile = writeFileSync, nowMs = Date.now(), os, run } = {}) {
    const opts = parseArgs(argv);

    if (opts.action === 'check') {
        const id = resolveIdentity(opts, env, { nowMs, os, run });
        return { status: 'OK', instance: id.instance, api_base: id.apiBase,
            sources: id.sources, token: '(resolved, not shown)' };
    }

    const id = resolveIdentity(opts, env, { nowMs, os, run });

    if (opts.action === 'count') {
        if (!opts.xql) throw new UsageError('count needs --xql "ROWCOUNT FROM <object> [WHERE ...]"');
        const json = await call(id, 'POST', '/data/count', { query: opts.xql }, fetchImpl);
        return { status: 'OK', count: json.count ?? 0 };
    }

    if (opts.action === 'query') {
        if (!opts.xql) throw new UsageError('query needs --xql "SELECT ... FROM <object> [WHERE ...]"');
        const rows = await queryAll(id, opts.xql, fetchImpl);
        if (opts.out) {
            writeFile(opts.out, `${JSON.stringify(rows, null, 2)}\n`);
            return { status: 'OK', rows: rows.length, out: opts.out };
        }
        return { status: 'OK', rows: rows.length, data: rows };
    }

    if (!opts.object) throw new UsageError(`${opts.action} needs --object <api name, e.g. account_p>`);
    if (!opts.file) throw new UsageError(`${opts.action} needs --file <path to a JSON array>`);
    let parsed;
    try { parsed = JSON.parse(readFile(opts.file, 'utf8')); } catch (err) {
        if (err instanceof UsageError) throw err;
        throw new UsageError(`could not read --file ${opts.file}: ${err}`);
    }
    const records = normalizeRecords(parsed, opts.action);
    const batches = chunk(records, opts.batch);

    if (!opts.execute) {
        return {
            status: 'DRY_RUN', action: opts.action, object: opts.object,
            records: records.length, batches: batches.length, batch_size: opts.batch,
            sample: records.slice(0, 3),
            note: 'nothing was sent; re-run with --execute to write',
            ...(opts.action === 'delete' ? { warning: 'delete is a hard delete with no undo' } : {}),
        };
    }

    const results = [];
    for (const group of batches) {
        const json = await call(id, METHOD[opts.action], `/data/${opts.object}`, { data: group }, fetchImpl);
        results.push(...(json.data ?? []));
    }
    const failures = results.filter((r) => r.status !== 'SUCCESS');
    return {
        status: failures.length ? 'PARTIAL' : 'OK',
        action: opts.action, object: opts.object,
        sent: records.length,
        succeeded: results.length - failures.length,
        failed: failures.length,
        ids: results.filter((r) => r.status === 'SUCCESS').map((r) => r.id).filter(Boolean),
        failures: failures.slice(0, 20),
    };
}

export function exitCodeFor(result) {
    return result.status === 'PARTIAL' ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main(process.argv.slice(2))
        .then((result) => {
            process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
            process.exit(exitCodeFor(result));
        })
        .catch((err) => {
            const code = err instanceof UsageError ? 4
                : err instanceof ConfigError ? 3
                    : err instanceof RequestError ? 2 : 2;
            process.stdout.write(`${JSON.stringify({
                status: 'ERROR', message: err.message, ...(err.detail ? { detail: err.detail } : {}),
            }, null, 2)}\n`);
            process.exit(code);
        });
}
