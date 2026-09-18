// The manifest limits a host enforces at load time. `claude plugin validate`
// does NOT check the description length, and nothing else here did either, so
// 0.6.0 shipped a 519-character description that hosts refuse to load. These
// assert the limits against every copy of the manifest a user can end up with:
// the plugin's own, the root marketplace entry, and — because the packager
// generates a one-plugin marketplace from plugin.json — the packaged zip's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(root, '..', '..', '..');

// The host's cap. A description at or under it loads; over it, the plugin does not.
const MAX_DESCRIPTION = 500;

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

test('the plugin description fits what a host will load', () => {
  const manifest = readJson(join(root, '.claude-plugin', 'plugin.json'));
  assert.ok(
    manifest.description.length <= MAX_DESCRIPTION,
    `plugin.json description is ${manifest.description.length} chars, over the ${MAX_DESCRIPTION} limit — a host refuses to load it`,
  );
});

test('every marketplace entry fits too', () => {
  const marketplace = readJson(join(repo, '.claude-plugin', 'marketplace.json'));
  for (const entry of marketplace.plugins ?? []) {
    if (!entry.description) continue;
    assert.ok(
      entry.description.length <= MAX_DESCRIPTION,
      `marketplace entry ${entry.name} description is ${entry.description.length} chars, over the ${MAX_DESCRIPTION} limit`,
    );
  }
});

// The zip is the delivery for Cowork, and the packager writes its own
// marketplace.json from plugin.json — so a description that passes above can
// still ship broken if that generation ever diverges. Build one and look.
test('the packaged zip carries manifests within the limit', (t) => {
  // package-plugin.sh validates the staged plugin with `claude plugin validate`, so
  // this test needs the CLI. CI installs it; a contributor without it gets a skip
  // rather than a confusing "validation failed". Never skip in CI, where the install
  // step means a missing CLI is a broken workflow, not a missing local tool.
  const haveClaude = spawnSync('claude', ['--version'], { stdio: 'ignore' }).status === 0;
  if (!haveClaude && !process.env.CI) {
    t.skip('no `claude` on PATH — install the Claude Code CLI to run the packaging test');
    return;
  }
  const out = mkdtempSync(join(tmpdir(), 'cowork-pkg-'));
  // Run the script itself, NOT `sh <script>`: its shebang is bash and it needs
  // `set -o pipefail`, which dash refuses ("Illegal option -o pipefail"). On macOS
  // `sh` is bash and this passed locally while every Ubuntu CI run failed. The
  // runbook invokes it as `./scripts/package-plugin.sh` too, so this is also the
  // real invocation rather than one only the test uses.
  // The out dir is the second ARGUMENT — there is no DIST environment variable, so
  // passing one wrote the zip into the repo's own dist/ and read it back from there.
  const packaged = execFileSync(
    join(repo, 'scripts', 'package-plugin.sh'),
    [join('plugins', 'aspen', 'cowork'), out],
    { cwd: repo, encoding: 'utf8' },
  );
  const zip = packaged.split('\n')[0].split('->').pop().trim();

  for (const member of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
    const raw = execFileSync('unzip', ['-p', zip, member], { encoding: 'utf8' });
    const doc = JSON.parse(raw);
    for (const entry of doc.plugins ?? [doc]) {
      if (!entry.description) continue;
      assert.ok(
        entry.description.length <= MAX_DESCRIPTION,
        `${member} description is ${entry.description.length} chars, over the ${MAX_DESCRIPTION} limit`,
      );
    }
  }
});
