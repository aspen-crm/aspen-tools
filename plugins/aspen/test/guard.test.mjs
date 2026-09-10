import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { decide, normalize } from '../hooks/guard-destructive.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, '..', 'hooks', 'guard-destructive.mjs')

// Run the hook the way Claude Code runs it: a PreToolUse payload on stdin.
function run (command) {
  const stdout = execFileSync('node', [SCRIPT], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    encoding: 'utf8'
  })
  return stdout ? JSON.parse(stdout) : null
}

const asks = (command) => decide(command) !== null

// ---- the shared dev set -----------------------------------------------------

test('checkin-clear and clear-package ask', () => {
  assert.ok(asks('aspen move checkin-clear'))
  assert.ok(asks('aspen move clear-package'))
})

test('a quoted verb does not slip past', () => {
  // The scar this guard inherits: a guard that folded spaces and nothing else let
  // `--to "prod"` through, which is exactly the form a careful agent writes.
  assert.ok(asks('aspen move "checkin-clear"'))
  assert.ok(asks("aspen move 'clear-package'"))
})

test('whitespace and case do not get past it', () => {
  assert.ok(asks('aspen\tmove   checkin-clear'))
  assert.ok(asks('ASPEN MOVE CHECKIN-CLEAR'))
  assert.ok(asks('aspen  move \\\n  checkin-clear'))
})

test('an absolute path to the binary still matches', () => {
  assert.ok(asks('/Users/x/.local/bin/aspen move checkin-clear --debug'))
})

// ---- what must NOT prompt ---------------------------------------------------

test('help is documentation, not an action', () => {
  assert.equal(decide('aspen move checkin-clear --help'), null)
  assert.equal(decide('aspen move clear-package -h'), null)
})

test('help cannot be chained in front of the real verb to buy a pass', () => {
  assert.ok(asks('aspen --help && aspen move checkin-clear'))
  assert.ok(asks('echo -h ; aspen move clear-package'))
})

test('the non-destructive verbs are left alone', () => {
  for (const cmd of [
    'aspen --help',
    'aspen move download-active-set --platform-dir ./metacode/platform',
    'aspen move save-package',
    'aspen move checkin-prep',
    'aspen move checkin-deploy',
    'aspen compile',
    'git status'
  ]) assert.equal(decide(cmd), null, cmd)
})

// ---- record writes ----------------------------------------------------------

test('an unconfirmed write is a dry run and gets no prompt', () => {
  // aspenx refuses these and sends nothing, so prompting would be pure friction.
  assert.equal(decide('aspenx record create account_p --data \'{"name_c":"Acme"}\''), null)
  assert.equal(decide('aspenx record delete account_p --id abc'), null)
})

test('a confirmed write asks', () => {
  assert.ok(asks('aspenx record create account_p --data \'{"name_c":"Acme"}\' --confirmed'))
  assert.ok(asks('aspenx record update account_p --data \'{"id_p":"x"}\' --confirmed'))
})

test('a confirmed delete says it cannot be undone', () => {
  const reason = decide('aspenx record delete account_p --id abc --confirmed')
  assert.match(reason, /cannot be undone/)
})

test('reads are never gated', () => {
  assert.equal(decide("aspenx record query --aql 'SELECT id_p FROM account_p'"), null)
  assert.equal(decide('aspenx describe object_p'), null)
})

// ---- the contract with the host ---------------------------------------------

test('it asks, never denies', () => {
  const out = run('aspen move checkin-clear')
  assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse')
  assert.equal(out.hookSpecificOutput.permissionDecision, 'ask')
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /every builder|another builder/)
})

test('an allowed command produces no output at all', () => {
  assert.equal(run('git status'), null)
})

test('a malformed payload exits clean rather than wedging the session', () => {
  const stdout = execFileSync('node', [SCRIPT], { input: 'not json', encoding: 'utf8' })
  assert.equal(stdout, '')
  assert.equal(decide(undefined), null)
  assert.equal(normalize(undefined), '')
})
