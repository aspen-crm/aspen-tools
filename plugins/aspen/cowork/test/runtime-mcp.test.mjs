// The launcher and the installer, run for real against a stand-in server and a
// fake .mcpb, in a scratch config directory so nothing on the machine is read
// or written. `sh`, `zip` and `unzip` are the only tools involved, as they are
// for a user.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const launcher = join(root, 'bin', 'aspen-runtime-mcp.sh');
const installer = join(root, 'bin', 'install-runtime-mcp.sh');

// A stand-in server: answers --version, otherwise reports its args and the
// identity it was handed. `${VAR-unset}` tells unset apart from empty.
const FAKE_SERVER = `#!/bin/sh
if [ "\${1:-}" = "--version" ]; then echo "aspen-runtime-mcp 9.9.9"; exit 0; fi
echo "args=$*"
echo "token=\${ASPEN_API_TOKEN-unset}"
echo "instance=\${ASPEN_INSTANCE-unset}"
echo "base=\${ASPEN_API_BASE-unset}"
echo "bulk=\${ASPEN_BULK_WRITES-unset}"
`;

const scratch = () => mkdtempSync(join(tmpdir(), 'aspen-mcp-'));

// The developer's own shell must not leak into a test.
function env(extra = {}) {
  const base = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (!k.startsWith('ASPEN_') && k !== 'XDG_CONFIG_HOME') base[k] = v;
  }
  return { ...base, ...extra };
}

const run = (script, args, environment) =>
  spawnSync('sh', [script, ...args], { env: environment, encoding: 'utf8' });

function report(stdout) {
  const out = {};
  for (const line of stdout.trim().split('\n')) {
    const i = line.indexOf('=');
    if (i > 0) out[line.slice(0, i)] = line.slice(i + 1);
  }
  return out;
}

function fakeServerAt(path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, FAKE_SERVER);
  chmodSync(path, 0o755);
  return path;
}

const haveZip = spawnSync('zip', ['-v'], { encoding: 'utf8' }).status === 0
  && spawnSync('unzip', ['-v'], { encoding: 'utf8' }).status === 0;

// Build a bundle the way the release workflow does: manifest.json + server/<bin>.
function fakeBundle(dir, version = '9.9.9') {
  const stage = join(dir, 'stage');
  mkdirSync(join(stage, 'server'), { recursive: true });
  writeFileSync(join(stage, 'manifest.json'), JSON.stringify({
    manifest_version: '0.2', name: 'aspen-runtime-mcp', version,
    server: { type: 'binary', entry_point: 'server/aspen-runtime-mcp' },
  }));
  fakeServerAt(join(stage, 'server', 'aspen-runtime-mcp'));
  const bundle = join(dir, 'fake.mcpb');
  const zip = spawnSync('zip', ['-qr', bundle, 'manifest.json', 'server'], { cwd: stage, encoding: 'utf8' });
  assert.equal(zip.status, 0, zip.stderr);
  return bundle;
}

// --- .mcp.json --------------------------------------------------------------

test('.mcp.json runs the launcher through sh from the plugin root', () => {
  const mcp = JSON.parse(readFileSync(join(root, '.mcp.json'), 'utf8'));
  const server = mcp.mcpServers['aspen-runtime-mcp'];
  assert.ok(server, 'server entry named aspen-runtime-mcp');
  assert.equal(server.command, 'sh');
  assert.deepEqual(server.args, ['${CLAUDE_PLUGIN_ROOT}/bin/aspen-runtime-mcp.sh']);
  assert.equal(server.env, undefined, 'no env block: the shell environment is inherited, and an env block would inject empty strings');
  assert.ok(existsSync(launcher));
});

// --- launcher -----------------------------------------------------------------

