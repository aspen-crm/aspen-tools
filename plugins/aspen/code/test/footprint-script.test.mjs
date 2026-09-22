// scripts/footprint.mjs is the whole-tree copy of the guard, for CI and for arriving on an
// instance someone else built. The hook never sees an instance that is ALREADY too big -- every
// component is on disk and none of them is new -- so this is the only thing that can answer
// "how big has this got", and its exit code is what a pipeline reads.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, '..', 'scripts', 'footprint.mjs')
const EXAMPLE = join(HERE, '..', '..', '..', '..', 'example-customer-repo', 'metacode')

const run = (...args) => spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' })

test('the reference repo is clean, and stays that way', () => {
  // example-customer-repo is what a customer copies. If it ever trips its own guard, the
  // thing we hand people is the thing we tell them not to do.
  const result = run(EXAMPLE)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /nothing flagged/)
})

test('it accepts the instance folder as well as the metacode dir', () => {
  assert.equal(run(join(EXAMPLE, '..')).status, 0)
})

test('a tree with real findings exits 1 and names each one', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aspen-fps-'))
  try {
    const put = (ctype, doc) => {
      const target = join(dir, 'metacode', 'metadata', ctype)
      mkdirSync(target, { recursive: true })
      writeFileSync(join(target, `${doc.name}.json`), JSON.stringify(doc))
    }
    const fields = (names) => names.map((n) => ({ name: n, type: 'text', subtype: 'text' }))
    const shape = ['unit_price_c', 'list_price_c', 'line_total_c', 'term_start_c', 'quantity_c', 'product_c', 'discount_c']
    put('object_p', { ctype: 'object_p', name: 'quote_line_c', fields: fields(shape) })
    put('object_p', { ctype: 'object_p', name: 'order_line_c', fields: fields(shape) })
    put('picklist_p', { ctype: 'picklist_p', name: 'billing_method_c', items: [{ name: 'a_c' }, { name: 'b_c' }] })
    put('tab_collection_p', {
      ctype: 'tab_collection_p',
      name: 'sales_c',
      tabs: Array.from({ length: 20 }, (_, i) => ({ name: `t${i}_c` }))
    })

    const result = run(join(dir, 'metacode'))
    assert.equal(result.status, 1)
    assert.match(result.stdout, /near-duplicate/)
    assert.match(result.stdout, /thin-picklist/)
    assert.match(result.stdout, /nav-width/)
    // A near-duplicate pair is one finding, not two -- it is one question.
    assert.equal((result.stdout.match(/% of its field names/g) ?? []).length, 1)

    const asJson = run(join(dir, 'metacode'), '--json')
    const parsed = JSON.parse(asJson.stdout)
    assert.equal(parsed.summary.customObjects, 2)
    assert.ok(parsed.findings.length >= 3)
    assert.ok(parsed.findings.every((f) => f.check && f.component && f.detail))
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a missing or unnamed target exits 2 rather than pretending the tree is clean', () => {
  assert.equal(run(join(tmpdir(), 'no-such-instance-xyz')).status, 2)
  assert.equal(run().status, 2)
})
