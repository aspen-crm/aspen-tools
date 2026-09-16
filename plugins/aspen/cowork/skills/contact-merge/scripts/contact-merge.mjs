#!/usr/bin/env node
// Merge or unmerge ONE pair of contact_p records through the platform's contact merge
// endpoints, resolving the caller's credential here so the model never handles it.
//
//   node contact-merge.mjs merge   --survivor <id_p> --merged <id_p> [--reason TEXT]
//   node contact-merge.mjs unmerge --merge-id <id_p> [--reason TEXT]
//   node contact-merge.mjs check                       # where the identity comes from; no network
//   any action: --dry-run  (print the request that would be sent, minus the token; send nothing)
//
// The runtime MCP has no merge tool, and the endpoints are deliberately off the generic
// records path (writing merged_into_p or contact_merge_p directly is rejected), so this
// script is the one place in the plugin that speaks to them:
//
//   POST <instance><api-base>/crm/merge/contact_p     {data:[{survivor_id, merged_id, merge_reason}]}
//   POST <instance><api-base>/crm/unmerge/contact_p   {data:[{merge_id, unmerge_reason}]}
//
// Both take the platform batch envelope and answer HTTP 200 with a per-row result; a
// signed-in user may send exactly one row per call and must not name merge_source (the
// instance stamps user_p from the identity). The endpoints are user-visible only on an
// instance new enough to carry them; an older one answers 404.
//
// Identity, in the launcher's order (bin/aspen-runtime-mcp.sh), then the server's own
// fallback (creds.rs in aspen-runtime-mcp):
//   1. ASPEN_API_TOKEN / ASPEN_INSTANCE (or ASPEN_DEFAULT_INSTANCE) / ASPEN_API_BASE from
//      the environment. An EMPTY value counts as unset.
//   2. The same names from <config>/mcp/env, which install-runtime-mcp.sh writes.
//   3. The aspen CLI's stored login: <config>/credentials.json, with the secret in the OS
//      secret store (service "aspen", account = the instance URL) or inline in the file.
//      An OAuth access token past its stamped expiry is refused, not refreshed -- the CLI
//      owns refresh, and racing it can invalidate the login. Run any `aspen` command.
//   <config> is $ASPEN_CONFIG_DIR, else $XDG_CONFIG_HOME/aspen, else ~/.config/aspen.
//
// Output is one JSON object on stdout. Exit codes: 0 the row succeeded; 1 the row failed
// (read error_type); 2 the request was rejected as a whole (HTTP status, read errors);
// 3 no usable identity; 4 usage. The token is never written anywhere.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const API_BASE_DEFAULT = '/api/v24.3';
const KEYRING_SERVICE = 'aspen';
// Treat an access token as spent this long before its stamped expiry, so a request being
// built never races the real thing (the server applies the same buffer).
const EXPIRY_BUFFER_SECS = 60;
const REQUEST_TIMEOUT_MS = 15_000;

const PATHS = { merge: '/crm/merge/contact_p', unmerge: '/crm/unmerge/contact_p' };

export class UsageError extends Error {}
export class ConfigError extends Error {}

// --- arguments ----------------------------------------------------------------------------

const USAGE = `usage:
  contact-merge.mjs merge   --survivor <id_p> --merged <id_p> [--reason TEXT] [--dry-run]
  contact-merge.mjs unmerge --merge-id <id_p> [--reason TEXT] [--dry-run]
  contact-merge.mjs check`;

export function parseArgs(argv) {
  const [action, ...rest] = argv;
  if (!action || !['merge', 'unmerge', 'check'].includes(action)) throw new UsageError(USAGE);
  const opts = { action, dryRun: false };
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    if (flag === '--dry-run') { opts.dryRun = true; continue; }
    const value = rest[i + 1];
    if (value === undefined || value.startsWith('--')) throw new UsageError(`${flag} needs a value\n${USAGE}`);
    i++;
    switch (flag) {
      case '--survivor': opts.survivor = value; break;
      case '--merged': opts.merged = value; break;
      case '--merge-id': opts.mergeId = value; break;
      case '--reason': opts.reason = value; break;
      default: throw new UsageError(`unknown flag ${flag}\n${USAGE}`);
    }
  }
  if (action === 'merge') {
    if (!opts.survivor || !opts.merged) throw new UsageError(`merge needs --survivor and --merged\n${USAGE}`);
    if (opts.survivor === opts.merged) throw new UsageError('a contact cannot be merged into itself');
  }
  if (action === 'unmerge' && !opts.mergeId) throw new UsageError(`unmerge needs --merge-id\n${USAGE}`);
  return opts;
}