test('launcher: missing server names the installer and fails', () => {
  const config = scratch();
  const r = run(launcher, [], env({ ASPEN_CONFIG_DIR: config }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no server binary at .*\/mcp\/aspen-runtime-mcp/);
  assert.match(r.stderr, /install-runtime-mcp\.sh/);
  assert.match(r.stderr, /ASPEN_RUNTIME_MCP/);
});

test('launcher: default location is <config>/mcp under ~/.config/aspen', () => {
  const home = scratch();
  fakeServerAt(join(home, '.config', 'aspen', 'mcp', 'aspen-runtime-mcp'));
  const r = run(launcher, [], env({ HOME: home }));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(report(r.stdout).args, '--stdio');
});

test('launcher: XDG_CONFIG_HOME and ASPEN_CONFIG_DIR are honoured, in the CLI\'s order', () => {
  const xdg = scratch();
  fakeServerAt(join(xdg, 'aspen', 'mcp', 'aspen-runtime-mcp'));
  let r = run(launcher, [], env({ HOME: scratch(), XDG_CONFIG_HOME: xdg }));
  assert.equal(r.status, 0, r.stderr);

  const explicit = scratch();
  fakeServerAt(join(explicit, 'mcp', 'aspen-runtime-mcp'));
  r = run(launcher, [], env({ HOME: scratch(), XDG_CONFIG_HOME: scratch(), ASPEN_CONFIG_DIR: explicit }));
  assert.equal(r.status, 0, r.stderr);
});

test('launcher: ASPEN_RUNTIME_MCP points at a server of your own', () => {
  const bin = fakeServerAt(join(scratch(), 'my-build', 'aspen-runtime-mcp'));
  const r = run(launcher, [], env({ ASPEN_CONFIG_DIR: scratch(), ASPEN_RUNTIME_MCP: bin }));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(report(r.stdout).args, '--stdio');
});

test('launcher: empty identity variables are stripped, not passed as empty', () => {
  const config = scratch();
  fakeServerAt(join(config, 'mcp', 'aspen-runtime-mcp'));
  const r = run(launcher, [], env({
    ASPEN_CONFIG_DIR: config, ASPEN_API_TOKEN: '', ASPEN_INSTANCE: '', ASPEN_API_BASE: '',
  }));
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(report(r.stdout), { args: '--stdio', token: 'unset', instance: 'unset', base: 'unset', bulk: '1' });
});

test('launcher: bulk writes are on for Claude Code, and the shell can turn them off', () => {
  const config = scratch();
  fakeServerAt(join(config, 'mcp', 'aspen-runtime-mcp'));
  let r = run(launcher, [], env({ ASPEN_CONFIG_DIR: config }));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(report(r.stdout).bulk, '1', 'on by default: this launcher is the Claude Code route');
  r = run(launcher, [], env({ ASPEN_CONFIG_DIR: config, ASPEN_BULK_WRITES: '0' }));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(report(r.stdout).bulk, '0', 'the shell can turn it off');
  // An empty value counts as unset, like the identity variables: the default applies.
  r = run(launcher, [], env({ ASPEN_CONFIG_DIR: config, ASPEN_BULK_WRITES: '' }));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(report(r.stdout).bulk, '1');
});

test('launcher: shell values pass through, and reach the server exported', () => {
  const config = scratch();
  fakeServerAt(join(config, 'mcp', 'aspen-runtime-mcp'));
  const r = run(launcher, [], env({
    ASPEN_CONFIG_DIR: config, ASPEN_API_TOKEN: 'secret-token:aspen_x', ASPEN_INSTANCE: 'https://h/d/i',
  }));
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(report(r.stdout), {
    args: '--stdio', token: 'secret-token:aspen_x', instance: 'https://h/d/i', base: 'unset', bulk: '1',
  });
});

test('launcher: the env file fills in what the shell left unset, and the shell wins', () => {
  const config = scratch();
  fakeServerAt(join(config, 'mcp', 'aspen-runtime-mcp'));
  writeFileSync(join(config, 'mcp', 'env'), "ASPEN_INSTANCE='https://file/d/i'\nASPEN_API_BASE='/i/api/v24.3'\n");

  let r = run(launcher, [], env({ ASPEN_CONFIG_DIR: config }));
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(report(r.stdout), { args: '--stdio', token: 'unset', instance: 'https://file/d/i', base: '/i/api/v24.3', bulk: '1' });

  r = run(launcher, [], env({ ASPEN_CONFIG_DIR: config, ASPEN_INSTANCE: 'https://shell/d/i', ASPEN_API_BASE: '' }));
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(report(r.stdout), { args: '--stdio', token: 'unset', instance: 'https://shell/d/i', base: '/i/api/v24.3', bulk: '1' });
});

// --- installer ----------------------------------------------------------------

test('installer: refuses contradictory or unknown options, prints usage on --help', () => {
  const e = env({ ASPEN_CONFIG_DIR: scratch() });
  let r = run(installer, ['--file', 'x.mcpb', '--version', '1.0.0'], e);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--file and --version/);

  r = run(installer, ['--bogus'], e);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown option: --bogus/);

  r = run(installer, ['--help'], e);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^usage: install-runtime-mcp\.sh/);
});

