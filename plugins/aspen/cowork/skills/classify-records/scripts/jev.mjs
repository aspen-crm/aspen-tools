#!/usr/bin/env node
// Classify Aspen records by judgement -- label, triage, score or sort a set of records the
// way a knowledgeable person would, when no WHERE clause can express the question.
//
//   node jev.mjs check                                     # providers, identity, keys; no network
//   node jev.mjs classify --xql "SELECT id_p, name_p, notes_c FROM lead_p" \
//                         --questions questions/lead-triage.json          # DRY RUN
//   node jev.mjs classify --xql "..." --questions pack.json --execute --out answers.json
//   node jev.mjs classify --rows rows.json --questions pack.json --execute
//   node jev.mjs classify --rows rows.json --questions pack.json --execute \
//                         --provider anthropic --model claude-haiku-4-5
//   node jev.mjs classify --xql "..." --questions pack.json --execute \
//                         --plan-from priority --plan-field priority_c --plan-out updates.json
//
// Rows come from the platform's batch query API (--xql, paged by the bulk-data helper this
// imports) or from a JSON array on disk (--rows, for a host with no Aspen login at all --
// Codex and Gemini CLI reach a model fine without ever reaching the instance).
//
// The question pack is the contract and the provider is a flag: `--provider jev` (default),
// `anthropic`, `openai` or `gemini`, each defined in providers.mjs. One request per row
// carrying the whole pack, whichever one you pick -- so the choice changes what a request
// costs and what its `confidence` means, not how many requests a run makes. Read the header
// of providers.mjs before choosing: on `anthropic` there are no logprobs and therefore no
// confidence at all, so every row lands in `review` unless you deliberately set
// --min-confidence 0.
//
// THIS SCRIPT NEVER WRITES TO ASPEN. It classifies and, with --plan-*, writes an update file
// for `aspen-data.mjs update` to carry -- so every write still goes through that helper's dry
// run and the user's explicit yes, and a model's guess never lands on a record unreviewed.
//
// Writes are not the only thing worth a gate here. Classifying SENDS RECORD DATA TO A THIRD
// PARTY, which is not undoable once it leaves the machine, so a classify is a DRY RUN unless
// --execute: it resolves the rows, builds the states, and prints the count, the destination
// host and one sample state, having sent nothing. Show the user that sample -- it is exactly
// what leaves the instance -- and get a yes before re-running with --execute.
//
// Each provider's key is read from its own environment variable and nowhere else. There is
// deliberately no --api-key: a secret on a command line is visible to `ps` and lands in shell
// history. The Aspen credential is resolved by the bulk-data helper's own chain and, as
// there, is never printed.
//
// Output is one JSON object on stdout. Exit codes: 0 every row answered; 1 one or more rows
// failed; 2 the request was rejected as a whole; 3 no usable identity or no API key; 4 usage.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
    ConfigError, RequestError, UsageError, queryAll, resolveIdentity,
} from '../../bulk-data/scripts/aspen-data.mjs';
import { PROVIDERS, PROVIDER_NAMES, ProviderError } from './providers.mjs';

export { ConfigError, ProviderError, RequestError, UsageError };
export { PROVIDERS, PROVIDER_NAMES };

export const PROVIDER_DEFAULT = 'jev';
// A ceiling you have to raise on purpose. Each row is a billed request, and an XQL that
// selects a whole object is easy to write by accident.
export const MAX_ROWS_DEFAULT = 500;
export const CONCURRENCY_DEFAULT = 4;
// Below this, the answer is reported but excluded from a write plan and counted as `review`.
// It is a starting point, not a finding: tune it against a labelled sample of the customer's
// own records, because calibration is per-question, not per-model -- and on a provider with
// no confidence at all it is the switch that keeps every row in front of a person.
export const MIN_CONFIDENCE_DEFAULT = 0.7;
export const RETRY_STATUS = new Set([429, 500, 502, 503, 504, 529]);
export const RETRY_ATTEMPTS = 3;

