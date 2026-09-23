import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { recover } from '../skills/using-aspen/scripts/recover.mjs'

test('recovery requires confirmation and a single recognized verb', () => {
  for (const args of [[], ['clear-package'], ['--confirmed','delete','aspen'], ['--confirmed','clear-package; echo bad','aspen'], ['--confirmed','clear-package','aspen','extra']]) {
    assert.throws(() => recover(args, () => assert.fail('must not run')), /authorization/)
  }
})
test('confirmed recovery invokes exactly one argv command and preserves its exit status', () => {
  for (const verb of ['clear-package', 'checkin-clear']) {
    assert.equal(recover(['--confirmed', verb, '.aspen/bin/aspen'], (cmd, args, opts) => {
      assert.equal(cmd, resolve('.aspen/bin/aspen'))
      assert.deepEqual(args, ['move', verb])
      assert.equal(opts.shell, false)
      return { status: 7 }
    }), 7)
  }
})
