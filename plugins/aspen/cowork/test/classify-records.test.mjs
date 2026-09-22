// The classifier's runner, against a stubbed fetch and an in-memory filesystem, so no network
// is used, nothing on the machine is read or written, and no request is billed. The provider
// adapters have their own suite (classify-providers.test.mjs); this one is about what the
// runner does with them.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONCURRENCY_DEFAULT, ConfigError, MAX_ROWS_DEFAULT, MIN_CONFIDENCE_DEFAULT, PROVIDERS,
  PROVIDER_DEFAULT, UsageError,
  ask, buildPlan, buildState, exitCodeFor, isConfident, main, mapLimit, parseArgs,
  resolveKey, resolveModel, summarize, validatePack,
} from '../skills/classify-records/scripts/jev.mjs';

const PACK = {
  model: 'jev-latest',
  state_fields: ['name_p', 'notes_c'],
  questions: {
    priority: { type: 'choice', instructions: 'How urgent?', criteria: { hot: 'a', cold: 'b' } },
    is_spam: { type: 'noul', instructions: 'Junk?' },
  },
};
const ROWS = [
  { id_p: '1', name_p: 'Ada', notes_c: 'wants a demo', owner_p: 'u1' },
  { id_p: '2', name_p: 'Bob', notes_c: '', owner_p: 'u2' },
];

/** A filesystem of plain strings: reads come from `files`, writes land back in it. */
function fakeFs(files = {}) {
  return {
    files,
    readFile: (p) => {
      if (!(p in files)) throw new Error(`ENOENT: ${p}`);
      return files[p];
    },
    writeFile: (p, body) => { files[p] = body; },
  };
}

const jevAnswer = (choice, confidence, noul = 0.02) => ({
  model: 'jev-1.13.0',
  answers: {
    priority: { type: 'choice', choice, confidence, probabilities: { hot: confidence, cold: 1 - confidence } },
    is_spam: { type: 'noul', noul },
  },
  usage: { input_tokens: 10, output_tokens: 2 },
});

const jsonResponse = (status, body, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
  headers: { get: (k) => headers[k.toLowerCase()] ?? null },
});

const KEYED = { TYPESAFE_API_KEY: 'ts-key', HOME: '/nonexistent-home' };
const unreachable = async () => { throw new Error('nothing should reach the network here'); };

// --- arguments ------------------------------------------------------------------------

test('an unknown or missing action is a usage error', () => {
  assert.throws(() => parseArgs([]), UsageError);
  assert.throws(() => parseArgs(['frobnicate']), UsageError);
});

test('flags become camelCase options; --execute is a bare switch', () => {
  const o = parseArgs(['classify', '--rows', 'r.json', '--questions', 'p.json', '--execute',
    '--state-fields', 'a,b', '--min-confidence', '0.8']);
  assert.equal(o.rows, 'r.json');
  assert.equal(o.stateFields, 'a,b');
  assert.equal(o.execute, true);
  assert.equal(o.minConfidence, 0.8);
  assert.equal(o.maxRows, MAX_ROWS_DEFAULT);
  assert.equal(o.concurrency, CONCURRENCY_DEFAULT);
  assert.equal(o.provider, PROVIDER_DEFAULT);
});

test('--provider takes a known backend and refuses anything else', () => {
  const base = ['classify', '--rows', 'r.json', '--questions', 'p.json'];
  assert.equal(parseArgs([...base, '--provider', 'anthropic']).provider, 'anthropic');
  assert.throws(() => parseArgs([...base, '--provider', 'llama-at-home']), UsageError);
});

// A secret on argv is visible to `ps` and lands in shell history, so the flag does not exist
// -- and says why, rather than failing as an unknown option the caller then tries to guess.
test('--api-key is refused, and names the variables to use instead', () => {
  assert.throws(() => parseArgs(['classify', '--api-key', 'sk-leak']), (err) =>
    err instanceof UsageError
      && /TYPESAFE_API_KEY/.test(err.message) && /ANTHROPIC_API_KEY/.test(err.message));
});

test('classify needs exactly one row source, and a whole plan or none', () => {
  const base = ['classify', '--questions', 'p.json'];
  assert.throws(() => parseArgs(base), UsageError);
  assert.throws(() => parseArgs([...base, '--xql', 'SELECT', '--rows', 'r.json']), UsageError);
  assert.throws(() => parseArgs([...base, '--rows', 'r.json', '--plan-from', 'priority']), UsageError);
  assert.doesNotThrow(() => parseArgs([...base, '--rows', 'r.json', '--plan-from', 'priority',
    '--plan-field', 'p_c', '--plan-out', 'u.json']));
});

