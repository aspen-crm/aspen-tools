import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildFixture } from './fixtures/build-fixture.mjs'
import { coverage, render } from '../hooks/ui-coverage.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, '..', 'hooks', 'ui-coverage.mjs')

function project () {
  const dir = mkdtempSync(join(tmpdir(), 'aspen-ui-'))
  buildFixture(join(dir, 'metacode'))
  return dir
}

const config = (cwd) => ({
  cwd,
  roots: {
    baseline: join(cwd, 'metacode', 'platform'),
    liveOverlay: join(cwd, 'metacode', 'active'),
    authored: join(cwd, 'metacode', 'metadata'),
    resolved: join(cwd, 'metacode', 'compiled')
  },
  out: join(cwd, '.aspen-model')
})

const of = (obj) => coverage(config(project())).objects.get(obj)

// ---- grouping ---------------------------------------------------------------

test('an object with no UI at all reports every part missing', () => {
  const c = of('alpha_p')
  assert.deepEqual(c.layouts, [])
  assert.deepEqual(c.listViews, [])
  assert.deepEqual(c.tabs, [])
  assert.equal(c.complete, false)
})

test('a fully covered object is complete', () => {
  const c = of('contact_p')
  assert.deepEqual(c.layouts, ['contact_p.layout_p'])
  assert.deepEqual(c.listViews, ['contact_p.list_view_p'])
  assert.deepEqual(c.tabs, ['contact_p.tab_p'])
  assert.equal(c.complete, true)
})

test('components are grouped by their object attribute, not by their name', () => {
  // `special_view_p` belongs to email_p and says so only in its `object` attribute --
  // the platform's own `currency_view_p` is shaped exactly this way.
  assert.deepEqual(of('email_p').listViews, ['special_view_p'])
})

test('every object in the model appears, even with nothing on it', () => {
  const cov = coverage(config(project()))
  for (const o of ['contact_p', 'deal_p', 'note_p', 'task_p', 'email_p', 'alpha_p', 'beta_p', 'widget_p']) {
    assert.ok(cov.objects.has(o), `${o} missing from coverage`)
  }
})

// ---- the layout warning -----------------------------------------------------

test('a list view with no layout is flagged: the row opens nothing', () => {
  const c = of('task_p')
  assert.deepEqual(c.layouts, [])
  assert.equal(c.needsLayout, true)
})

test('an object with a layout is not flagged', () => {
  assert.equal(of('contact_p').needsLayout, false)
})

test('an object with no UI at all is not flagged -- there is no row to click', () => {
  assert.equal(of('alpha_p').needsLayout, false)
})

// ---- unplaced tabs ----------------------------------------------------------

test('a tab in no collection is reported unplaced', () => {
  assert.deepEqual(of('task_p').unplacedTabs, ['task_p.tab_p'])
})

test('a tab that is in a collection is not unplaced', () => {
  assert.deepEqual(of('contact_p').unplacedTabs, [])
})

test('an unplaced tab keeps the object from being complete', () => {
  const c = of('task_p')
  assert.equal(c.complete, false)
})

// ---- object types -----------------------------------------------------------

test('a type-using object lists its types', () => {
  const c = of('order_p')
  assert.equal(c.usesTypes, true)
  assert.deepEqual(c.types.map((t) => t.name), ['order_p.base_p', 'order_p.rush_p'])
})

test('a plain object has no types', () => {
  const c = of('contact_p')
  assert.equal(c.usesTypes, false)
  assert.deepEqual(c.types, [])
})

test('a type with its own layout records it', () => {
  const base = of('order_p').types.find((t) => t.name === 'order_p.base_p')
  assert.equal(base.layout, 'order_p.layout_p')
  assert.equal(base.isBase, true)
})

test('a type with no layout of its own inherits the object layout', () => {
  const rush = of('order_p').types.find((t) => t.name === 'order_p.rush_p')
  assert.equal(rush.layout, null)
  assert.deepEqual(of('order_p').typesInheriting, ['order_p.rush_p'])
})

