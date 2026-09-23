import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { launchConfig } from '../bin/aspen-runtime-mcp.mjs';
import { main as bulk } from '../skills/bulk-data/scripts/aspen-data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'aspen codex runtime '));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
test('Codex launcher reads settings as data, keeps shell precedence, and defaults bulk on', t => {
  const dir = fixture(t);
  mkdirSync(join(dir, 'mcp'));
  writeFileSync(join(dir, 'mcp/env'), "ASPEN_INSTANCE='https://h/d/i'\nASPEN_API_TOKEN='test-token'\nASPEN_BULK_WRITES='1'\nPATH='/bad'\n");
  const c = launchConfig({ ASPEN_CONFIG_DIR: dir, ASPEN_API_TOKEN: '', ASPEN_BULK_WRITES: '0', PATH: '/real' }, 'win32');
  assert.equal(c.binary, join(dir, 'mcp/aspen-runtime-mcp.exe'));
  assert.equal(c.env.ASPEN_API_TOKEN, 'test-token');
  assert.equal(c.env.ASPEN_BULK_WRITES, '0');
  assert.equal(c.env.PATH, '/real');
  const clean = launchConfig({ ASPEN_CONFIG_DIR: fixture(t), ASPEN_API_TOKEN: '' }, 'linux');
  assert.equal(clean.env.ASPEN_API_TOKEN, undefined);
  assert.equal(clean.env.ASPEN_BULK_WRITES, '1');
});
test('Codex launcher starts a server without corrupting its stdout', t => {
  const dir = fixture(t);
  // Node itself is a portable fake server: --stdio is invalid, and its error stays on stderr.
  const result = spawnSync(process.execPath, [join(root, 'bin/aspen-runtime-mcp.mjs')], {
    env: { PATH: process.env.PATH, ASPEN_CONFIG_DIR: dir, ASPEN_RUNTIME_MCP: process.execPath }, encoding: 'utf8'
  });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /stdio/);
});
test('Codex missing-server diagnostics stay on stderr', t => {
  const result = spawnSync(process.execPath, [join(root, 'bin/aspen-runtime-mcp.mjs')], {
    env: { PATH: process.env.PATH, ASPEN_CONFIG_DIR: fixture(t) }, encoding: 'utf8'
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Install the runtime/);
});
test('bulk helper reads OS-keyring API keys and does not expose them', async t => {
  const dir = fixture(t);
  writeFileSync(join(dir, 'credentials.json'), JSON.stringify({ instance: 'https://stored/d/i', method: 'api_key', token_storage: 'keyring' }));
  const output = await bulk(['check'], { env: { ASPEN_CONFIG_DIR: dir, ASPEN_INSTANCE: 'https://stale/d/i' }, os: 'darwin',
    run: (command, args) => {
      assert.equal(command, 'security');
      assert.ok(args.includes('https://stored/d/i'));
      return { status: 0, stdout: 'a-secret-value\n' };
    }
  });
  assert.equal(output.instance, 'https://stored/d/i', 'stored token stays paired with its own instance');
  assert.equal(output.sources.token, 'aspen-cli');
  assert.ok(!JSON.stringify(output).includes('a-secret-value'));
});
test('bulk helper unwraps OAuth pairs and refuses expired credentials before network', async t => {
  const dir = fixture(t);
  const creds = { instance: 'https://h/d/i', method: 'o_auth', token_storage: 'file',
    token: JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }), access_expires_at: new Date(Date.now() + 120000).toISOString() };
  writeFileSync(join(dir, 'credentials.json'), JSON.stringify(creds));
  const env = { ASPEN_CONFIG_DIR: dir };
  await bulk(['count', '--aql', 'ROWCOUNT FROM contact_p'], { env, fetchImpl: async (_url, init) => {
    assert.equal(init.headers.Authorization, 'Bearer access');
    return { ok: true, status: 200, text: async () => '{"count":2}' };
  }});
  creds.access_expires_at = '2000-01-01T00:00:00Z';
  writeFileSync(join(dir, 'credentials.json'), JSON.stringify(creds));
  await assert.rejects(() => bulk(['count', '--aql', 'ROWCOUNT FROM contact_p'], { env,
    fetchImpl: () => assert.fail('must not call network') }), /expired/);
});
test('Codex MCP definition retains upload timeout and environment forwarding', () => {
  const manifest = JSON.parse(readFileSync(join(root, '.codex-plugin/plugin.json'), 'utf8'));
  const server = manifest.mcpServers['aspen-runtime-mcp'];
  assert.equal(server.command, 'node');
  assert.ok(server.tool_timeout_sec > 300);
  assert.ok(server.env_vars.includes('ASPEN_CONFIG_DIR'));
  assert.ok(server.args[0].endsWith('/bin/aspen-runtime-mcp.mjs'));
});