// The one row the request carries. merge_source is never set: a user caller supplying it is
// a request-level 400, and the instance derives user_p from the identity anyway.
export function rowFor(opts) {
  if (opts.action === 'merge') {
    const row = { survivor_id: opts.survivor, merged_id: opts.merged };
    if (opts.reason) row.merge_reason = opts.reason;
    return row;
  }
  const row = { merge_id: opts.mergeId };
  if (opts.reason) row.unmerge_reason = opts.reason;
  return row;
}

// --- identity -----------------------------------------------------------------------------

const nonEmpty = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);

export function configRoot(env) {
  const explicit = nonEmpty(env.ASPEN_CONFIG_DIR);
  if (explicit) return explicit;
  const xdg = nonEmpty(env.XDG_CONFIG_HOME);
  if (xdg) return join(xdg, 'aspen');
  const home = nonEmpty(env.HOME) || homedir();
  return join(home, '.config', 'aspen');
}

// KEY='value' lines as the installer writes them (a bare or double-quoted value is read too).
export function parseEnvFile(text) {
  const out = {};
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^(?:export\s+)?([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

// Whether the CLI's RFC 3339 expiry stamp is at or within the buffer of `nowMs`. An
// unreadable stamp is expired rather than assumed good.
export function isExpired(expiresAt, nowMs) {
  if (!expiresAt) return false;
  const at = Date.parse(expiresAt);
  if (Number.isNaN(at)) return true;
  return at - EXPIRY_BUFFER_SECS * 1000 <= nowMs;
}

// The OS secret store, as the `keyring` crate the CLI uses lays entries out: a generic
// password on macOS (service + account), a secret-service item on Linux (service + username).
// Anything else -- or a store that will not answer -- is "no secret", never an error the
// caller has to read a stderr transcript for.
export function keyringSecret(instance, os = platform(), run = spawnSync) {
  const argv = os === 'darwin'
    ? ['security', ['find-generic-password', '-s', KEYRING_SERVICE, '-a', instance, '-w']]
    : os === 'linux'
      ? ['secret-tool', ['lookup', 'service', KEYRING_SERVICE, 'username', instance]]
      : null;
  if (!argv) return undefined;
  const res = run(argv[0], argv[1], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  if (res.error || res.status !== 0) return undefined;
  return nonEmpty(res.stdout);
}

// The CLI's stored login, or a ConfigError that names the fix. Mirrors creds.rs.
export function fromAspenCli(root, { os, run, nowMs = Date.now() } = {}) {
  const path = join(root, 'credentials.json');
  if (!existsSync(path)) return undefined;
  let file;
  try { file = JSON.parse(readFileSync(path, 'utf8')); } catch { return undefined; }
  const instance = nonEmpty(file?.instance);
  if (!instance) return undefined;
  const secret = file.token_storage === 'file'
    ? nonEmpty(file.token)
    : file.token_storage === 'keyring'
      ? keyringSecret(instance, os, run)
      : undefined;
  if (!secret) {
    throw new ConfigError(
      `${path} names ${instance} but its secret could not be read from the ${file.token_storage ?? 'unknown'} store. ` +
      'Run `aspen login --instance <URL>` again, or set ASPEN_API_TOKEN and ASPEN_INSTANCE.',
    );
  }
  if (file.method === 'api_key') return { instance, token: secret, source: 'aspen-cli' };
  if (file.method === 'o_auth') {
    let pair;
    try { pair = JSON.parse(secret); } catch { return undefined; }
    const token = nonEmpty(pair?.access_token);
    if (!token) return undefined;
    if (isExpired(file.access_expires_at, nowMs)) {
      throw new ConfigError(
        `The aspen CLI's login for ${instance} has expired. Run any \`aspen\` command (e.g. ` +
        '`aspen login --instance <URL>`) to refresh it; this script does not refresh tokens.',
      );
    }
    return { instance, token, source: 'aspen-cli' };
  }
  return undefined;
}

export function resolveIdentity(env = process.env, extra = {}) {
  const root = configRoot(env);
  // 1. the environment; 2. the installer's env file. Empty values are unset in both.
  const fromEnv = (vars) => ({
    token: nonEmpty(vars.ASPEN_API_TOKEN),
    instance: nonEmpty(vars.ASPEN_INSTANCE) || nonEmpty(vars.ASPEN_DEFAULT_INSTANCE),
    apiBase: nonEmpty(vars.ASPEN_API_BASE),
  });
  const shell = fromEnv(env);
  const envFile = join(root, 'mcp', 'env');
  const file = existsSync(envFile) ? fromEnv(parseEnvFile(readFileSync(envFile, 'utf8'))) : {};
  const apiBase = shell.apiBase || file.apiBase || API_BASE_DEFAULT;
  const explicit = { token: shell.token || file.token, instance: shell.instance || file.instance };
  if (explicit.token && explicit.instance) {
    return { ...explicit, apiBase, source: shell.token ? 'env' : 'mcp-env' };
  }
  // 3. the CLI's login. Its instance wins over a token-less ASPEN_INSTANCE from 1/2: the
  // stored secret is bound to the instance the CLI recorded beside it.
  const cli = fromAspenCli(root, extra);
  if (cli) return { ...cli, apiBase };
  throw new ConfigError(
    explicit.token
      ? 'ASPEN_API_TOKEN is set but no instance URL is: set ASPEN_INSTANCE.'
      : 'No Aspen identity: run `aspen login --instance <URL>`, or set ASPEN_API_TOKEN and ' +
        `ASPEN_INSTANCE (in the shell, or in ${envFile}).`,
  );
}

// --- request ------------------------------------------------------------------------------

export function apiUrl(instance, apiBase, path) {
  const base = instance.replace(/\/+$/, '');
  const prefix = `/${apiBase.replace(/^\/+|\/+$/g, '')}`;
  return `${base}${prefix}/${path.replace(/^\/+/, '')}`;
}

// One row's outcome, flattened so a caller reads error_type and the ids at the top level.
export function normalize(action, http, body) {
  const row = Array.isArray(body?.data) ? body.data[0] : undefined;
  const failure = row?.failures?.[0] ?? body?.errors?.[0];
  const out = { action, http_status: http, status: row?.status ?? body?.status ?? 'FAILURE' };
  for (const k of ['merge_id', 'survivor_id', 'merged_id']) if (row?.[k] != null) out[k] = row[k];
  if (failure) {
    out.error_type = failure.error_type;
    if (failure.subtype) out.subtype = failure.subtype;
    out.detail = failure.detail ?? failure.display_detail;
    const resolved = failure.context?.resolved_survivor_id;
    if (resolved) out.resolved_survivor_id = resolved;
  }
  if (http < 200 || http >= 300) {
    out.status = http === 401 || http === 403 ? 'AUTH_REQUIRED' : http === 404 ? 'NOT_AVAILABLE' : 'REJECTED';
    out.errors = body?.errors ?? body?.data?.failures ?? body ?? null;
  }
  return out;
}

export async function send(identity, action, row, fetchImpl = fetch) {
  const url = apiUrl(identity.instance, identity.apiBase, PATHS[action]);
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${identity.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: [row] }),
    redirect: 'manual', // a 3xx to the UI is an auth failure, not a page to follow
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (res.status >= 300 && res.status < 400) {
    return { action, http_status: res.status, status: 'AUTH_REQUIRED',
      detail: 'the instance redirected the call to a login page: the token is missing or invalid, ' +
        'or ASPEN_API_BASE is wrong for this instance' };
  }
  const text = await res.text();
  let body = null;
  try { body = text.trim() ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 2000) }; }
  return normalize(action, res.status, body);
}

export function exitCodeFor(result) {
  if (result.status === 'SUCCESS') return 0;
  if (result.http_status >= 200 && result.http_status < 300) return 1;
  return 2;
}

// --- main ---------------------------------------------------------------------------------

export async function main(argv, { env = process.env, fetchImpl = fetch, os, run } = {}) {
  const opts = parseArgs(argv);
  const identity = resolveIdentity(env, { os, run });
  const shown = { instance: identity.instance, api_base: identity.apiBase, identity_source: identity.source };
  if (opts.action === 'check') return { result: { action: 'check', status: 'OK', ...shown }, code: 0 };
  const row = rowFor(opts);
  if (opts.dryRun) {
    const url = apiUrl(identity.instance, identity.apiBase, PATHS[opts.action]);
    return { result: { action: opts.action, status: 'DRY_RUN', url, body: { data: [row] }, ...shown }, code: 0 };
  }
  const result = await send(identity, opts.action, row, fetchImpl);
  return { result: { ...result, ...shown }, code: exitCodeFor(result) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    ({ result, code }) => { process.stdout.write(`${JSON.stringify(result, null, 2)}\n`); process.exit(code); },
    (err) => {
      const code = err instanceof UsageError ? 4 : err instanceof ConfigError ? 3 : 2;
      const status = code === 4 ? 'USAGE' : code === 3 ? 'NO_IDENTITY' : 'TRANSPORT';
      process.stdout.write(`${JSON.stringify({ status, detail: err.message }, null, 2)}\n`);
      process.exit(code);
    },
  );
}
