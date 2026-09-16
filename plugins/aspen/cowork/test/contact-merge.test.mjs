// The contact-merge helper, run against a scratch config directory and a local stand-in
// for the instance, so nothing on the machine is read or written and no network is used.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ConfigError, UsageError, apiUrl, fromAspenCli, isExpired, keyringSecret, main, normalize,
  parseArgs, parseEnvFile, resolveIdentity, rowFor,
} from '../skills/contact-merge/scripts/contact-merge.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'skills', 'contact-merge', 'scripts', 'contact-merge.mjs');
const scratch = () => mkdtempSync(join(tmpdir(), 'aspen-merge-'));

// A config dir with nothing in it, and an environment that cannot see the developer's own.
const bare = (extra = {}) => ({ HOME: scratch(), ...extra });

const SURVIVOR = '11111111-1111-4111-8111-111111111111';
const MERGED = '22222222-2222-4222-8222-222222222222';
const MERGE_ID = '33333333-3333-4333-8333-333333333333';

// --- arguments ----------------------------------------------------------------------------

test('merge needs both parties, distinct; unmerge needs a merge id', () => {
  assert.throws(() => parseArgs([]), UsageError);
  assert.throws(() => parseArgs(['merge', '--survivor', SURVIVOR]), UsageError);
  assert.throws(() => parseArgs(['merge', '--survivor', SURVIVOR, '--merged', SURVIVOR]), UsageError);
  assert.throws(() => parseArgs(['unmerge']), UsageError);
  assert.throws(() => parseArgs(['merge', '--survivor', SURVIVOR, '--merged', MERGED, '--source', 'api_p']), UsageError);
  assert.throws(() => parseArgs(['merge', '--survivor', '--merged', MERGED]), UsageError);
  const opts = parseArgs(['merge', '--survivor', SURVIVOR, '--merged', MERGED, '--reason', 'dupe', '--dry-run']);
  assert.deepEqual(opts, { action: 'merge', dryRun: true, survivor: SURVIVOR, merged: MERGED, reason: 'dupe' });
});

test('the row never carries merge_source and omits an absent reason', () => {
  assert.deepEqual(rowFor(parseArgs(['merge', '--survivor', SURVIVOR, '--merged', MERGED])),
    { survivor_id: SURVIVOR, merged_id: MERGED });
  assert.deepEqual(rowFor(parseArgs(['merge', '--survivor', SURVIVOR, '--merged', MERGED, '--reason', 'HubSpot dedupe'])),
    { survivor_id: SURVIVOR, merged_id: MERGED, merge_reason: 'HubSpot dedupe' });
  assert.deepEqual(rowFor(parseArgs(['unmerge', '--merge-id', MERGE_ID, '--reason', 'wrong pair'])),
    { merge_id: MERGE_ID, unmerge_reason: 'wrong pair' });
});

// --- identity -----------------------------------------------------------------------------

test('the installer\'s env file parses as KEY=\'value\' lines', () => {
  const parsed = parseEnvFile("ASPEN_INSTANCE='https://i.example/acme/dev'\n# note\nASPEN_API_TOKEN=\"t\"\nBARE=x\nnot a line\n");
  assert.deepEqual(parsed, { ASPEN_INSTANCE: 'https://i.example/acme/dev', ASPEN_API_TOKEN: 't', BARE: 'x' });
});

test('the shell wins over the env file, and an empty value is unset', () => {
  const home = scratch();
  mkdirSync(join(home, '.config', 'aspen', 'mcp'), { recursive: true });
  writeFileSync(join(home, '.config', 'aspen', 'mcp', 'env'),
    "ASPEN_INSTANCE='https://file.example/a/b'\nASPEN_API_TOKEN='file-token'\n");
  const fromFile = resolveIdentity({ HOME: home, ASPEN_API_TOKEN: '' });
  assert.deepEqual(fromFile, { token: 'file-token', instance: 'https://file.example/a/b', apiBase: '/api/v24.3', source: 'mcp-env' });
  const fromShell = resolveIdentity({ HOME: home, ASPEN_API_TOKEN: 'shell-token', ASPEN_API_BASE: '/i/api/v24.3' });
  assert.deepEqual(fromShell, { token: 'shell-token', instance: 'https://file.example/a/b', apiBase: '/i/api/v24.3', source: 'env' });
});

test('with nothing configured the error names both fixes', () => {
  assert.throws(() => resolveIdentity(bare()), (e) => e instanceof ConfigError && /aspen login/.test(e.message) && /ASPEN_API_TOKEN/.test(e.message));
  assert.throws(() => resolveIdentity(bare({ ASPEN_API_TOKEN: 't' })), /ASPEN_INSTANCE/);
});

