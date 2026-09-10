import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildFixture, STANDARD } from './fixtures/build-fixture.mjs'
import { detect } from '../hooks/model-digest.mjs'
import { parseArgs, scaffold, write } from '../hooks/scaffold.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, '..', 'hooks', 'scaffold.mjs')

function project () {
  const dir = mkdtempSync(join(tmpdir(), 'aspen-scaffold-'))
  buildFixture(join(dir, 'metacode'))
  writeFileSync(join(dir, 'aspen-model.json'), JSON.stringify(detect(dir), null, 2))
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

const run = (cwd, ...args) => execFileSync('node', [SCRIPT, ...args], { cwd, encoding: 'utf8' })
const authored = (cwd, ctype, name) => JSON.parse(readFileSync(join(cwd, 'metacode', 'metadata', ctype, `${name}.json`), 'utf8'))

// ---- new: the shape comes from a real component ------------------------------

test('new copies a real component of the type, with its members cleared and its identity replaced', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs(['new', 'tab_collection_p', 'marketing_c', '--label', 'Marketing']))
  assert.equal(out.exemplar.name, 'main_tabs_p')
  assert.deepEqual(out.doc, { ctype: 'tab_collection_p', name: 'marketing_c', label: 'Marketing', tabs: [] })
  assert.ok(!('_derived' in out.doc))
})

test('--add clones the exemplar entry and points its references at the given name', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs(['new', 'tab_collection_p', 'marketing_c', '--add', 'tabs=task_p.tab_p']))
  assert.deepEqual(out.doc.tabs, [{ active: true, name: 'task_p', tab: 'task_p.tab_p' }])
})

test('a scalar that referenced another component is cleared and reported, an enum is kept', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs(['new', 'tab_p', 'deal_p.tab_p']))
  assert.equal(out.doc.object, null)
  assert.equal(out.doc['default-list-view'], null)
  assert.equal(out.doc['tab-type'], 'object_type')
  assert.deepEqual(out.fill.sort(), ['default-list-view', 'object'])
})

test('the label defaults to the name, humanised', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs(['new', 'tab_collection_p', 'sales_ops_c']))
  assert.equal(out.doc.label, 'Sales Ops')
})

test('--set writes a path, parses JSON, appends with [] and falls back to a string', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs([
    'new', 'list_view_p', 'deal_p.list_view_p',
    '--set', 'object=deal_p',
    '--set', 'columns[]={"active":true,"column-type":"field","field":"amount_p","name":"amount_p"}',
    '--set', 'sort[0].column=amount_p',
    '--set', 'query-filter=owner_p is not null'
  ]))
  assert.equal(out.doc.object, 'deal_p')
  assert.deepEqual(out.doc.columns, [{ active: true, 'column-type': 'field', field: 'amount_p', name: 'amount_p' }])
  assert.equal(out.doc.sort[0].column, 'amount_p')
  assert.equal(out.doc['query-filter'], 'owner_p is not null')
})

test('a reference filled by --set is not still listed under Fill in', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs(['new', 'tab_p', 'promo_c', '--set', 'object=promo_c', '--set', 'default-list-view=promo_c.view_c']))
  assert.deepEqual(out.fill, [], 'both references were set, so nothing is left to fill')
})

test('--like chooses the exemplar', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs(['new', 'tab_p', 'x_c', '--like', 'task_p.tab_p']))
  assert.equal(out.exemplar.name, 'task_p.tab_p')
})

test('a cleared array is reported with the exemplar entry as a template', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs(['new', 'list_view_p', 'deal_p.list_view_p']))
  assert.ok(out.cleared.columns, 'columns should be reported as cleared')
  assert.equal(out.cleared.columns['column-type'], 'field')
  assert.ok(out.cleared.sort)
})

test('a reference to a component that was never downloaded is still cleared: the suffix is the tell', () => {
  const cwd = project()
  // A tab whose list view is not in this download, like a partial pull.
  writeFileSync(join(cwd, 'metacode', 'compiled', 'tab_p', 'orphan_p.tab_p.json'), JSON.stringify({
    ctype: 'tab_p', name: 'orphan_p.tab_p', label: 'Orphan', object: 'orphan_p', 'default-list-view': 'orphan_p.orphanview_c', 'tab-type': 'object_type'
  }))
  const out = scaffold(config(cwd), parseArgs(['new', 'tab_p', 'x_c', '--like', 'orphan_p.tab_p']))
  assert.equal(out.doc['default-list-view'], null)
  assert.equal(out.doc['tab-type'], 'object_type')
})

test('--add follows the new name for self-references and clears foreign ones', () => {
  const cwd = project()
  // Delivered and resolved: the lookup is a real authored field, not a derived one.
  const linked = { ctype: 'object_p', name: 'linked_p', fields: [{ name: 'acct_p', type: 'lookup', subtype: 'lookup', 'related-object': 'contact_p' }] }
  writeFileSync(join(cwd, 'metacode', 'platform', 'object_p', 'linked_p.json'), JSON.stringify(linked))
  writeFileSync(join(cwd, 'metacode', 'compiled', 'object_p', 'linked_p.json'), JSON.stringify(linked))
  const out = scaffold(config(cwd), parseArgs(['extend', 'object_p', 'linked_p', '--add', 'fields=owner_c']))
  assert.equal(out.doc.fields[0].name, 'owner_c')
  assert.equal(out.doc.fields[0]['related-object'], null)
  assert.deepEqual(out.fill, ['fields[0].related-object'])
})

// ---- extend: an overlay carries only what was added -------------------------

