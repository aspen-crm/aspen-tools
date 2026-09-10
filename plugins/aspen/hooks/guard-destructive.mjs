#!/usr/bin/env node
// PreToolUse (Bash) guard for the commands whose effects reach past the person running
// them: the instance's shared dev set.
//
// Record writes are deliberately NOT guarded here. The `aspen` CLI has no record verbs at
// all, so there is no command shape to match, and a rule matching a tool this toolchain
// does not have would be worse than no rule -- it would read as though record writes were
// covered when nothing is. `verify-change` owns that gate, in the conversation.
//
// It never blocks. Every match returns `permissionDecision: "ask"`, which puts the
// decision in front of the human rather than refusing what is often a legitimate
// recovery. A host that does not understand the field sees a plain exit 0, so an
// unrecognized field degrades to "allowed" -- this hook cannot wedge a session, and a
// crash in it is silent for the same reason.
//
// The skills say to confirm before these commands. That makes it a property of the
// model's diligence; this makes it a property of the system.

// Match on what a command MEANS, not on one spelling of it.
//
// Order matters. Line continuations go first: a backslash-newline is nothing at all to
// the shell, but folding it as plain whitespace leaves a stray backslash sitting in the middle
// of the verb, and `aspen move \ checkin-clear` then matches nothing. Quotes go next,
// because `aspen move "checkin-clear"` is what a careful agent writes and a naive
// substring match sails straight past it. Then whitespace, so a tab cannot split a verb.
// Case goes last.
export const normalize = (command) => String(command ?? '')
  .replace(/\\\r?\n/g, ' ')
  .replace(/["'`]/g, '')
  .replace(/\s+/g, ' ')
  .toLowerCase()
  .trim()

const COMPOUND = /[;&|]/
const HELP = /(?:^|\s)(?:--help|-h)(?:\s|$)/

// Verbs that reach the dev set every builder on the instance shares. Both are real
// recovery paths, so neither is blocked -- the human just has to be the one to choose.
const SHARED_STATE = [
  {
    verb: 'aspen move checkin-clear',
    reason: '`aspen move checkin-clear` halts the checkin that is currently running and erases the dev AND dev-checkin sets on this instance -- not just this project\'s package. Whatever another builder has staged goes with it. Confirm with whoever else works on this instance before running it.'
  },
  {
    verb: 'aspen move clear-package',
    reason: '`aspen move clear-package` clears this package out of the instance\'s dev set, which is shared with every builder on the instance. Confirm that nobody is mid-checkin before running it.'
  }
]

export function decide (command) {
  const norm = normalize(command)

  // `--help` is documentation, not an action. Only exempt it on a single simple command:
  // `foo --help && aspen move checkin-clear` must not buy its way past the guard.
  if (!COMPOUND.test(norm) && HELP.test(norm)) return null

  for (const rule of SHARED_STATE) {
    if (norm.includes(rule.verb)) return rule.reason
  }
  return null
}

export const ask = (reason) => JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'ask',
    permissionDecisionReason: reason
  }
})

async function readStdin () {
  if (process.stdin.isTTY) return {}
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { return {} }
}

// Only run as a CLI, so importing this module from tests has no side effects.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  try {
    const payload = await readStdin()
    const reason = decide(payload?.tool_input?.command)
    if (reason) process.stdout.write(ask(reason))
  } catch { /* a guard that crashes must not take the session with it */ }
  process.exit(0)
}