test('an inheriting type is not a defect -- inheriting is the designed behaviour', () => {
  // The offer to give it its own layout is an enhancement. Flagging it would cry wolf
  // on every type that is perfectly fine as it is.
  assert.equal(of('order_p').needsLayout, false)
})

test('a type-using object with no layout at all is still flagged', () => {
  // ticket_p is reachable through a list view and a tab and has no layout of any kind,
  // so its types have nothing to fall back to.
  const c = of('ticket_p')
  assert.deepEqual(c.layouts, [])
  assert.equal(c.needsLayout, true)
})

test('the warning for a typed object says its types are affected too', () => {
  const out = render(coverage(config(project())), 'ticket_p')
  assert.match(out, /ticket_p\.base_p|every type|all .* types/i)
})

test('the report shows which types have their own layout and which inherit', () => {
  const out = render(coverage(config(project())), 'order_p')
  assert.match(out, /order_p\.rush_p/)
  assert.match(out, /inherit/i)
})

// ---- the report -------------------------------------------------------------

test('the report for one object names what is missing', () => {
  const out = render(coverage(config(project())), 'deal_p')
  assert.match(out, /deal_p/)
  assert.match(out, /list view/i)
  assert.match(out, /tab/i)
})

test('the unplaced-tab note names the collections it searched', () => {
  // The real platform ships 10 tabs and places only 7, so an unplaced tab is a normal
  // state, not a defect. The note has to be scoped to what was actually looked at --
  // a collection living in a tier nobody downloaded would otherwise read as a bug.
  const out = render(coverage(config(project())), 'task_p')
  assert.match(out, /main_tabs_p/)
})

test('the report says what a missing layout costs, not just that it is missing', () => {
  const out = render(coverage(config(project())), 'task_p')
  assert.match(out, /open|render|blank/i)
})

// ---- the write reflex -------------------------------------------------------

function hook (cwd, filePath) {
  const stdout = execFileSync('node', [SCRIPT, 'post-tool'], {
    cwd,
    input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: filePath } }),
    encoding: 'utf8'
  })
  return stdout ? JSON.parse(stdout) : null
}

function configured () {
  const dir = project()
  writeFileSync(join(dir, 'aspen-model.json'), JSON.stringify({
    roots: { baseline: 'metacode/platform', liveOverlay: 'metacode/active', authored: 'metacode/metadata', resolved: 'metacode/compiled' }
  }))
  return dir
}

test('writing an object file surfaces that object\'s gap', () => {
  const dir = configured()
  const out = hook(dir, join(dir, 'metacode', 'metadata', 'object_p', 'deal_p.json'))
  assert.match(out.hookSpecificOutput.additionalContext, /deal_p/)
})

test('writing something that is not an object says nothing', () => {
  const dir = configured()
  assert.equal(hook(dir, join(dir, 'metacode', 'metadata', 'layout_p', 'deal_p.layout_p.json')), null)
})

test('a complete object does not nag', () => {
  const dir = configured()
  assert.equal(hook(dir, join(dir, 'metacode', 'metadata', 'object_p', 'contact_p.json')), null)
})

test('writing an object type offers it a layout of its own', () => {
  const dir = configured()
  const out = hook(dir, join(dir, 'metacode', 'metadata', 'object_type_p', 'order_p.rush_p.json'))
  assert.match(out.hookSpecificOutput.additionalContext, /order_p\.rush_p/)
  assert.match(out.hookSpecificOutput.additionalContext, /order_p\.layout_p/) // what it inherits
})

test('writing an object type that already has its own layout does not nag', () => {
  const dir = configured()
  assert.equal(hook(dir, join(dir, 'metacode', 'metadata', 'object_type_p', 'order_p.base_p.json')), null)
})

test('an unconfigured project stays silent rather than erroring', () => {
  const dir = project() // no aspen-model.json
  assert.equal(hook(dir, join(dir, 'metacode', 'metadata', 'object_p', 'deal_p.json')), null)
})
