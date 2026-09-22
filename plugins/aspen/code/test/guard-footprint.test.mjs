import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { decide, LIMITS, overlap, bareName, distinctiveWords } from '../hooks/guard-footprint.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, '..', 'hooks', 'guard-footprint.mjs')

// A throwaway instance. The hook reads the tiers around the file it is judging, so the tests
// build a real tree rather than stubbing a reader -- that IS the thing under test.
function instance (tiers = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'aspen-fp-'))
  for (const [tier, ctypes] of Object.entries(tiers)) {
    for (const [ctype, docs] of Object.entries(ctypes)) {
      const target = join(dir, 'metacode', tier, ctype)
      mkdirSync(target, { recursive: true })
      for (const doc of docs) {
        writeFileSync(join(target, `${doc.name}.json`), JSON.stringify(doc, null, 2))
      }
    }
  }
  return dir
}

const object = (name, fields, extra = {}) => ({
  ctype: 'object_p', name, label: name, 'display-field': fields[0],
  fields: fields.map((f) => ({ name: f, label: f, type: 'text', subtype: 'text' })),
  ...extra
})

const path = (dir, ctype, name) => join(dir, 'metacode', 'metadata', ctype, `${name}.json`)
const write = (dir, ctype, doc) => decide(path(dir, ctype, doc.name), { content: JSON.stringify(doc) })

// Fields distinctive enough to be compared at all; the generic ones are ignored by design.
const OPP = ['name_c', 'account_c', 'amount_c', 'probability_c', 'close_date_c', 'next_step_c',
  'stage_c', 'source_c', 'campaign_c', 'primary_contact_c']

// ---- the case that prompted the skill ------------------------------------------------