export const ACTIONS = ['classify', 'check'];
export const QUESTION_TYPES = ['choice', 'score', 'noul'];
// The API's own limits. Hitting them returns 422, so catch them before spending a request.
export const CHOICE_MAX_OPTIONS = 255;
export const SCORE_MIN_LEVELS = 2;
export const SCORE_MAX_LEVELS = 10;

export function parseArgs(argv) {
    const action = argv[0];
    if (!action || !ACTIONS.includes(action)) {
        throw new UsageError(`usage: jev.mjs <${ACTIONS.join('|')}> [options]`);
    }
    const opts = {
        action,
        execute: false,
        provider: PROVIDER_DEFAULT,
        maxRows: MAX_ROWS_DEFAULT,
        concurrency: CONCURRENCY_DEFAULT,
        minConfidence: MIN_CONFIDENCE_DEFAULT,
    };
    for (let i = 1; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--execute') { opts.execute = true; continue; }
        if (!a.startsWith('--')) throw new UsageError(`unexpected argument: ${a}`);
        if (a === '--api-key') {
            throw new UsageError(
                'there is no --api-key: a secret on the command line is visible to `ps` and '
                + "lands in shell history. Export the provider's key variable instead ("
                + PROVIDER_NAMES.map((p) => PROVIDERS[p].keyEnv).join(', ') + ').');
        }
        const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        const value = argv[++i];
        if (value === undefined) throw new UsageError(`${a} needs a value`);
        opts[key] = value;
    }

    if (!PROVIDER_NAMES.includes(opts.provider)) {
        throw new UsageError(`--provider must be one of ${PROVIDER_NAMES.join(', ')}`);
    }
    const int = (name, min, max) => {
        const n = Number(opts[name]);
        if (!Number.isInteger(n) || n < min || n > max) {
            throw new UsageError(`--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)} must be an integer ${min}..${max}`);
        }
        opts[name] = n;
    };
    int('maxRows', 1, 100_000);
    int('concurrency', 1, 16);
    const conf = Number(opts.minConfidence);
    if (!Number.isFinite(conf) || conf < 0 || conf > 1) {
        throw new UsageError('--min-confidence must be a number 0..1');
    }
    opts.minConfidence = conf;

    if (action === 'classify') {
        if (!opts.questions) throw new UsageError('classify needs --questions <pack.json>');
        if (Boolean(opts.xql) === Boolean(opts.rows)) {
            throw new UsageError('classify needs exactly one of --xql or --rows');
        }
        const planFlags = ['planFrom', 'planField', 'planOut'].filter((k) => opts[k]);
        if (planFlags.length && planFlags.length !== 3) {
            throw new UsageError('a write plan needs all three of --plan-from, --plan-field and --plan-out');
        }
    }
    return opts;
}

/**
 * A pack is the question map plus the envelope this script needs: which row columns become
 * the state, and (for the native provider) which model to ask. Validated here rather than at
 * the API, because a 422 costs a round trip and names the field, not the fix.
 */
export function validatePack(pack) {
    if (!pack || typeof pack !== 'object' || Array.isArray(pack)) {
        throw new UsageError('--questions must be a JSON object');
    }
    const questions = pack.questions;
    if (!questions || typeof questions !== 'object' || Array.isArray(questions)) {
        throw new UsageError('--questions file needs a `questions` object');
    }
    const ids = Object.keys(questions);
    if (ids.length === 0) throw new UsageError('--questions file defines no questions');
    for (const [id, q] of Object.entries(questions)) {
        if (!QUESTION_TYPES.includes(q?.type)) {
            throw new UsageError(`question "${id}": type must be one of ${QUESTION_TYPES.join(', ')}`);
        }
        if (!q.instructions || typeof q.instructions !== 'string') {
            throw new UsageError(`question "${id}": instructions must be a non-empty string`);
        }
        if (q.type === 'choice') {
            const options = q.criteria && !Array.isArray(q.criteria) ? Object.keys(q.criteria) : [];
            if (options.length < 2) {
                throw new UsageError(`question "${id}": a choice needs a criteria object of at least 2 options`);
            }
            if (options.length > CHOICE_MAX_OPTIONS) {
                throw new UsageError(`question "${id}": a choice takes at most ${CHOICE_MAX_OPTIONS} options`);
            }
        }
        if (q.type === 'score') {
            const levels = Array.isArray(q.criteria) ? q.criteria : null;
            if (!levels || levels.length < SCORE_MIN_LEVELS || levels.length > SCORE_MAX_LEVELS) {
                throw new UsageError(
                    `question "${id}": a score needs a criteria array of ${SCORE_MIN_LEVELS}..${SCORE_MAX_LEVELS} levels`);
            }
        }
    }
    if (pack.state_fields !== undefined && !Array.isArray(pack.state_fields)) {
        throw new UsageError('`state_fields` must be an array of field names');
    }
    return { model: pack.model || null, stateFields: pack.state_fields || null, questions };
}

