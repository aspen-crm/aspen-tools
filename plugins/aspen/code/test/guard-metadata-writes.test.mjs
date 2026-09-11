import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { decide } from '../hooks/guard-metadata-writes.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, '..', 'hooks', 'guard-metadata-writes.mjs')

// Run the hook the way Claude Code runs it: a PreToolUse payload on stdin.
function run (toolName, filePath) {
  const stdout = execFileSync('node', [SCRIPT], {
    input: JSON.stringify({ tool_name: toolName, tool_input: { file_path: filePath } }),
    encoding: 'utf8'
  })
  return stdout ? JSON.parse(stdout) : null
}

const denies = (filePath) => decide(filePath) !== null

// ---- the generated tiers -----------------------------------------------------

test('active, platform, and compiled are all denied', () => {
  assert.ok(denies('/Users/x/Aspen/test3/metacode/active/object_p/org_c.json'))
  assert.ok(denies('/Users/x/Aspen/test3/metacode/platform/object_p/org_c.json'))
  assert.ok(denies('/Users/x/Aspen/test3/metacode/compiled/object_p/org_c.json'))
})

test('the reason names the tier and hands back the metadata/ path that works', () => {
  const reason = decide('/Users/x/Aspen/test3/metacode/active/object_p/org_c.json')
  assert.match(reason, /active\//)
  assert.match(reason, /does not persist/)
  assert.match(reason, /\/Users\/x\/Aspen\/test3\/metacode\/metadata\/object_p\/org_c\.json/)
})

test('a nested path under the tier is still caught', () => {
  assert.ok(denies('/Users/x/Aspen/test3/metacode/active/picklist_p/org_c.status_c.json'))
})

// ---- what must NOT be denied --------------------------------------------------

test('metadata/, server/, and ui/ are left alone', () => {
  for (const p of [
    '/Users/x/Aspen/test3/metacode/metadata/object_p/org_c.json',
    '/Users/x/Aspen/test3/metacode/server/server_main_c/src/lib.rs',
    '/Users/x/Aspen/test3/metacode/ui/ui_main_c/src/pages/org.tsx'
  ]) assert.equal(decide(p), null, p)
})

test('a component whose name merely contains a tier word does not false-positive', () => {
  // "compiled_report_c" and "active_status_c" are plausible custom names; only a path
  // SEGMENT equal to platform/compiled/active must match, not a substring of one.
  assert.equal(decide('/Users/x/Aspen/test3/metacode/metadata/object_p/compiled_report_c.json'), null)
  assert.equal(decide('/Users/x/Aspen/test3/metacode/metadata/picklist_p/org_c.active_status_c.json'), null)
})

test('a file outside any instance folder is left alone', () => {
  assert.equal(decide('/Users/x/scratch/notes.md'), null)
})

// ---- the contract with the host ---------------------------------------------

test('it denies, not asks — there is no legitimate reason to write into a generated tier', () => {
  const out = run('Write', '/Users/x/Aspen/test3/metacode/active/object_p/org_c.json')
  assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse')
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny')
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /metadata\//)
})

test('Edit is covered the same way Write is', () => {
  const out = run('Edit', '/Users/x/Aspen/test3/metacode/platform/object_p/account_p.json')
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny')
})

test('an allowed write produces no output at all', () => {
  assert.equal(run('Write', '/Users/x/Aspen/test3/metacode/metadata/object_p/org_c.json'), null)
})

test('a malformed payload exits clean rather than wedging the session', () => {
  const stdout = execFileSync('node', [SCRIPT], { input: 'not json', encoding: 'utf8' })
  assert.equal(stdout, '')
  assert.equal(decide(undefined), null)
})