test('the CLI\'s file-stored API key is used as-is', () => {
  const dir = scratch();
  writeFileSync(join(dir, 'credentials.json'),
    '{"instance":"https://i.example/","token_storage":"file","method":"api_key","token":"secret-token:veev_x","later_field":true}');
  assert.deepEqual(fromAspenCli(dir), { instance: 'https://i.example/', token: 'secret-token:veev_x', source: 'aspen-cli' });
  assert.deepEqual(resolveIdentity({ ASPEN_CONFIG_DIR: dir }),
    { instance: 'https://i.example/', token: 'secret-token:veev_x', source: 'aspen-cli', apiBase: '/api/v24.3' });
});

test('the CLI\'s OAuth login comes out of the keyring, and an expired one is refused rather than refreshed', () => {
  const dir = scratch();
  const calls = [];
  const fakeRun = (cmd, args) => {
    calls.push([cmd, ...args]);
    return { status: 0, stdout: '{"access_token":"at-1","refresh_token":"rt-1"}\n' };
  };
  const live = new Date(Date.now() + 3600_000).toISOString();
  writeFileSync(join(dir, 'credentials.json'),
    `{"instance":"https://i.example/","token_storage":"keyring","method":"o_auth","client_id":"aspen-cli","access_expires_at":"${live}"}`);
  assert.deepEqual(fromAspenCli(dir, { os: 'darwin', run: fakeRun }),
    { instance: 'https://i.example/', token: 'at-1', source: 'aspen-cli' });
  assert.deepEqual(calls, [['security', 'find-generic-password', '-s', 'aspen', '-a', 'https://i.example/', '-w']]);

  assert.deepEqual(fromAspenCli(dir, { os: 'linux', run: fakeRun }).token, 'at-1');
  assert.deepEqual(calls.at(-1), ['secret-tool', 'lookup', 'service', 'aspen', 'username', 'https://i.example/']);

  const spent = new Date(Date.now() + 30_000).toISOString(); // inside the 60s buffer
  writeFileSync(join(dir, 'credentials.json'),
    `{"instance":"https://i.example/","token_storage":"keyring","method":"o_auth","access_expires_at":"${spent}"}`);
  assert.throws(() => fromAspenCli(dir, { os: 'darwin', run: fakeRun }), (e) => e instanceof ConfigError && /expired/.test(e.message));
});

test('a secret store that will not answer is "no secret", with the fix named', () => {
  assert.equal(keyringSecret('https://i.example/', 'darwin', () => ({ status: 44, stdout: '' })), undefined);
  assert.equal(keyringSecret('https://i.example/', 'win32', () => { throw new Error('never called'); }), undefined);
  const dir = scratch();
  writeFileSync(join(dir, 'credentials.json'), '{"instance":"https://i.example/","token_storage":"keyring","method":"o_auth"}');
  assert.throws(() => fromAspenCli(dir, { os: 'win32' }), (e) => e instanceof ConfigError && /keyring store/.test(e.message) && /aspen login/.test(e.message));
});

test('expiry is judged against the buffer, and an unreadable stamp is expired', () => {
  const now = Date.parse('2026-09-16T12:00:00Z');
  assert.equal(isExpired(undefined, now), false);
  assert.equal(isExpired('2026-09-16T13:00:00Z', now), false);
  assert.equal(isExpired('2026-09-16T12:00:30Z', now), true);
  assert.equal(isExpired('not a date', now), true);
});

// --- request ------------------------------------------------------------------------------

test('the URL joins instance path, api base and endpoint without doubled slashes', () => {
  assert.equal(apiUrl('https://h.example/acme/dev/', '/api/v24.3', '/crm/merge/contact_p'),
    'https://h.example/acme/dev/api/v24.3/crm/merge/contact_p');
  assert.equal(apiUrl('https://h.example', 'i/api/v24.3/', 'crm/unmerge/contact_p'),
    'https://h.example/i/api/v24.3/crm/unmerge/contact_p');
});

test('a per-row failure is flattened with its error type and the survivor to retry against', () => {
  const body = { status: 'FAILURE', data: [{ status: 'FAILURE', failures: [
    { error_type: 'SURVIVOR_MERGED', detail: 'survivor is itself merged', context: { resolved_survivor_id: SURVIVOR } },
  ] }] };
  const out = normalize('merge', 200, body);
  assert.equal(out.status, 'FAILURE');
  assert.equal(out.error_type, 'SURVIVOR_MERGED');
  assert.equal(out.resolved_survivor_id, SURVIVOR);
  assert.equal(normalize('merge', 404, { errors: [{ error_type: 'NOT_FOUND' }] }).status, 'NOT_AVAILABLE');
  assert.equal(normalize('merge', 401, null).status, 'AUTH_REQUIRED');
  assert.equal(normalize('merge', 400, { errors: [{ error_type: 'INVALID_DATA', detail: 'one row' }] }).status, 'REJECTED');
});

// A stand-in instance: checks the bearer and the envelope, answers like the real endpoint.
async function withInstance(handler, fn) {
  const seen = [];
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      seen.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(raw) });
      const { status, body } = handler(seen.at(-1));
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const instance = `http://127.0.0.1:${server.address().port}/acme/dev`;
  try { return await fn(instance, seen); } finally { server.close(); }
}