/**
 * The pack's own `model` names a Jev model, so it applies only to the native provider; on any
 * other backend it would be a 404 on every row. --model always wins, and a provider whose ids
 * turn over too fast to hardcode (OpenAI, Gemini) has no default and says so.
 */
export function resolveModel(provider, opts, pack) {
    if (opts.model) return opts.model;
    if (provider.name === PROVIDER_DEFAULT && pack.model) return pack.model;
    if (provider.defaultModel) return provider.defaultModel;
    throw new UsageError(
        `--provider ${provider.name} has no default model (its ids turn over, and a wrong `
        + 'guess is an error on every row) -- pass --model');
}

export function resolveKey(provider, env = process.env) {
    const key = env[provider.keyEnv];
    if (!key) {
        throw new ConfigError(
            `no ${provider.keyEnv} in the environment; export it (there is no --api-key flag)`);
    }
    return key;
}

/**
 * The state is what leaves the instance, so it is a whitelist: the fields the pack (or
 * --state-fields) names, and nothing else. With neither, every selected column but the id
 * goes -- the id is an opaque key that tells the model nothing and identifies the record to
 * a third party for no benefit.
 */
export function buildState(row, fields) {
    const keys = fields || Object.keys(row).filter((k) => k !== 'id_p');
    const state = {};
    for (const k of keys) {
        const v = row[k];
        if (v === null || v === undefined || v === '') continue;
        state[k] = v;
    }
    return state;
}

/**
 * The one rule the whole design rests on: a missing confidence is NOT a pass. A provider that
 * reports none (Anthropic) and a row whose logprobs did not come back both land here, and
 * both go to a person -- unless the caller sets --min-confidence 0, which is the explicit way
 * to say "label everything, I am not gating on this".
 */
export function isConfident(confidence, minConfidence) {
    if (minConfidence <= 0) return true;
    return typeof confidence === 'number' && confidence >= minConfidence;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One row, one request, through the chosen provider. 429 and 529 are the documented
 * back-pressure codes and the 5xx are transient, so those are retried with exponential
 * backoff; everything else (401, 422) is a fault in the call and retrying it just spends the
 * same request again.
 */
export async function ask(cfg, state, fetchImpl = fetch, { sleepImpl = sleep } = {}) {
    const { url, init } = cfg.provider.request({
        url: cfg.url, model: cfg.model, apiKey: cfg.apiKey, state, questions: cfg.questions,
    });
    let last;
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        let response;
        try {
            response = await fetchImpl(url, init);
        } catch (err) {
            last = new RequestError(`${cfg.provider.name}: request failed`, { detail: String(err) });
            if (attempt < RETRY_ATTEMPTS) { await sleepImpl(2 ** attempt * 250); continue; }
            throw last;
        }
        const text = await response.text();
        let json;
        try { json = JSON.parse(text); } catch {
            json = null;
            if (response.ok) {
                throw new RequestError(`${cfg.provider.name}: non-JSON response`,
                    { http: response.status, body: text.slice(0, 400) });
            }
        }
        if (response.ok) return cfg.provider.parse(json, cfg.questions);
        last = new RequestError(`${cfg.provider.name}: HTTP ${response.status}`,
            { http: response.status, response: json ?? text.slice(0, 400) });
        if (!RETRY_STATUS.has(response.status) || attempt === RETRY_ATTEMPTS) throw last;
        const after = Number(response.headers?.get?.('retry-after'));
        await sleepImpl(Number.isFinite(after) && after > 0 ? after * 1000 : 2 ** attempt * 250);
    }
    throw last;
}