test('out-of-range numbers are usage errors', () => {
  const base = ['classify', '--questions', 'p.json', '--rows', 'r.json'];
  assert.throws(() => parseArgs([...base, '--max-rows', '0']), UsageError);
  assert.throws(() => parseArgs([...base, '--concurrency', '99']), UsageError);
  assert.throws(() => parseArgs([...base, '--min-confidence', '2']), UsageError);
});

// --- the pack -------------------------------------------------------------------------

test('a valid pack yields its model, whitelist and questions', () => {
  const p = validatePack(PACK);
  assert.equal(p.model, 'jev-latest');
  assert.deepEqual(p.stateFields, ['name_p', 'notes_c']);
  assert.deepEqual(Object.keys(p.questions), ['priority', 'is_spam']);
  assert.equal(validatePack({ questions: PACK.questions }).model, null);
});

// Each of these is a 422 from the API. Catching them here costs nothing; a round trip does.
test('a malformed pack is rejected before a request is spent', () => {
  const q = (questions) => () => validatePack({ questions });
  assert.throws(() => validatePack({}), UsageError);
  assert.throws(q({}), UsageError);
  assert.throws(q({ a: { type: 'guess', instructions: 'x' } }), UsageError);
  assert.throws(q({ a: { type: 'noul' } }), UsageError);
  assert.throws(q({ a: { type: 'choice', instructions: 'x', criteria: { only: 'one' } } }), UsageError);
  assert.throws(q({ a: { type: 'score', instructions: 'x', criteria: ['one'] } }), UsageError);
  assert.throws(q({ a: { type: 'score', instructions: 'x', criteria: Array(11).fill('l') } }), UsageError);
  assert.throws(() => validatePack({ questions: PACK.questions, state_fields: 'name_p' }), UsageError);
});

// --- which model ------------------------------------------------------------------------

// The pack's `model` names a Jev model. Carrying it to another backend would be a 404 on
// every row, so it stops at the provider boundary.
test('--model wins; the pack\'s model is for its own provider only', () => {
  const pack = validatePack(PACK);
  assert.equal(resolveModel(PROVIDERS.jev, { model: 'jev-1.12' }, pack), 'jev-1.12');
  assert.equal(resolveModel(PROVIDERS.jev, {}, pack), 'jev-latest');
  assert.equal(resolveModel(PROVIDERS.anthropic, {}, pack), 'claude-opus-5');
  assert.equal(resolveModel(PROVIDERS.anthropic, { model: 'claude-haiku-4-5' }, pack), 'claude-haiku-4-5');
});

test('a provider with no default model says so instead of guessing an id', () => {
  const pack = validatePack(PACK);
  assert.throws(() => resolveModel(PROVIDERS.openai, {}, pack),
    (err) => err instanceof UsageError && /pass --model/.test(err.message));
  assert.equal(resolveModel(PROVIDERS.openai, { model: 'a-model' }, pack), 'a-model');
});

// --- the state ------------------------------------------------------------------------

test('the state is a whitelist, and never carries the id', () => {
  assert.deepEqual(buildState(ROWS[0], ['name_p', 'notes_c']), { name_p: 'Ada', notes_c: 'wants a demo' });
  assert.deepEqual(buildState(ROWS[0], null), { name_p: 'Ada', notes_c: 'wants a demo', owner_p: 'u1' });
  assert.equal('id_p' in buildState(ROWS[0], null), false);
});

test('empty and absent values are dropped rather than sent as blanks', () => {
  assert.deepEqual(buildState(ROWS[1], ['name_p', 'notes_c', 'missing_c']), { name_p: 'Bob' });
});

// --- the confidence gate ------------------------------------------------------------------

// The rule the whole design rests on: a missing confidence is not a pass. Without this, a
// provider that reports none would write every label straight into the plan.
test('a missing confidence fails the gate unless the gate is switched off', () => {
  assert.equal(isConfident(0.9, 0.7), true);
  assert.equal(isConfident(0.5, 0.7), false);
  assert.equal(isConfident(null, 0.7), false);
  assert.equal(isConfident(undefined, 0.7), false);
  assert.equal(isConfident(null, 0), true, '--min-confidence 0 is the explicit opt-out');
});

// --- the request ------------------------------------------------------------------------