test('merge posts one row with the bearer and returns the ids, exit 0', async () => withInstance(
  () => ({ status: 200, body: { status: 'SUCCESS', data: [{ status: 'SUCCESS', merge_id: MERGE_ID, survivor_id: SURVIVOR, merged_id: MERGED }] } }),
  async (instance, seen) => {
    const { result, code } = await main(['merge', '--survivor', SURVIVOR, '--merged', MERGED, '--reason', 'dupe'],
      { env: bare({ ASPEN_INSTANCE: instance, ASPEN_API_TOKEN: 'tok' }) });
    assert.equal(code, 0);
    assert.equal(result.status, 'SUCCESS');
    assert.equal(result.merge_id, MERGE_ID);
    assert.equal(result.identity_source, 'env');
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, '/acme/dev/api/v24.3/crm/merge/contact_p');
    assert.equal(seen[0].auth, 'Bearer tok');
    assert.deepEqual(seen[0].body, { data: [{ survivor_id: SURVIVOR, merged_id: MERGED, merge_reason: 'dupe' }] });
    assert.equal(JSON.stringify(result).includes('tok'), false, 'the token never appears in the output');
  },
));

test('a row failure is exit 1 with the error type; a request rejection is exit 2', async () => withInstance(
  ({ url }) => (url.endsWith('/crm/unmerge/contact_p')
    ? { status: 200, body: { status: 'FAILURE', data: [{ status: 'FAILURE', failures: [{ error_type: 'INVALID_STATE', detail: 'drift' }] }] } }
    : { status: 400, body: { status: 'FAILURE', errors: [{ error_type: 'INVALID_DATA', detail: 'a user caller sends one row' }] } }),
  async (instance) => {
    const env = bare({ ASPEN_INSTANCE: instance, ASPEN_API_TOKEN: 'tok' });
    const rowFail = await main(['unmerge', '--merge-id', MERGE_ID], { env });
    assert.equal(rowFail.code, 1);
    assert.equal(rowFail.result.error_type, 'INVALID_STATE');
    const rejected = await main(['merge', '--survivor', SURVIVOR, '--merged', MERGED], { env });
    assert.equal(rejected.code, 2);
    assert.equal(rejected.result.status, 'REJECTED');
    assert.equal(rejected.result.error_type, 'INVALID_DATA');
  },
));

test('a redirect to the login page is AUTH_REQUIRED, not a page to follow', async () => {
  const server = createServer((req, res) => { res.writeHead(302, { Location: '/ui/login' }); res.end(); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const instance = `http://127.0.0.1:${server.address().port}`;
    const { result, code } = await main(['merge', '--survivor', SURVIVOR, '--merged', MERGED],
      { env: bare({ ASPEN_INSTANCE: instance, ASPEN_API_TOKEN: 'tok' }) });
    assert.equal(code, 2);
    assert.equal(result.status, 'AUTH_REQUIRED');
  } finally { server.close(); }
});

test('check and --dry-run send nothing and never show the token', async () => {
  const env = bare({ ASPEN_INSTANCE: 'https://i.example/acme/dev', ASPEN_API_TOKEN: 'tok' });
  const check = await main(['check'], { env, fetchImpl: () => { throw new Error('no network'); } });
  assert.deepEqual(check, { code: 0, result: { action: 'check', status: 'OK', instance: 'https://i.example/acme/dev', api_base: '/api/v24.3', identity_source: 'env' } });
  const dry = await main(['unmerge', '--merge-id', MERGE_ID, '--dry-run'], { env, fetchImpl: () => { throw new Error('no network'); } });
  assert.equal(dry.result.status, 'DRY_RUN');
  assert.equal(dry.result.url, 'https://i.example/acme/dev/api/v24.3/crm/unmerge/contact_p');
  assert.deepEqual(dry.result.body, { data: [{ merge_id: MERGE_ID }] });
  assert.equal(JSON.stringify(dry).includes('tok'), false);
});

// --- as a process -------------------------------------------------------------------------

test('run as a command: usage is exit 4 and no identity is exit 3, both as JSON on stdout', () => {
  const clean = {};
  for (const [k, v] of Object.entries(process.env)) if (!k.startsWith('ASPEN_') && k !== 'XDG_CONFIG_HOME') clean[k] = v;
  const usage = spawnSync('node', [script, 'merge'], { encoding: 'utf8', env: { ...clean, HOME: scratch() } });
  assert.equal(usage.status, 4);
  assert.equal(JSON.parse(usage.stdout).status, 'USAGE');
  const none = spawnSync('node', [script, 'check'], { encoding: 'utf8', env: { ...clean, HOME: scratch() } });
  assert.equal(none.status, 3);
  assert.match(JSON.parse(none.stdout).detail, /aspen login/);
});
