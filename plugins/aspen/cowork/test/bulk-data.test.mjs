// The bulk-data helper, run against a scratch config directory and a stubbed fetch, so
// nothing on the machine is read or written and no network is used.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  API_BASE_DEFAULT, BATCH_MAX, ConfigError, QUERY_PAGE, RequestError, UsageError,
  apiUrl, chunk, coerce, configRoot, exitCodeFor, isExpired, main, normalizeRecords,
  parseArgs, parseEnvFile, queryAll, rowsOrThrow,
} from '../skills/bulk-data/scripts/aspen-data.mjs';

const scratch = () => mkdtempSync(join(tmpdir(), 'aspen-bulk-'));
// An environment that cannot see the developer's own config.
const bare = (extra = {}) => ({ HOME: scratch(), ...extra });
const ident = { ASPEN_INSTANCE: 'https://host/d/i', ASPEN_API_TOKEN: 'tok' };

// --- arguments ------------------------------------------------------------------------

test('an unknown or missing action is a usage error', () => {
  assert.throws(() => parseArgs([]), UsageError);
  assert.throws(() => parseArgs(['frobnicate']), UsageError);
});

test('flags become camelCase options; --execute is a bare switch', () => {
  const o = parseArgs(['update', '--object', 'contact_p', '--file', 'x.json', '--execute']);
  assert.equal(o.action, 'update');
  assert.equal(o.object, 'contact_p');
  assert.equal(o.file, 'x.json');
  assert.equal(o.execute, true);
  assert.equal(parseArgs(['query', '--api-base', '/api/v1']).apiBase, '/api/v1');
});

test('a flag with no value, and a stray positional, are usage errors', () => {
  assert.throws(() => parseArgs(['query', '--xql']), UsageError);
  assert.throws(() => parseArgs(['query', 'oops']), UsageError);
});

test('--batch is bounded by the platform cap', () => {
  assert.equal(parseArgs(['create']).batch, BATCH_MAX);
  assert.equal(parseArgs(['create', '--batch', '100']).batch, 100);
  for (const bad of ['0', '501', 'abc', '2.5']) {
    assert.throws(() => parseArgs(['create', '--batch', bad]), UsageError, `batch ${bad}`);
  }
});

// --- identity -------------------------------------------------------------------------

test('an empty env value counts as unset', () => {
  assert.deepEqual(parseEnvFile('A=1\nB=\nC="  "\n'), { A: '1' });
});

test('env file parsing handles export, quotes and comments', () => {
  assert.deepEqual(
    parseEnvFile('# note\nexport ASPEN_INSTANCE="https://h/d/i"\nASPEN_API_TOKEN=\'t\'\n'),
    { ASPEN_INSTANCE: 'https://h/d/i', ASPEN_API_TOKEN: 't' },
  );
});

test('config root honours ASPEN_CONFIG_DIR, then XDG, then ~/.config', () => {
  assert.equal(configRoot({ ASPEN_CONFIG_DIR: '/c' }), '/c');
  assert.equal(configRoot({ XDG_CONFIG_HOME: '/x' }), join('/x', 'aspen'));
  assert.equal(configRoot({ HOME: '/h' }), join('/h', '.config', 'aspen'));
});

test('flags beat the environment, and the trailing slash is trimmed', async () => {
  const out = await main(['check', '--instance', 'https://flag/d/i/', '--token', 'ft'],
    { env: bare(ident) });
  assert.equal(out.instance, 'https://flag/d/i');
  assert.equal(out.sources.instance, '--instance');
  assert.equal(out.sources.token, '--token');
});

test('check never reveals the token', async () => {
  // A value distinctive enough that it cannot collide with a key name like "token".
  const secret = 'zzz-secret-value-zzz';
  const out = await main(['check'], { env: bare({ ...ident, ASPEN_API_TOKEN: secret }) });
  assert.equal(out.token, '(resolved, not shown)');
  assert.ok(!JSON.stringify(out).includes(secret), 'the token value must not appear anywhere');
  assert.equal(out.sources.token, 'env ASPEN_API_TOKEN', 'the source is named, not the value');
  assert.equal(out.api_base, API_BASE_DEFAULT);
});