test('back-pressure is retried; a fault in the call is not', async () => {
  const slept = [];
  const sleepImpl = async (ms) => { slept.push(ms); };
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return calls === 1
      ? jsonResponse(429, { error: 'slow down' }, { 'retry-after': '2' })
      : jsonResponse(200, jevAnswer('hot', 0.9));
  };
  const cfg = {
    provider: PROVIDERS.jev, url: PROVIDERS.jev.defaultUrl, apiKey: 'k', model: 'jev-latest',
    questions: PACK.questions,
  };
  const out = await ask(cfg, { name_p: 'Ada' }, fetchImpl, { sleepImpl });
  assert.equal(out.answers.priority.value, 'hot');
  assert.deepEqual(slept, [2000], 'Retry-After is honoured in seconds');

  let unauthorized = 0;
  const denies = async () => { unauthorized++; return jsonResponse(401, { error: 'bad key' }); };
  await assert.rejects(() => ask(cfg, {}, denies, { sleepImpl }), /HTTP 401/);
  assert.equal(unauthorized, 1, 'a 401 is not retried');
});

test('the chosen provider builds the request and reads the reply', async () => {
  let seen;
  const fetchImpl = async (url, init) => {
    seen = { url, init };
    return jsonResponse(200, {
      model: 'claude-opus-5',
      content: [{ type: 'text', text: '{"priority":"cold","is_spam":false}' }],
      usage: { input_tokens: 5, output_tokens: 1 },
    });
  };
  const out = await ask({
    provider: PROVIDERS.anthropic, url: PROVIDERS.anthropic.defaultUrl, apiKey: 'sk',
    model: 'claude-opus-5', questions: PACK.questions,
  }, { name_p: 'Ada' }, fetchImpl);
  assert.equal(seen.init.headers['x-api-key'], 'sk');
  assert.equal(out.answers.priority.value, 'cold');
  assert.equal(out.answers.priority.confidence, null);
});

// --- fan-out ------------------------------------------------------------------------------

test('mapLimit keeps input order and never exceeds the bound', async () => {
  let live = 0;
  let peak = 0;
  const out = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
    live++; peak = Math.max(peak, live);
    await new Promise((r) => setTimeout(r, 1));
    live--;
    return n * 2;
  });
  assert.deepEqual(out, [2, 4, 6, 8, 10, 12]);
  assert.ok(peak <= 2, `peak concurrency was ${peak}`);
});

// --- reading the result ---------------------------------------------------------------

test('the summary tallies labels and counts the rows needing a person', () => {
  const results = [
    { id_p: '1', answers: { priority: { value: 'hot', confidence: 0.9 }, is_spam: { value: false, confidence: 0.96 } } },
    { id_p: '2', answers: { priority: { value: 'cold', confidence: 0.4 }, is_spam: { value: false, confidence: 0.9 } } },
    { id_p: '3', answers: { priority: { value: 'hot', confidence: null }, is_spam: { value: false, confidence: null } } },
    { id_p: '4', error: 'HTTP 500' },
  ];
  const { distribution, review, reviewRows } = summarize(results, ['priority', 'is_spam'], 0.7);
  assert.deepEqual(distribution.priority, { hot: 2, cold: 1 });
  assert.equal(review.priority, 2, 'the low one and the unmeasured one both need a person');
  assert.equal(review.is_spam, 1);
  assert.equal(reviewRows, 2);

  const ungated = summarize(results, ['priority', 'is_spam'], 0);
  assert.equal(ungated.reviewRows, 0, '--min-confidence 0 sends nothing to review');
});

// The plan is what a write is built from, so all three matter: the record API rejects a JSON
// number or boolean where a value belongs, a low-confidence guess must not ride along, and
// neither may an answer whose confidence was never measured.
test('the plan holds only confident rows, with string values', () => {
  const results = [
    { id_p: '1', answers: { priority: { value: 'hot', confidence: 0.9 } } },
    { id_p: '2', answers: { priority: { value: 'cold', confidence: 0.4 } } },
    { id_p: '3', answers: { priority: { value: 'hot', confidence: null } } },
    { id_p: '4', answers: { fit: { value: 4, confidence: 0.9 } } },
    { id_p: '5', error: 'HTTP 500' },
  ];
  const { plan, skipped } = buildPlan(results, { from: 'priority', field: 'priority_c', minConfidence: 0.7 });
  assert.deepEqual(plan, [{ id_p: '1', priority_c: 'hot' }]);
  assert.equal(skipped.length, 4);
  assert.equal(skipped[0].reason, 'below --min-confidence');
  assert.equal(skipped[1].reason, 'no confidence from this provider');
  const scored = buildPlan([results[3]], { from: 'fit', field: 'fit_c', minConfidence: 0.7 });
  assert.deepEqual(scored.plan, [{ id_p: '4', fit_c: '4' }], 'a score is stringified too');
});