/** Bounded parallelism, results in input order. */
export async function mapLimit(items, limit, fn) {
    const out = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i], i);
    });
    await Promise.all(workers);
    return out;
}

/** Per-question tallies -- the first thing to look at before trusting any single row. */
export function summarize(results, questionIds, minConfidence) {
    const distribution = {};
    const review = {};
    for (const id of questionIds) { distribution[id] = {}; review[id] = 0; }
    let reviewRows = 0;
    for (const r of results) {
        if (!r.answers) continue;
        let flagged = false;
        for (const id of questionIds) {
            const a = r.answers[id];
            if (!a) continue;
            distribution[id][String(a.value)] = (distribution[id][String(a.value)] || 0) + 1;
            if (!isConfident(a.confidence, minConfidence)) { review[id]++; flagged = true; }
        }
        if (flagged) reviewRows++;
    }
    return { distribution, review, reviewRows };
}

/**
 * A write plan, not a write: rows whose answer cleared the confidence bar, shaped for
 * `aspen-data.mjs update --object <o> --file <this>`. Values are STRINGS because the record
 * API rejects a JSON number or boolean where a field value belongs.
 */
export function buildPlan(results, { from, field, minConfidence }) {
    const plan = [];
    const skipped = [];
    for (const r of results) {
        const a = r.answers?.[from];
        if (!a) { skipped.push({ id_p: r.id_p, reason: r.error ? 'failed' : `no answer for "${from}"` }); continue; }
        if (!isConfident(a.confidence, minConfidence)) {
            skipped.push({
                id_p: r.id_p,
                reason: a.confidence === null ? 'no confidence from this provider' : 'below --min-confidence',
                confidence: a.confidence,
            });
            continue;
        }
        plan.push({ id_p: r.id_p, [field]: String(a.value) });
    }
    return { plan, skipped };
}