test('a component with only derived members borrows its template from a custom entry elsewhere', () => {
  const cwd = project()
  // A fresh custom object: the instance gave it the standard fields and nothing else.
  writeFileSync(join(cwd, 'metacode', 'compiled', 'object_p', 'bare_c.json'), JSON.stringify({
    ctype: 'object_p', name: 'bare_c', fields: STANDARD.map((name) => ({ name, type: 'id', subtype: 'id' }))
  }))
  const out = scaffold(config(cwd), parseArgs(['extend', 'object_p', 'bare_c', '--add', 'fields=budget_c']))
  assert.deepEqual(out.doc.fields, [{ name: 'budget_c', type: 'text', subtype: 'text' }])
  assert.equal(out.exemplar.template.fields.name, 'nickname_c')
})

test('a resolved-only component falls back to the standard-fields rule to tell business fields from derived ones', () => {
  const cwd = project()
  // A partial download: compiled/ only, so nothing says which fields were authored.
  // The digest's rule for object_p says which are standard; the rest are real fields.
  writeFileSync(join(cwd, 'metacode', 'compiled', 'object_p', 'partial_p.json'), JSON.stringify({
    ctype: 'object_p', name: 'partial_p', fields: [...STANDARD.map((name) => ({ name, type: 'id', subtype: 'id' })), { name: 'amount_p', type: 'currency', subtype: 'currency' }]
  }))
  const out = scaffold(config(cwd), parseArgs(['extend', 'object_p', 'partial_p', '--add', 'fields=budget_c']))
  assert.equal(out.exemplar.template.fields.name, 'amount_p')
  assert.deepEqual(out.doc.fields, [{ name: 'budget_c', type: 'currency', subtype: 'currency' }])
})

test('extend writes an extends-keyed overlay whose member template is a real, non-derived member', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs(['extend', 'object_p', 'contact_p', '--add', 'fields=nickname2_c', '--set', 'fields[0].type=text']))
  assert.equal(out.doc.extends, 'contact_p')
  assert.equal(out.doc.ctype, 'object_p')
  assert.equal(out.doc.fields.length, 1)
  assert.equal(out.doc.fields[0].name, 'nickname2_c')
  assert.equal(out.doc.fields[0].type, 'text')
  assert.ok(!STANDARD.includes(out.exemplar.template.fields.name), 'template must not be a derived member')
  assert.ok(!('label' in out.doc), 'an overlay does not restate the component\'s scalars')
})

test('a cloned member entry drops the old member\'s own label and description', () => {
  const cwd = project()
  writeFileSync(join(cwd, 'metacode', 'compiled', 'object_p', 'rich_p.json'), JSON.stringify({
    ctype: 'object_p', name: 'rich_p',
    fields: [...STANDARD.map((n) => ({ name: n, type: 'id', subtype: 'id' })),
      { name: 'amount_p', type: 'currency', subtype: 'currency', label: 'Deal Amount', description: 'The size of the deal', required: true }]
  }))
  const out = scaffold(config(cwd), parseArgs(['extend', 'object_p', 'rich_p', '--add', 'fields=budget_c']))
  const field = out.doc.fields[0]
  assert.equal(field.name, 'budget_c')
  assert.equal(field.label, null)
  assert.equal(field.description, null)
  assert.equal(field.type, 'currency', 'structural attributes are kept')
  assert.equal(field.required, true)
})

test('extend refuses a component the instance does not have', () => {
  const cwd = project()
  assert.throws(() => scaffold(config(cwd), parseArgs(['extend', 'object_p', 'nothing_p'])), /nothing_p/)
})

// ---- writing ---------------------------------------------------------------

test('write lands in the authored root and refuses to overwrite without --force', () => {
  const cwd = project()
  const out = scaffold(config(cwd), parseArgs(['new', 'tab_collection_p', 'marketing_c']))
  const path = write(config(cwd), out, {})
  assert.equal(path, join(cwd, 'metacode', 'metadata', 'tab_collection_p', 'marketing_c.json'))
  assert.equal(authored(cwd, 'tab_collection_p', 'marketing_c').name, 'marketing_c')
  assert.throws(() => write(config(cwd), out, {}), /exists/)
  write(config(cwd), out, { force: true })
})

// ---- errors that say what to do --------------------------------------------

test('an unknown ctype lists the types the instance has', () => {
  const cwd = project()
  assert.throws(() => scaffold(config(cwd), parseArgs(['new', 'widget_thing_p', 'x_c'])), /tab_collection_p/)
})

test('--add on an array the exemplar has no entry for is an error', () => {
  const cwd = project()
  assert.throws(() => scaffold(config(cwd), parseArgs(['new', 'tab_collection_p', 'x_c', '--add', 'nope=x'])), /nope/)
})

// ---- the command line --------------------------------------------------------

test('the CLI writes the file and prints where it came from, the document, and what to fill in', () => {
  const cwd = project()
  const out = run(cwd, 'new', 'tab_p', 'deal_p.tab_p', '--label', 'Deals')
  assert.ok(existsSync(join(cwd, 'metacode', 'metadata', 'tab_p', 'deal_p.tab_p.json')))
  assert.match(out, /metacode\/metadata\/tab_p\/deal_p\.tab_p\.json/)
  assert.match(out, /from .*compiled\/tab_p\//)
  assert.match(out, /"label": "Deals"/)
  assert.match(out, /Fill in: default-list-view, object/)
})

test('--dry-run prints and writes nothing', () => {
  const cwd = project()
  const out = run(cwd, 'new', 'tab_collection_p', 'marketing_c', '--dry-run')
  assert.match(out, /"name": "marketing_c"/)
  assert.ok(!existsSync(join(cwd, 'metacode', 'metadata', 'tab_collection_p', 'marketing_c.json')))
})

test('without a config the CLI says where it expected to be', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'not-aspen-'))
  assert.throws(() => run(cwd, 'new', 'tab_p', 'x_c'), /aspen-model\.json/)
})