// --- end to end ---------------------------------------------------------------------------

test('a classify is a dry run until --execute, and sends nothing', async () => {
  const fs = fakeFs({ 'p.json': JSON.stringify(PACK), 'r.json': JSON.stringify(ROWS) });
  const out = await main(['classify', '--questions', 'p.json', '--rows', 'r.json'],
    { env: KEYED, fetchImpl: unreachable, readFile: fs.readFile, writeFile: fs.writeFile });
  assert.equal(out.status, 'DRY_RUN');
  assert.equal(out.dry_run, true);
  assert.equal(out.rows, 2);
  assert.equal(out.provider, 'jev');
  assert.equal(out.confidence_basis, 'calibrated');
  assert.equal(out.destination, 'api.typesafe.ai');
  assert.equal('confidence_warning' in out, false);
  assert.deepEqual(out.sample_state, { name_p: 'Ada', notes_c: 'wants a demo' },
    'the sample is exactly what leaves the instance -- owner_p is not in state_fields');
});

// A silent behaviour change between providers is the one thing that would make this
// dangerous, so the dry run says it out loud before anyone types --execute.
test('a provider with no confidence warns in the dry run, and the warning lifts at 0', async () => {
  const fs = fakeFs({ 'p.json': JSON.stringify(PACK), 'r.json': JSON.stringify(ROWS) });
  const env = { ...KEYED, ANTHROPIC_API_KEY: 'sk' };
  const warned = await main(['classify', '--questions', 'p.json', '--rows', 'r.json', '--provider', 'anthropic'],
    { env, fetchImpl: unreachable, readFile: fs.readFile, writeFile: fs.writeFile });
  assert.equal(warned.provider, 'anthropic');
  assert.equal(warned.model, 'claude-opus-5');
  assert.equal(warned.destination, 'api.anthropic.com');
  assert.match(warned.confidence_warning, /every row will land in review/);

  const accepted = await main(['classify', '--questions', 'p.json', '--rows', 'r.json',
    '--provider', 'anthropic', '--min-confidence', '0'],
  { env, fetchImpl: unreachable, readFile: fs.readFile, writeFile: fs.writeFile });
  assert.equal('confidence_warning' in accepted, false);
});

test('--execute answers every row, tallies usage, and writes the plan file', async () => {
  const fs = fakeFs({ 'p.json': JSON.stringify(PACK), 'r.json': JSON.stringify(ROWS) });
  const replies = [jevAnswer('hot', 0.92), jevAnswer('cold', 0.5)];
  let i = 0;
  const fetchImpl = async () => jsonResponse(200, replies[i++]);
  const out = await main(['classify', '--questions', 'p.json', '--rows', 'r.json', '--execute',
    '--plan-from', 'priority', '--plan-field', 'priority_c', '--plan-out', 'u.json'],
  { env: KEYED, fetchImpl, readFile: fs.readFile, writeFile: fs.writeFile });

  assert.equal(out.status, 'OK');
  assert.equal(exitCodeFor(out), 0);
  assert.equal(out.model, 'jev-1.13.0', 'the served model id replaces the alias');
  assert.deepEqual(out.counts, { rows: 2, answered: 2, failed: 0, review: 1 });
  assert.deepEqual(out.usage, { input_tokens: 20, output_tokens: 4 });
  assert.deepEqual(out.distribution.priority, { hot: 1, cold: 1 });
  assert.equal(out.plan.rows, 1);
  assert.deepEqual(JSON.parse(fs.files['u.json']), [{ id_p: '1', priority_c: 'hot' }]);
  assert.equal('sample_state' in out, false);
});

test('on a provider with no confidence, the plan comes out empty rather than unguarded', async () => {
  const fs = fakeFs({ 'p.json': JSON.stringify(PACK), 'r.json': JSON.stringify(ROWS) });
  const fetchImpl = async () => jsonResponse(200, {
    model: 'claude-opus-5',
    content: [{ type: 'text', text: '{"priority":"hot","is_spam":false}' }],
    usage: { input_tokens: 400, output_tokens: 20 },
  });
  const args = ['classify', '--questions', 'p.json', '--rows', 'r.json', '--execute',
    '--provider', 'anthropic', '--plan-from', 'priority', '--plan-field', 'priority_c',
    '--plan-out', 'u.json'];
  const env = { ...KEYED, ANTHROPIC_API_KEY: 'sk' };

  const guarded = await main(args, { env, fetchImpl, readFile: fs.readFile, writeFile: fs.writeFile });
  assert.equal(guarded.counts.answered, 2);
  assert.equal(guarded.counts.review, 2);
  assert.equal(guarded.plan.rows, 0);
  assert.deepEqual(JSON.parse(fs.files['u.json']), []);
  assert.equal(guarded.plan.skipped_detail[0].reason, 'no confidence from this provider');

  const ungated = await main([...args, '--min-confidence', '0'],
    { env, fetchImpl, readFile: fs.readFile, writeFile: fs.writeFile });
  assert.equal(ungated.plan.rows, 2, 'the caller can still say "label everything" on purpose');
});