test('no identity anywhere is a ConfigError naming the fix', async () => {
  await assert.rejects(() => main(['check'], { env: bare() }), (err) => {
    assert.ok(err instanceof ConfigError);
    assert.match(err.message, /--instance\/--token/);
    return true;
  });
});

test('a stored login past its expiry is refused, not refreshed', async () => {
  const home = scratch();
  mkdirSync(join(home, '.config', 'aspen'), { recursive: true });
  writeFileSync(join(home, '.config', 'aspen', 'credentials.json'), JSON.stringify({
    instance: 'https://host/d/i', token: 'stale',
    access_expires_at: new Date(Date.now() - 1000).toISOString(),
  }));
  await assert.rejects(() => main(['check'], { env: { HOME: home } }), ConfigError);
});

test('expiry applies a buffer so a request never races the real thing', () => {
  const now = 1_000_000;
  assert.equal(isExpired(new Date(now + 5_000).toISOString(), now), true, 'inside buffer');
  assert.equal(isExpired(new Date(now + 120_000).toISOString(), now), false);
  assert.equal(isExpired(undefined, now), false, 'no stamp means not expired');
});

// --- type quirks ----------------------------------------------------------------------

test('booleans become the strings the API demands for checkboxes', () => {
  assert.deepEqual(coerce({ owns_p: false, follows_p: true, name_p: 'x', n: 3 }),
    { owns_p: 'false', follows_p: 'true', name_p: 'x', n: 3 });
});

test('a bare id string is shorthand for {id_p}; non-create rows need an id', () => {
  assert.deepEqual(normalizeRecords(['a', 'b'], 'delete'), [{ id_p: 'a' }, { id_p: 'b' }]);
  assert.deepEqual(normalizeRecords([{ name_p: 'n' }], 'create'), [{ name_p: 'n' }]);
  assert.throws(() => normalizeRecords([{ name_p: 'n' }], 'update'), UsageError);
  assert.throws(() => normalizeRecords([], 'create'), UsageError);
  assert.throws(() => normalizeRecords({ not: 'array' }, 'create'), UsageError);
});

test('an error payload under HTTP 200 is caught, not read as zero rows', () => {
  assert.deepEqual(rowsOrThrow({ data: [] }, 'q'), []);
  assert.throws(() => rowsOrThrow({ errors: ['bad field'] }, 'q'), RequestError);
});

test('chunking respects the batch cap', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 500), []);
});

test('apiUrl joins without doubling the slash', () => {
  assert.equal(apiUrl('https://h/d/i/', '/api/v24.3', '/data/query'),
    'https://h/d/i/api/v24.3/data/query');
});

// --- paging ---------------------------------------------------------------------------

test('query pages past the 100-row ceiling and stops on a short page', async () => {
  const sent = [];
  const page = (n) => Array.from({ length: n }, (_, i) => ({ id_p: `r${i}` }));
  const fetchImpl = async (url, init) => {
    sent.push(JSON.parse(init.body).query);
    const data = sent.length === 1 ? page(QUERY_PAGE) : page(7);
    return { ok: true, status: 200, text: async () => JSON.stringify({ data }) };
  };
  const rows = await queryAll({ instance: 'https://h', apiBase: '/api', token: 't' },
    'SELECT id_p FROM contact_p', fetchImpl);
  assert.equal(rows.length, QUERY_PAGE + 7);
  assert.equal(sent.length, 2);
  assert.match(sent[0], /LIMIT 100 OFFSET 0$/);
  assert.match(sent[1], /LIMIT 100 OFFSET 100$/);
});

test('a caller-supplied LIMIT/OFFSET is refused rather than silently truncating', async () => {
  await assert.rejects(
    () => queryAll({ instance: 'h', apiBase: '/a', token: 't' },
      'SELECT id_p FROM contact_p LIMIT 5000', async () => {
        throw new Error('must not be called');
      }),
    UsageError,
  );
});

