#!/usr/bin/env node
// PreToolUse (Write, Edit) guard for the generated tiers of a metacode/ tree.
//
// `platform/`, `compiled/`, and `active/` are read-only siblings of `metadata/` -- the skill
// says so, but a session that writes there anyway does not get an error to learn from. The
// write reports success and the file is gone by the next read: nothing re-derives it, so
// there is no signal that it never persisted. A real session wrote all 8 files of a new
// object into `active/`, watched `aspen move save-package` fail four times on path
// guesses, then discovered by `cp`ing one back out that the source was never there.
//
// The fix is not a stronger warning -- the loop already names this rule -- it is removing
// the chance to get it wrong. This denies, not asks: unlike the shared-state commands in
// guard-destructive.mjs, there is no legitimate reason to write into a generated tier, so
// there is nothing for a human to weigh in on. It hands back the one authored path that
// would have worked, computed from the path the model already had, so recovery costs one
// turn instead of a `find` and a `cp`.

const GENERATED_TIER = /(^|[/\\])metacode[/\\](platform|compiled|active)([/\\]|$)/

export function decide (filePath) {
  const path = String(filePath ?? '')
  const match = path.match(GENERATED_TIER)
  if (!match) return null
  const tier = match[2]
  const authored = path.replace(GENERATED_TIER, (_full, pre, _tier, post) => `${pre}metacode/metadata${post}`)
  return `\`${tier}/\` is generated, not authored — a write here reports success but does not persist ` +
    `and will not deploy. Author into the \`metadata/\` sibling instead: \`${authored}\`.`
}

export const deny = (reason) => JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
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
    const reason = decide(payload?.tool_input?.file_path)
    if (reason) process.stdout.write(deny(reason))
  } catch { /* a guard that crashes must not take the session with it */ }
  process.exit(0)
}
