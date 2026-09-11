import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { context } from '../hooks/session-start.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, '..', 'hooks', 'session-start.mjs')

// A Builder-style instance folder with a stub `aspen` CLI that echoes its args, so we can
// assert the hook shells out to the real binary path and injects what it prints.
function instanceFolder ({ withCli = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'aspen-ss-'))
  mkdirSync(join(dir, 'metacode', 'compiled'), { recursive: true })
  if (withCli) {
    const bin = join(dir, '.aspen', 'bin')
    mkdirSync(bin, { recursive: true })
    const cli = join(bin, 'aspen')
    // Prints a recognizable line per help invocation.
    writeFileSync(cli, '#!/bin/sh\necho "HELP $*"\n')
    chmodSync(cli, 0o755)
  } else {
    mkdirSync(join(dir, '.aspen'), { recursive: true })
  }
  return dir
}

test('in an instance folder with the CLI, it points at the skill and injects both help outputs', () => {
  const out = context(instanceFolder())
  assert.match(out, /invoke the `using-aspen` skill/)
  assert.match(out, /\.aspen\/bin\/aspen/)
  assert.match(out, /\$ aspen --help/)
  assert.match(out, /HELP/)
  assert.match(out, /\$ aspen move --help/)
  assert.match(out, /HELP move/)
})

test('in an instance folder with no CLI yet, it still routes to the skill without help blocks', () => {
  const out = context(instanceFolder({ withCli: false }))
  assert.match(out, /invoke the `using-aspen` skill/)
  assert.doesNotMatch(out, /\$ aspen --help/)
})

test('from ~/Aspen with instance folders, it lists them and says to reopen', () => {
  const home = mkdtempSync(join(tmpdir(), 'home-'))
  const root = join(home, 'Aspen')
  mkdirSync(join(root, 'veeva.com-treehouse', 'metacode'), { recursive: true })
  mkdirSync(join(root, 'veeva.com-oak', 'metacode'), { recursive: true })
  // context() reads $HOME via os.homedir(); run the script with HOME overridden instead.
  const out = execFileSync('node', [SCRIPT], { cwd: root, encoding: 'utf8', env: { ...process.env, HOME: home } })
  assert.match(out, /reopen/)
  assert.match(out, /veeva\.com-treehouse/)
  assert.match(out, /veeva\.com-oak/)
})

test('from an unrelated directory, it stays silent (no output)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'unrelated-'))
  const out = execFileSync('node', [SCRIPT], { cwd: dir, encoding: 'utf8' })
  assert.equal(out, '')
})

test('the emitted payload is the SessionStart additionalContext envelope', () => {
  const out = execFileSync('node', [SCRIPT], { cwd: instanceFolder(), encoding: 'utf8' })
  const payload = JSON.parse(out)
  assert.equal(payload.hookSpecificOutput.hookEventName, 'SessionStart')
  assert.match(payload.hookSpecificOutput.additionalContext, /using-aspen/)
})