// --- writes ---------------------------------------------------------------------------

const withFile = (records) => ({
  readFile: () => JSON.stringify(records),
});

test('a write without --execute sends nothing', async () => {
  let called = false;
  const out = await main(['update', '--object', 'contact_p', '--file', 'f.json'], {
    env: bare(ident),
    fetchImpl: async () => { called = true; },
    ...withFile([{ id_p: 'a', owns_p: false }]),
  });
  assert.equal(called, false, 'nothing may be sent in a dry run');
  assert.equal(out.status, 'DRY_RUN');
  assert.equal(out.records, 1);
  assert.deepEqual(out.sample[0], { id_p: 'a', owns_p: 'false' }, 'coercion shown in the sample');
});

test('a dry-run delete says plainly that it cannot be undone', async () => {
  const out = await main(['delete', '--object', 'task_p', '--file', 'f.json'],
    { env: bare(ident), ...withFile(['id-1']) });
  assert.match(out.warning, /no undo/);
});

test('--execute batches, and per-row failures surface as PARTIAL with exit 1', async () => {
  const bodies = [];
  const fetchImpl = async (url, init) => {
    const rows = JSON.parse(init.body).data;
    bodies.push({ method: init.method, count: rows.length });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        overview: { successes: rows.length - 1, failures: 1 },
        data: rows.map((r, i) => (i === 0
          ? { id: r.id_p, status: 'FAILURE', error: 'nope' }
          : { id: r.id_p, status: 'SUCCESS' })),
      }),
    };
  };
  const records = Array.from({ length: 5 }, (_, i) => ({ id_p: `r${i}` }));
  const out = await main(
    ['update', '--object', 'contact_p', '--file', 'f.json', '--batch', '2', '--execute'],
    { env: bare(ident), fetchImpl, ...withFile(records) },
  );
  assert.deepEqual(bodies.map((b) => b.count), [2, 2, 1], 'chunked by --batch');
  assert.equal(bodies[0].method, 'PATCH', 'update is a PATCH');
  assert.equal(out.status, 'PARTIAL');
  assert.equal(out.sent, 5);
  assert.equal(out.failed, 3);
  assert.equal(exitCodeFor(out), 1);
});

test('a clean write is OK and exits 0', async () => {
  const fetchImpl = async (url, init) => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      overview: { successes: 1, failures: 0 },
      data: JSON.parse(init.body).data.map((r, i) => ({ id: r.id_p ?? `new-${i}`, status: 'SUCCESS' })),
    }),
  });
  const out = await main(['create', '--object', 'account_p', '--file', 'f.json', '--execute'],
    { env: bare(ident), fetchImpl, ...withFile([{ name_p: 'Acme' }]) });
  assert.equal(out.status, 'OK');
  assert.deepEqual(out.ids, ['new-0']);
  assert.equal(exitCodeFor(out), 0);
});

test('a non-200 is a RequestError carrying the response', async () => {
  const fetchImpl = async () => ({
    ok: false, status: 403, text: async () => JSON.stringify({ message: 'denied' }),
  });
  await assert.rejects(
    () => main(['count', '--xql', 'ROWCOUNT FROM contact_p'], { env: bare(ident), fetchImpl }),
    RequestError,
  );
});

test('create and delete use the right verbs', async () => {
  for (const [action, method] of [['create', 'POST'], ['delete', 'DELETE']]) {
    let seen;
    const fetchImpl = async (url, init) => {
      seen = init.method;
      return { ok: true, status: 200, text: async () => JSON.stringify({ data: [{ status: 'SUCCESS' }] }) };
    };
    await main([action, '--object', 'task_p', '--file', 'f.json', '--execute'],
      { env: bare(ident), fetchImpl, ...withFile(['id-1']) });
    assert.equal(seen, method, `${action} -> ${method}`);
  }
});
