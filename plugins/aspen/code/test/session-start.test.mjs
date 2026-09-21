import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { context, missing } from '../hooks/session-start.mjs'

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
    // On Windows nothing interprets that shebang: execFileSync needs a real executable,
    // and a .cmd stub would need `shell: true`, which production deliberately does not
    // pass. The file still counts as "the CLI is present" there, which is all the other
    // tests need; only the one asserting on help OUTPUT is skipped. See STUB_RUNS.
  } else {
    mkdirSync(join(dir, '.aspen'), { recursive: true })
  }
  return dir
}

// The fixture CLI is a POSIX shebang script; only a POSIX host can actually run it. A real
// Windows instance folder holds `.aspen/bin/aspen.exe`, a compiled binary execFileSync runs
// fine, so this is a fixture limit, not a gap in what ships.
const STUB_RUNS = process.platform !== 'win32'

test('in an instance folder with the CLI, it points at the skill and injects both help outputs', { skip: STUB_RUNS ? false : 'the shebang stub CLI cannot execute on Windows' }, () => {
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

test('a bare instance folder is told which optional pieces it lacks, in one line', () => {
  const out = context(instanceFolder())
  const line = out.split('\n').find((l) => l.startsWith('Not in this folder yet:'))
  assert.ok(line, 'expected a single "Not in this folder yet" line')
  assert.match(line, /rust-toolchain\.toml/)
  assert.match(line, /server_main_c/)
  assert.match(line, /aspen download ac/)
})

test('a folder that has all three optional pieces gets no such line', () => {
  const dir = instanceFolder()
  writeFileSync(join(dir, 'rust-toolchain.toml'), '[toolchain]\nchannel = "1.98.0"\n')
  mkdirSync(join(dir, 'metacode', 'server', 'server_main_c'), { recursive: true })
  writeFileSync(join(dir, 'ac'), '')
  assert.deepEqual(missing(dir), [])
  assert.doesNotMatch(context(dir), /Not in this folder yet/)
})

test('a Windows validator (ac.exe) counts as present', () => {
  const dir = instanceFolder()
  writeFileSync(join(dir, 'ac.exe'), '')
  assert.ok(!missing(dir).some((l) => l.includes('./ac')))
})

test('from ~/Aspen with instance folders, it lists them and says to reopen', () => {
  const home = mkdtempSync(join(tmpdir(), 'home-'))
  const root = join(home, 'Aspen')
  mkdirSync(join(root, 'veeva.com-treehouse', 'metacode'), { recursive: true })
  mkdirSync(join(root, 'veeva.com-oak', 'metacode'), { recursive: true })
  // context() reads the home dir via os.homedir(), so run the script with it overridden.
  // Both names are needed: os.homedir() consults HOME on POSIX but USERPROFILE on Windows,
  // and setting only HOME there leaves it pointing at the real profile -- the fixture root
  // then is not ~/Aspen, context() correctly returns '', and the test fails for a reason
  // that has nothing to do with what it is checking.
  const env = { ...process.env, HOME: home, USERPROFILE: home }
  const out = execFileSync('node', [SCRIPT], { cwd: root, encoding: 'utf8', env })
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
