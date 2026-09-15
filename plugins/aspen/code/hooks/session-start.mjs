#!/usr/bin/env node
// SessionStart: hand the model what it would otherwise spend minutes discovering.
//
// In an instance folder, the CLI's commands are the one thing that is dynamic and worth
// reading fresh -- so this runs `aspen --help` and `aspen move --help` ONCE, at session
// start, and injects them. The model then never re-reads help mid-task (a real session
// read it 22 times). Everything else it needs -- the folder map, the loop, the rules --
// is static and lives in the `using-aspen` skill.
//
// It also says, in one line, which of three optional pieces the folder does not have yet:
// the Rust toolchain pin, the server crate, the offline validator. Each is silent when
// missing -- a crate without the pin compiles and then dies at componentization with an
// error naming wit-bindgen, which a real session chased through lockfile diffs for six
// calls -- so the cheapest place to notice is before the first command, not after it.
// The hook only reports; the skill says how to add each, and Builder owns the folder.
//
// Outside an instance folder, it points the human at the right one. It never builds an
// index, never authors, never deploys, and fails quiet: a crash here must be quieter
// than the value it adds.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { homedir } from 'node:os'

const ASPEN_HOME = 'Aspen'
const isDir = (p) => { try { return statSync(p).isDirectory() } catch { return false } }
// Compare resolved paths: a symlinked home (or /var -> /private/var on macOS) otherwise
// makes cwd and ~/Aspen look different when they are the same place.
const real = (p) => { try { return realpathSync(p) } catch { return p } }
const subdirs = (p) => { try { return readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => join(p, e.name)) } catch { return [] } }

// A Builder instance folder holds `metacode/` and Builder's `.aspen/` cache.
const isInstanceFolder = (dir) => isDir(join(dir, 'metacode')) || isDir(join(dir, '.aspen'))

// The CLI Builder installs inside the instance folder. Not on PATH by design.
const cliPath = (cwd) => {
  for (const name of ['aspen', 'aspen.exe']) {
    const p = join(cwd, '.aspen', 'bin', name)
    if (existsSync(p)) return p
  }
  return null
}

// Optional pieces of an instance folder, each checked by the one path that proves it.
// Order is the order a trigger session needs them; the validator last because it is
// wanted for every metadata deploy, triggers or not.
const OPTIONAL = [
  { path: 'rust-toolchain.toml', label: '`rust-toolchain.toml` (a trigger crate fails componentization without it)' },
  { path: join('metacode', 'server', 'server_main_c'), label: '`metacode/server/server_main_c/` (no trigger crate)' },
  { path: 'ac', label: '`./ac` (the offline validator; `aspen download ac`)' }
]

export const missing = (cwd) => OPTIONAL
  .filter((o) => !existsSync(join(cwd, o.path)) && !existsSync(join(cwd, `${o.path}.exe`)))
  .map((o) => o.label)

const help = (cli, args) => {
  try {
    // Plain form, not `--agent yes`: the agent form truncates the move subcommand list,
    // and the checkin chain is exactly what the recipe needs.
    return execFileSync(cli, args, { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch { return null }
}

export function context (cwd) {
  if (!isInstanceFolder(cwd)) {
    // Only speak up from the two places a person lands by mistake; an Aspen notice in an
    // unrelated repo would be noise every session forever.
    const root = join(homedir(), ASPEN_HOME)
    const here = real(cwd)
    if (here !== real(root) && here !== real(homedir())) return ''
    const instances = subdirs(root).filter(isInstanceFolder).map((d) => basename(d))
    if (!instances.length) return ''
    return 'No Aspen metadata here. Builder keeps each instance in its own folder under ' +
      `\`~/${ASPEN_HOME}\`: ${instances.map((n) => `\`${n}\``).join(', ')}. Aspen work happens with ` +
      'Claude Code rooted in one of those — ask the human to reopen it there rather than working here.'
  }

  const cli = cliPath(cwd)
  const lines = [`You are in the Aspen instance folder \`${basename(cwd)}\`. For any change to this instance, invoke the \`using-aspen\` skill — it is the whole procedure.`]
  if (cli) {
    const top = help(cli, ['--help'])
    const move = help(cli, ['move', '--help'])
    if (top || move) {
      lines.push('', 'The CLI is `.aspen/bin/aspen` (not on PATH). Its commands, read just now — use these, do not re-read help mid-task:')
      if (top) lines.push('', '```', '$ aspen --help', top, '```')
      if (move) lines.push('', '```', '$ aspen move --help', move, '```')
    }
  }
  const absent = missing(cwd)
  if (absent.length) {
    lines.push('', `Not in this folder yet: ${absent.join('; ')}. The skill says how to add each, when a task needs it.`)
  }
  return lines.join('\n')
}

function main () {
  let text = ''
  try { text = context(process.cwd()) } catch { text = '' }
  if (text) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text }
    }))
  }
  process.exit(0)
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main()
