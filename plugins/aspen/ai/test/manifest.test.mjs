// The manifest limits a host enforces at load time, checked against every copy of the
// manifest a user can end up with: the plugin's own two, the root marketplace entry, and the
// one-plugin marketplace the packager generates into the zip. `claude plugin validate` does
// not check the description length; a 519-character one once shipped and no host loaded it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(root, '..', '..', '..');
const MAX_DESCRIPTION = 500;

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const claudeManifest = readJson(join(root, '.claude-plugin', 'plugin.json'));
const codexManifest = readJson(join(root, '.codex-plugin', 'plugin.json'));

function pack(target, t) {
  const out = mkdtempSync(join(tmpdir(), 'aspencrm-ai-pkg-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  // Run the script itself, never `sh <script>`: it needs bash's pipefail, which dash refuses.
  // The out dir is the second argument; there is no DIST variable.
  const packaged = execFileSync(join(repo, 'scripts', 'package-plugin.sh'),
    [join('plugins', 'aspen', 'ai'), out, target], { cwd: repo, encoding: 'utf8' });
  const zip = packaged.split('\n')[0].split('->').pop().trim();
  const members = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).split('\n').filter(Boolean);
  return { zip, members };
}

test('both manifests name the same plugin at the same version', () => {
  assert.equal(claudeManifest.name, 'aspencrm-ai');
  assert.equal(codexManifest.name, claudeManifest.name);
  assert.equal(codexManifest.version, claudeManifest.version);
});

test('the plugin carries no server wiring', () => {
  // The connector's URL differs per instance, so the host adds it; a launcher here would
  // either fail or list every tool twice.
  assert.equal(claudeManifest.mcpServers, undefined);
  assert.equal(codexManifest.mcpServers, undefined);
  assert.equal(spawnSync('test', ['-e', join(root, '.mcp.json')]).status, 1);
});

test('every description fits what a host will load', () => {
  for (const [where, description] of [
    ['.claude-plugin/plugin.json', claudeManifest.description],
    ['.codex-plugin/plugin.json', codexManifest.description],
    ['.codex-plugin interface.longDescription', codexManifest.interface.longDescription],
  ]) {
    assert.ok(description.length <= MAX_DESCRIPTION, `${where} is ${description.length} chars`);
  }
  for (const entry of readJson(join(repo, '.claude-plugin', 'marketplace.json')).plugins) {
    assert.ok(entry.description.length <= MAX_DESCRIPTION, `marketplace entry ${entry.name}`);
  }
});

test('the Cowork zip carries the skills, the agent and its own marketplace', (t) => {
  // package-plugin.sh validates the staged plugin with `claude plugin validate`. CI installs
  // the CLI; locally a missing one is a skip, but never in CI, where it is a broken workflow.
  const haveClaude = spawnSync('claude', ['--version'], { stdio: 'ignore' }).status === 0;
  if (!haveClaude && !process.env.CI) {
    t.skip('no `claude` on PATH — install the Claude Code CLI to run the packaging test');
    return;
  }
  const { zip, members } = pack('cowork', t);
  assert.ok(members.includes('.claude-plugin/plugin.json'));
  assert.ok(members.includes('.claude-plugin/marketplace.json'));
  assert.ok(members.includes('agents/schema-explorer.md'));
  assert.ok(members.includes('skills/using-aspencrm-ai/SKILL.md'));
  assert.ok(!members.some((m) => m.startsWith('.codex-plugin/') || m.startsWith('test/')));
  for (const member of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
    const doc = JSON.parse(execFileSync('unzip', ['-p', zip, member], { encoding: 'utf8' }));
    for (const entry of doc.plugins ?? [doc]) {
      assert.ok(entry.description.length <= MAX_DESCRIPTION, `${member}: ${entry.description.length} chars`);
    }
  }
});

test('the Codex zip carries the skills and the Codex manifest only', (t) => {
  const { members } = pack('codex', t);
  assert.ok(members.includes('.codex-plugin/plugin.json'));
  assert.ok(members.includes('skills/schema-explorer/SKILL.md'));
  assert.ok(!members.some((m) => m.startsWith('.claude-plugin/') || m.startsWith('agents/') || m.startsWith('test/')));
});