test('a row that fails is reported, not thrown, and the run is PARTIAL', async () => {
  const fs = fakeFs({ 'p.json': JSON.stringify(PACK), 'r.json': JSON.stringify(ROWS) });
  let i = 0;
  const fetchImpl = async () => (i++ === 0
    ? jsonResponse(200, jevAnswer('hot', 0.92))
    : jsonResponse(422, { error: 'criteria too long' }));
  const out = await main(['classify', '--questions', 'p.json', '--rows', 'r.json', '--execute'],
    { env: KEYED, fetchImpl, readFile: fs.readFile, writeFile: fs.writeFile });
  assert.equal(out.status, 'PARTIAL');
  assert.equal(exitCodeFor(out), 1);
  assert.deepEqual(out.counts, { rows: 2, answered: 1, failed: 1, review: 0 });
  assert.match(out.rows_out[1].error, /HTTP 422/);
});

// One row is one billed request, so a `SELECT ... FROM lead_p` with no WHERE has to stop
// here rather than at the invoice.
test('more rows than --max-rows is refused before anything is sent', async () => {
  const many = Array.from({ length: 3 }, (_, n) => ({ id_p: String(n), name_p: 'x' }));
  const fs = fakeFs({ 'p.json': JSON.stringify(PACK), 'r.json': JSON.stringify(many) });
  await assert.rejects(
    () => main(['classify', '--questions', 'p.json', '--rows', 'r.json', '--max-rows', '2'],
      { env: KEYED, fetchImpl: unreachable, readFile: fs.readFile, writeFile: fs.writeFile }),
    (err) => err instanceof UsageError && /billed request/.test(err.message));
});

test('each provider wants its own key, and only at --execute', async () => {
  const fs = fakeFs({ 'p.json': JSON.stringify(PACK), 'r.json': JSON.stringify(ROWS) });
  const env = { HOME: '/nonexistent-home' };
  assert.throws(() => resolveKey(PROVIDERS.jev, env), ConfigError);
  assert.equal(resolveKey(PROVIDERS.jev, { TYPESAFE_API_KEY: 'k' }), 'k');
  assert.throws(() => resolveKey(PROVIDERS.anthropic, { TYPESAFE_API_KEY: 'k' }),
    (err) => err instanceof ConfigError && /ANTHROPIC_API_KEY/.test(err.message));

  const dry = await main(['classify', '--questions', 'p.json', '--rows', 'r.json'],
    { env, fetchImpl: unreachable, readFile: fs.readFile, writeFile: fs.writeFile });
  assert.equal(dry.status, 'DRY_RUN', 'you can rehearse without a key');
  await assert.rejects(
    () => main(['classify', '--questions', 'p.json', '--rows', 'r.json', '--execute'],
      { env, fetchImpl: unreachable, readFile: fs.readFile, writeFile: fs.writeFile }),
    ConfigError);
});

test('check names every provider, its key source and what its confidence means', async () => {
  const out = await main(['check'], {
    env: { ...KEYED, ASPEN_INSTANCE: 'https://host/d/i', ASPEN_API_TOKEN: 'aspen-secret' },
    fetchImpl: unreachable,
  });
  assert.equal(out.providers.jev.key, 'env TYPESAFE_API_KEY');
  assert.equal(out.providers.jev.confidence, 'calibrated');
  assert.equal(out.providers.anthropic.key, null);
  assert.equal(out.providers.anthropic.confidence, 'none');
  assert.equal(out.providers.openai.default_model, null);
  assert.equal(out.aspen.instance, 'https://host/d/i');
  assert.equal(out.aspen.sources.token, 'env ASPEN_API_TOKEN');
  const printed = JSON.stringify(out);
  assert.equal(printed.includes('aspen-secret'), false);
  assert.equal(printed.includes('ts-key'), false);
});

test('the default confidence bar is the documented one', () => {
  assert.equal(MIN_CONFIDENCE_DEFAULT, 0.7);
});