test('a new object that duplicates a platform object asks, naming it', () => {
  const dir = instance({
    platform: { object_p: [object('opportunity_p', ['name_p', 'amount_p', 'probability_p', 'close_date_p', 'next_step_p', 'description_p', 'owner_p', 'status_p'])] }
  })
  try {
    const reason = write(dir, 'object_p', object('deal_c', OPP))
    assert.ok(reason, 'deal_c over an existing opportunity_p must ask')
    assert.match(reason, /opportunity_p/)
    assert.match(reason, /deletes/, 'the ask has to say why now is the moment')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('the synonym table catches a rename even when no field names match', () => {
  const dir = instance({ platform: { object_p: [object('case_p', ['subject_p', 'priority_p', 'severity_p'])] } })
  try {
    const reason = write(dir, 'object_p', object('ticket_c',
      ['headline_c', 'urgency_c', 'reporter_c', 'queue_c', 'sla_c', 'resolution_c', 'channel_c']))
    assert.match(reason, /case_p/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a near-copy of a CUSTOM object asks too', () => {
  const dir = instance({
    metadata: { object_p: [object('quote_line_c', ['unit_price_c', 'list_price_c', 'line_total_c', 'term_start_c', 'term_end_c', 'quantity_c', 'product_c'])] }
  })
  try {
    const reason = write(dir, 'object_p', object('order_line_c',
      ['unit_price_c', 'list_price_c', 'line_total_c', 'term_start_c', 'term_end_c', 'quantity_c', 'product_c']))
    assert.match(reason, /quote_line_c/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ---- the false positives this was tuned against ----------------------------------------

test('a small object of generic fields is NOT called a duplicate', () => {
  // Calibration: without the distinctive-field floor this fired on 26% of a real instance's
  // objects, almost all of them four-field objects whose name/status/owner/dates matched
  // everything. `engagement_c` and `project_task_c` are the real pair that made the point.
  const dir = instance({
    metadata: { object_p: [object('project_task_c', ['name_c', 'status_c', 'owner_c', 'start_date_c', 'end_date_c', 'account_c'])] }
  })
  try {
    assert.equal(write(dir, 'object_p', object('engagement_c',
      ['name_c', 'status_c', 'owner_c', 'start_date_c', 'end_date_c', 'account_c'])), null)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('an object authored but not yet given a layout is NOT called unusable', () => {
  // Mid-build is the normal state: you author the object, then its layout a minute later.
  // Flagging that would fire on every second object anyone creates.
  const dir = instance({ metadata: { object_p: [object('quote_c', ['name_c', 'amount_c', 'account_c'])] } })
  try {
    assert.equal(write(dir, 'object_p', object('invoice_c', ['name_c', 'total_c'])), null)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a genuinely distinct object of its own shape is silent', () => {
  const dir = instance({
    platform: { object_p: [object('account_p', ['name_p', 'owner_p', 'status_p'])] },
    metadata: { object_p: [object('quote_c', ['name_c', 'amount_c', 'status_c', 'account_c'])] }
  })
  try {
    assert.equal(write(dir, 'object_p', object('timesheet_c',
      ['name_c', 'week_starting_c', 'monday_hours_c', 'tuesday_hours_c', 'bill_rate_c', 'cost_rate_c', 'approver_c'])), null)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('editing an existing object without crossing anything is silent', () => {
  const dir = instance({ metadata: { object_p: [object('quote_c', ['name_c', 'amount_c', 'account_c'])] } })
  try {
    // Same file, one field added, still far under every threshold.
    const doc = object('quote_c', ['name_c', 'amount_c', 'account_c', 'currency_c'])
    assert.equal(decide(path(dir, 'object_p', 'quote_c'), { content: JSON.stringify(doc) }), null)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a retired component is silent', () => {
  const dir = instance({ platform: { object_p: [object('opportunity_p', ['name_p', 'amount_p'])] } })
  try {
    assert.equal(write(dir, 'object_p', object('deal_c', OPP, { active: false })), null)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ---- width, thinness, nav ----------------------------------------------------------------

test('an object crossing the field limit asks, once, on the crossing', () => {
  const dir = instance({ metadata: { object_p: [] } })
  try {
    const wide = Array.from({ length: LIMITS.OBJECT_FIELDS + 2 }, (_, i) => `f${i}_c`)
    const reason = write(dir, 'object_p', object('order_line_c', wide))
    assert.match(reason, new RegExp(`${LIMITS.OBJECT_FIELDS + 2} fields`))

    // Already over on disk: adding one more must not ask again.
    writeFileSync(path(dir, 'object_p', 'order_line_c'), JSON.stringify(object('order_line_c', wide)))
    const wider = object('order_line_c', [...wide, 'one_more_c'])
    const second = decide(path(dir, 'object_p', 'order_line_c'), { content: JSON.stringify(wider) })
    assert.equal(second, null, 'a threshold already crossed must not re-ask')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a two-item picklist asks and names the checkbox', () => {
  const dir = instance({})
  try {
    const doc = { ctype: 'picklist_p', name: 'billing_method_c', items: [{ name: 'a_c' }, { name: 'b_c' }] }
    const reason = write(dir, 'picklist_p', doc)
    assert.match(reason, /checkbox/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a picklist with room to grow is silent', () => {
  const dir = instance({})
  try {
    const doc = { ctype: 'picklist_p', name: 'stage_c', items: ['a', 'b', 'c', 'd'].map((n) => ({ name: `${n}_c` })) }
    assert.equal(write(dir, 'picklist_p', doc), null)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a nav collection crossing the tab limit asks', () => {
  const dir = instance({})
  try {
    const tabs = Array.from({ length: LIMITS.COLLECTION_TABS + 1 }, (_, i) => ({ name: `t${i}_c`, tab: `t${i}_c.tab_c` }))
    const reason = write(dir, 'tab_collection_p', { ctype: 'tab_collection_p', name: 'sales_c', tabs })
    assert.match(reason, /related list/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a short nav is silent', () => {
  const dir = instance({})
  try {
    const tabs = Array.from({ length: 5 }, (_, i) => ({ name: `t${i}_c`, tab: `t${i}_c.tab_c` }))
    assert.equal(write(dir, 'tab_collection_p', { ctype: 'tab_collection_p', name: 'sales_c', tabs }), null)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ---- an object nobody can open yet ------------------------------------------------------

test('a DEPLOYED object that is still unusable is named when another is created', () => {
  const dir = instance({
    active: { object_p: [object('half_done_c', ['name_c', 'amount_c'])] },
    metadata: {
      object_p: [object('half_done_c', ['name_c', 'amount_c'])],
      layout_p: [], list_view_p: [], tab_p: []
    }
  })
  try {
    const reason = write(dir, 'object_p', object('another_c', ['name_c', 'thing_c']))
    assert.match(reason, /half_done_c/)
    assert.match(reason, /cannot be used/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('an object with its layout, list view and tab does not count as unfinished', () => {
  const dir = instance({
    active: { object_p: [{ ctype: 'object_p', name: 'finished_c', fields: [] }] },
    metadata: {
      object_p: [object('finished_c', ['name_c', 'amount_c'])],
      layout_p: [{ ctype: 'layout_p', name: 'finished_c.layout_c', object: 'finished_c' }],
      list_view_p: [{ ctype: 'list_view_p', name: 'finished_c.list_view_c', object: 'finished_c' }],
      tab_p: [{ ctype: 'tab_p', name: 'finished_c.tab_c', object: 'finished_c' }]
    }
  })
  try {
    const reason = write(dir, 'object_p', object('another_c', ['name_c', 'thing_c']))
    assert.ok(reason === null || !/finished_c/.test(reason), 'a complete object must not be called unfinished')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ---- scope and safety ---------------------------------------------------------------------

test('it only judges objects, picklists and tab collections', () => {
  const dir = instance({})
  try {
    for (const ctype of ['layout_p', 'list_view_p', 'tab_p', 'lifecycle_p']) {
      const target = join(dir, 'metacode', 'metadata', ctype, 'x_c.json')
      assert.equal(decide(target, { content: '{"ctype":"x","name":"x_c"}' }), null, ctype)
    }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a file outside a metacode metadata tier is never judged', () => {
  assert.equal(decide('/tmp/object_p/deal_c.json', { content: '{"name":"deal_c"}' }), null)
  assert.equal(decide('/x/metacode/active/object_p/deal_c.json', { content: '{"name":"deal_c"}' }), null)
})

test('malformed or empty input is silent, not a crash', () => {
  const dir = instance({})
  try {
    for (const content of ['{ broken', 'null', '[]', '"s"', '{}']) {
      assert.equal(write(dir, 'object_p', {}) ?? decide(path(dir, 'object_p', 'x_c'), { content }), null, content)
    }
    assert.equal(decide(undefined, undefined), null)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ---- the pieces, directly -------------------------------------------------------------------

test('bareName strips the namespace so amount_c and amount_p are one word', () => {
  assert.equal(bareName('amount_c'), 'amount')
  assert.equal(bareName('amount_p'), 'amount')
  assert.equal(bareName('amount_a'), 'amount')
  assert.equal(bareName('close_date_c'), 'close_date')
})

test('overlap is a share of the NEW object, so a small copy of a big object still counts', () => {
  const small = object('deal_c', ['amount_c', 'probability_c'])
  const big = object('opportunity_p', ['amount_p', 'probability_p', ...Array.from({ length: 30 }, (_, i) => `x${i}_p`)])
  assert.equal(overlap(small, big), 1)
})

test('distinctiveWords drops the names every object carries', () => {
  const words = distinctiveWords(object('x_c', ['name_c', 'owner_c', 'status_c', 'bill_rate_c']))
  assert.deepEqual([...words], ['bill_rate'])
})

// ---- run as the host runs it -------------------------------------------------------------

test('the hook asks over stdin and never denies', () => {
  const dir = instance({ platform: { object_p: [object('opportunity_p', ['name_p', 'amount_p', 'probability_p', 'close_date_p', 'next_step_p'])] } })
  try {
    const stdout = execFileSync('node', [SCRIPT], {
      input: JSON.stringify({
        tool_name: 'Write',
        tool_input: { file_path: path(dir, 'object_p', 'deal_c'), content: JSON.stringify(object('deal_c', OPP)) }
      }),
      encoding: 'utf8'
    })
    assert.equal(JSON.parse(stdout).hookSpecificOutput.permissionDecision, 'ask')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('the synonym table fires even when the platform tier is empty', () => {
  // Several real instance folders have a platform/ holding only a README -- a fresh Builder
  // folder, or one whose download-active-set has not run. "deal" still means opportunity there,
  // and a new instance is exactly where the check matters most.
  const dir = instance({ metadata: { object_p: [] } })
  try {
    const reason = write(dir, 'object_p', object('deal_c', ['amount_c', 'stage_c']))
    assert.match(reason, /opportunity_p/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a word not in the table, on an empty instance, is silent', () => {
  const dir = instance({ metadata: { object_p: [] } })
  try {
    assert.equal(write(dir, 'object_p', object('widget_c', ['name_c', 'colour_c'])), null)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
