#!/usr/bin/env node
// Explicit confirmation is a workflow assertion, like MCP's confirmed=true; it is
// not authentication. Only two known recovery operations can be executed here.
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function recover(args, run = spawnSync) {
  const [flag, verb, cli, ...extra] = args
  if (flag !== '--confirmed' || !['clear-package', 'checkin-clear'].includes(verb) || !cli || extra.length) {
    throw new Error('After explicit user authorization: recover.mjs --confirmed <clear-package|checkin-clear> <path-to-aspen>')
  }
  // argv, never a shell: approval of one recovery cannot append another operation.
  const result = run(resolve(cli), ['move', verb], { stdio: 'inherit', shell: false })
  if (result.error) throw result.error
  return result.status ?? 1
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = recover(process.argv.slice(2)) }
  catch (error) { console.error(error.message); process.exitCode = 2 }
}
