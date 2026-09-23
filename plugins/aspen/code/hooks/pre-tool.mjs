#!/usr/bin/env node
// Host adapter. The policy checks remain shared with the original Claude entrypoints.
import { pathToFileURL } from 'node:url'
import { realpathSync } from 'node:fs'
import { decide as metadata } from './guard-metadata-writes.mjs'
import { decide as styling, contentOf, isWholeFile } from './guard-ui-tokens.mjs'
import { decide as surface } from './guard-custom-ui-surface.mjs'
import { decide as footprint } from './guard-footprint.mjs'
import { decide as destructive } from './guard-destructive.mjs'
import { patchFiles, filePath, readText } from './patch-input.mjs'

const result = fields => ({ hookSpecificOutput: { hookEventName: 'PreToolUse', ...fields } })
const deny = reason => result({ permissionDecision: 'deny', permissionDecisionReason: reason })
export function evaluate(payload, env = process.env) {
  const codex = Boolean(env.PLUGIN_ROOT || payload.turn_id || payload.tool_name === 'apply_patch')
  const input = payload.tool_input ?? {}
  if (payload.tool_name === 'Bash' || payload.tool_name === 'exec_command') {
    const reason = destructive(input.command ?? input.cmd)
    if (!reason) return null
    return codex
      ? deny(`${reason}\nAfter the user explicitly authorizes this recovery, use the using-aspen skill's recover.mjs helper with --confirmed and the exact recovery verb. Codex does not support a hook's ask decision.`)
      : result({ permissionDecision: 'ask', permissionDecisionReason: reason })
  }
  let files
  const cwd = payload.cwd || process.cwd()
  try {
    files = payload.tool_name === 'apply_patch'
      ? patchFiles(input.command, cwd)
      : input.file_path ? [{ path: filePath(input.file_path, cwd), input }] : []
  } catch (error) { return deny(`Aspen could not inspect the patch: ${error.message}`) }
  const hard = [], advisory = []
  for (const change of files) {
    for (const path of new Set([change.source, change.path].filter(Boolean))) {
      const reason = metadata(path)
      if (reason) hard.push(reason)
    }
    if (change.deleted) continue
    const toolInput = change.input ?? { content: change.content }
    const reason = styling(change.path, contentOf(toolInput), undefined, isWholeFile(toolInput))
    if (reason) hard.push(reason)
    const read = change.input ? readText : path => path === change.path ? change.before : readText(path)
    for (const check of [surface, footprint]) {
      const reason = check(change.path, toolInput, read)
      if (reason) advisory.push(reason)
    }
  }
  if (hard.length) return deny([...new Set(hard)].join('\n\n'))
  if (!advisory.length) return null
  const reason = [...new Set(advisory)].join('\n\n')
  return codex ? result({ additionalContext: reason }) : result({ permissionDecision: 'ask', permissionDecisionReason: reason })
}
function invokedDirectly() {
  try { return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href } catch { return false }
}
if (invokedDirectly()) {
  try {
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    const output = evaluate(JSON.parse(Buffer.concat(chunks).toString('utf8')))
    if (output) process.stdout.write(JSON.stringify(output))
  } catch (error) { process.stdout.write(JSON.stringify(deny(`Aspen could not inspect the tool input: ${error.message}`))) }
}