test('installer: a file that is not a bundle is refused before anything is written', { skip: !haveZip && 'zip/unzip not available' }, () => {
  const config = scratch();
  const notABundle = join(scratch(), 'x.mcpb');
  writeFileSync(notABundle, 'nope');
  const r = run(installer, ['--file', notABundle], env({ ASPEN_CONFIG_DIR: config }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /not an \.mcpb bundle/);
  assert.ok(!existsSync(join(config, 'mcp', 'aspen-runtime-mcp')));
});

test('installer + launcher, end to end on a fake bundle', { skip: !haveZip && 'zip/unzip not available' }, () => {
  const config = scratch();
  const bundle = fakeBundle(scratch());
  const e = env({ ASPEN_CONFIG_DIR: config });

  const r = run(installer, ['--file', bundle, '--instance', 'https://h/d/i/'], e);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Installed Aspen Runtime MCP 9\.9\.9 \(aspen-runtime-mcp 9\.9\.9\)/);
  assert.match(r.stdout, /claude mcp add --scope user aspen-runtime-mcp/);

  const bin = join(config, 'mcp', 'aspen-runtime-mcp');
  assert.ok(statSync(bin).mode & 0o111, 'server is executable');

  const envFile = join(config, 'mcp', 'env');
  assert.equal(statSync(envFile).mode & 0o777, 0o600, 'env file is private');
  assert.equal(readFileSync(envFile, 'utf8'), "ASPEN_INSTANCE='https://h/d/i'\n", 'trailing slash dropped');

  // Re-installing keeps what the user added by hand and replaces only the keys given.
  writeFileSync(envFile, readFileSync(envFile, 'utf8') + "ASPEN_API_TOKEN='secret-token:aspen_kept'\n", { mode: 0o600 });
  const again = run(installer, ['--file', bundle, '--instance', 'https://h/d/j', '--api-base', '/i/api/v24.3'], e);
  assert.equal(again.status, 0, again.stderr);
  const lines = readFileSync(envFile, 'utf8').trim().split('\n').sort();
  assert.deepEqual(lines, [
    "ASPEN_API_BASE='/i/api/v24.3'",
    "ASPEN_API_TOKEN='secret-token:aspen_kept'",
    "ASPEN_INSTANCE='https://h/d/j'",
  ]);

  // And the launcher runs what was installed, with the recorded identity.
  const launched = run(launcher, [], e);
  assert.equal(launched.status, 0, launched.stderr);
  assert.deepEqual(report(launched.stdout), {
    args: '--stdio', token: 'secret-token:aspen_kept', instance: 'https://h/d/j', base: '/i/api/v24.3', bulk: '1',
  });
});

test('installer: an instance URL without domain and instance segments gets a warning, not a refusal', { skip: !haveZip && 'zip/unzip not available' }, () => {
  const config = scratch();
  const r = run(installer, ['--file', fakeBundle(scratch()), '--instance', 'https://host.only'], env({ ASPEN_CONFIG_DIR: config }));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /does not look like one/);
  assert.equal(readFileSync(join(config, 'mcp', 'env'), 'utf8'), "ASPEN_INSTANCE='https://host.only'\n");
});
