// Every hook decides "am I being run, or imported?" before it does anything. Get that
// test wrong and the hook is not broken in a way anyone notices -- `node` exits 0, the
// host sees no output, and the guard is simply absent. The 2.5.0/2.6.0 token guard
// shipped that way to every Windows user: `import.meta.url === `file://${argv[1]}``
// compares a percent-encoded URL against a raw OS path, which on Windows is never equal
// (`file:///C:/Users/A%20B/h.mjs` vs `C:\Users\A B\h.mjs`), and on POSIX is unequal the
// moment the path holds a space or any non-ASCII character.
//
// The other guard tests run the hooks from the repo, whose path has neither, so they
// cannot see this. These run each hook from a directory with a space in its name: that
// reproduces the encoding half of the bug on POSIX, and on Windows the drive-letter and
// backslash halves come for free.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const HOOKS = join(HERE, '..', 'hooks')

// Each hook, with a payload it is known to act on -- see the per-hook tests for why.
const CASES = [
  {
    hook: 'guard-metadata-writes.mjs',
    payload: { tool_input: { file_path: '/x/metacode/active/object_p/org_c.json' } },
    decision: 'deny'
  },
  {
    hook: 'guard-destructive.mjs',
    payload: { tool_input: { command: 'aspen move checkin-clear' } },
    decision: 'ask'
  },
  {
    hook: 'guard-ui-tokens.mjs',
    // The token inventory does not come along to the temp dir; loadTokenNames() tolerates
    // that and returns an empty set, and a hardcoded hex is flagged without it.
    payload: { tool_input: { file_path: '/x/metacode/ui/panel.css', content: 'a { color: #ff0000 }' } },
    decision: 'deny'
  },
  {
    hook: 'guard-custom-ui-surface.mjs',
    // Nothing is on disk at that path in the temp dir, so every surface in the payload reads
    // as new -- which is what this hook is for. It needs no files alongside it.
    payload: {
      tool_input: {
        file_path: '/x/metacode/metadata/tab_p/budget_c.tab_c.json',
        content: '{"ctype":"tab_p","name":"budget_c.tab_c","tab-type":"custom_page"}'
      }
    },
    decision: 'ask'
  },
  {
    hook: 'guard-footprint.mjs',
    // It imports afterText from guard-custom-ui-surface.mjs, so the copy in the temp dir has
    // to bring its sibling -- see `also` below. Nothing is on disk at the path, so the object
    // reads as new, and `deal` hits the synonym table without needing a platform tier present.
    also: ['guard-custom-ui-surface.mjs'],
    payload: {
      tool_input: {
        file_path: '/x/metacode/metadata/object_p/deal_c.json',
        content: '{"ctype":"object_p","name":"deal_c","fields":[{"name":"amount_c"},{"name":"stage_c"}]}'
      }
    },
    decision: 'ask'
  }
]

for (const { hook, payload, decision, also } of CASES) {
  test(`${hook} still runs its body from a path with a space`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'aspen hooks '))
    try {
      const copy = join(dir, hook)
      copyFileSync(join(HOOKS, hook), copy)
      for (const sibling of also ?? []) copyFileSync(join(HOOKS, sibling), join(dir, sibling))
      const stdout = execFileSync('node', [copy], {
        input: JSON.stringify(payload),
        encoding: 'utf8'
      })
      assert.notEqual(stdout.trim(), '', 'hook produced no output: its entrypoint check did not match')
      assert.equal(JSON.parse(stdout).hookSpecificOutput.permissionDecision, decision)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
}

// session-start.mjs takes no stdin and stays silent outside an instance folder, so it has
// no payload that proves the body ran. What it does have is a distinct failure shape: a
// hook whose entrypoint never matches cannot have imported node:url either. Assert the
// idiom directly across all four, which is the thing that actually regressed.
test('no hook builds its entrypoint URL by concatenating onto file://', () => {
  const hooks = [...CASES.map((c) => c.hook), 'session-start.mjs']
  for (const hook of hooks) {
    const source = readFileSync(join(HOOKS, hook), 'utf8')
    assert.doesNotMatch(source, /file:\/\/\$\{process\.argv\[1\]\}/, `${hook} compares import.meta.url against a raw path`)
    assert.match(source, /function invokedDirectly/, `${hook} should use the symlink- and encoding-safe entrypoint check`)
  }
})