export async function main(argv, {
    env = process.env, fetchImpl = fetch, readFile = readFileSync, writeFile = writeFileSync,
    sleepImpl = sleep,
} = {}) {
    const opts = parseArgs(argv);
    const provider = PROVIDERS[opts.provider];
    const url = env[provider.urlEnv] || provider.defaultUrl;

    if (opts.action === 'check') {
        let aspen;
        try {
            const id = resolveIdentity(opts, env);
            aspen = { instance: id.instance, sources: id.sources };
        } catch (err) { aspen = { error: err.message }; }
        return {
            action: 'check',
            provider: provider.name,
            providers: Object.fromEntries(PROVIDER_NAMES.map((n) => [n, {
                key: env[PROVIDERS[n].keyEnv] ? `env ${PROVIDERS[n].keyEnv}` : null,
                confidence: PROVIDERS[n].confidenceBasis,
                default_model: PROVIDERS[n].defaultModel,
            }])),
            url,
            aspen,
            note: 'no network call was made; secrets are never printed',
        };
    }

    const pack = validatePack(JSON.parse(readFile(opts.questions, 'utf8')));
    const model = resolveModel(provider, opts, pack);
    const stateFields = opts.stateFields ? opts.stateFields.split(',').map((s) => s.trim()).filter(Boolean)
        : pack.stateFields;
    const questionIds = Object.keys(pack.questions);

    let rows;
    let source;
    if (opts.rows) {
        const parsed = JSON.parse(readFile(opts.rows, 'utf8'));
        if (!Array.isArray(parsed)) throw new UsageError('--rows must contain a JSON array');
        rows = parsed;
        source = `--rows ${opts.rows}`;
    } else {
        const id = resolveIdentity(opts, env);
        rows = await queryAll(id, opts.xql, fetchImpl);
        source = `${id.instance} (${id.sources.token})`;
    }
    if (rows.length === 0) throw new UsageError('no rows to classify');
    if (rows.length > opts.maxRows) {
        throw new UsageError(
            `${rows.length} rows is over --max-rows ${opts.maxRows}; every row is one billed `
            + 'request, so narrow the query or raise the ceiling on purpose');
    }

    const states = rows.map((r) => buildState(r, stateFields));
    const preview = {
        action: 'classify',
        provider: provider.name,
        confidence_basis: provider.confidenceBasis,
        model,
        destination: new URL(url).host,
        source,
        rows: rows.length,
        questions: questionIds,
        state_fields: stateFields || Object.keys(rows[0]).filter((k) => k !== 'id_p'),
        sample_state: states[0],
    };
    // Say it in the output, not only in the docs: on this provider the gate is off unless the
    // caller turns it off on purpose, and every row is going to a person.
    if (provider.confidenceBasis === 'none' && opts.minConfidence > 0) {
        preview.confidence_warning =
            `${provider.name} reports no confidence, so every row will land in review and the `
            + 'write plan will be empty. Use a provider with logprobs, or pass '
            + '--min-confidence 0 to accept unguarded labels.';
    }
    if (!opts.execute) {
        return {
            ...preview,
            status: 'DRY_RUN',
            dry_run: true,
            note: 'nothing was sent. `sample_state` is exactly what leaves the instance for each '
                + 'row -- show it to the user, get a yes, then re-run with --execute',
        };
    }

    const apiKey = resolveKey(provider, env);
    const cfg = { provider, url, apiKey, model, questions: pack.questions };
    const usage = { input_tokens: 0, output_tokens: 0 };
    let served = model;

    const results = await mapLimit(rows, opts.concurrency, async (row, i) => {
        try {
            const answer = await ask(cfg, states[i], fetchImpl, { sleepImpl });
            if (answer.model) served = answer.model;
            usage.input_tokens += answer.usage?.input_tokens || 0;
            usage.output_tokens += answer.usage?.output_tokens || 0;
            return { id_p: row.id_p ?? null, answers: answer.answers };
        } catch (err) {
            return { id_p: row.id_p ?? null, error: err.message, detail: err.detail ?? null };
        }
    });

    const failed = results.filter((r) => r.error).length;
    const { distribution, review, reviewRows } = summarize(results, questionIds, opts.minConfidence);
    const out = {
        ...preview,
        status: failed ? 'PARTIAL' : 'OK',
        dry_run: false,
        model: served,
        min_confidence: opts.minConfidence,
        counts: { rows: rows.length, answered: rows.length - failed, failed, review: reviewRows },
        distribution,
        review_by_question: review,
        usage,
        rows_out: results,
    };
    delete out.sample_state;

    if (opts.planFrom) {
        if (!questionIds.includes(opts.planFrom)) {
            throw new UsageError(`--plan-from "${opts.planFrom}" is not a question in the pack`);
        }
        const { plan, skipped } = buildPlan(results, {
            from: opts.planFrom, field: opts.planField, minConfidence: opts.minConfidence,
        });
        if (plan.some((p) => !p.id_p)) throw new UsageError('a write plan needs id_p on every row; select it in --xql');
        writeFile(opts.planOut, `${JSON.stringify(plan, null, 2)}\n`);
        out.plan = {
            file: opts.planOut, field: opts.planField, rows: plan.length, skipped: skipped.length,
            skipped_detail: skipped.slice(0, 20),
            next: `review the file, then: aspen-data.mjs update --object <object> --file ${opts.planOut} (dry run first)`,
        };
    }

    if (opts.out) {
        writeFile(opts.out, `${JSON.stringify(out, null, 2)}\n`);
        return { ...out, rows_out: `written to ${opts.out}` };
    }
    return out;
}

export function exitCodeFor(result) {
    return result.status === 'PARTIAL' ? 1 : 0;
}

/* c8 ignore start */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main(process.argv.slice(2))
        .then((result) => {
            process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
            process.exit(exitCodeFor(result));
        })
        .catch((err) => {
            const code = err instanceof UsageError ? 4 : err instanceof ConfigError ? 3 : 2;
            process.stdout.write(`${JSON.stringify({
                status: 'ERROR', error: err.message, detail: err.detail ?? null,
            }, null, 2)}\n`);
            process.exit(code);
        });
}
/* c8 ignore stop */
