import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildFixture, STANDARD } from './fixtures/build-fixture.mjs'
import { build, collect, detect, inferRules } from '../hooks/model-digest.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, '..', 'hooks', 'model-digest.mjs')

function project () {
  const dir = mkdtempSync(join(tmpdir(), 'aspen-digest-'))
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

const entry = (model, key) => model.components.get(key)

// ---- data model -------------------------------------------------------------

test('a component with a baseline and an overlay resolves to one entry, not two', () => {
  const model = collect(config(project()))
  const matches = [...model.components.keys()].filter((k) => k === 'object_p:contact_p')
  assert.equal(matches.length, 1)
  const c = entry(model, 'object_p:contact_p')
  assert.ok(c.layers.baseline, 'baseline layer recorded')
  assert.ok(c.layers.liveOverlay, 'overlay layer recorded')
})

test('a resolved component reports the compiled member count and says so', () => {
  const c = entry(collect(config(project())), 'object_p:contact_p')
  assert.equal(c.resolved, true)
  assert.equal(c.source, 'compiled')
  assert.equal(c.members.length, 31) // 22 baseline + 1 overlay + 8 standard
})

test('a component with no compiled file is unresolved and counts baseline plus overlay', () => {
  const c = entry(collect(config(project())), 'object_p:widget_p')
  assert.equal(c.resolved, false)
  assert.equal(c.source, 'baseline+overlay')
  assert.equal(c.members.length, 1)
})

test('the live and authored overlays are tracked as different layers', () => {
  const c = entry(collect(config(project())), 'object_p:contact_p')
  assert.ok(c.layers.liveOverlay, 'live overlay present')
  assert.equal(c.layers.authored, undefined, 'nothing authored locally in the fixture')
})

// ---- derived fields ---------------------------------------------------------

test('members absent from every authored file are marked derived', () => {
  const c = entry(collect(config(project())), 'object_p:contact_p')
  const derived = c.members.filter((m) => m.derived).map((m) => m.name)
  assert.deepEqual(derived.sort(), [...STANDARD].sort())
})

test('an authored member is never marked derived', () => {
  const c = entry(collect(config(project())), 'object_p:contact_p')
  assert.equal(c.members.find((m) => m.name === 'nickname_c').derived, false)
  assert.equal(c.members.find((m) => m.name === 'contact_attr_1_p').derived, false)
})

test('the standard-field rule is inferred with the objects that evidence it', () => {
  const rules = inferRules(collect(config(project())))
  const standard = rules.find((r) => r.kind === 'standard-fields')
  assert.ok(standard, 'standard-fields rule inferred')
  assert.deepEqual([...standard.fields].sort(), [...STANDARD].sort())
  assert.equal(standard.evidence, 9) // every compiled object; widget_p alone has none
})

test('the standard-field rule is scoped to a ctype, not intersected across all of them', () => {
  const rules = inferRules(collect(config(project())))
  const forObjects = rules.find((r) => r.kind === 'standard-fields' && r.ctype === 'object_p')
  assert.ok(forObjects, 'object_p keeps its standard fields even though layout_p has none')
  assert.deepEqual([...forObjects.fields].sort(), [...STANDARD].sort())
  // Layouts share no derived member, so they get no rule rather than emptying the one
  // objects legitimately have.
  assert.equal(rules.some((r) => r.kind === 'standard-fields' && r.ctype === 'layout_p'), false)
})

test('the polyid companion rule clears the threshold at three objects', () => {
  const rules = inferRules(collect(config(project())))
  const poly = rules.filter((r) => r.kind === 'companion' && r.trigger.startsWith('polyid'))
  assert.ok(poly.length >= 1, 'polyid companion rule inferred')
  for (const r of poly) assert.ok(r.evidence >= 3, `evidence ${r.evidence} clears threshold`)
  assert.deepEqual(poly.map((r) => r.affix).sort(), ['dn', 'on'])
})

test('a pattern evidenced by only two objects is dropped', () => {
  const rules = inferRules(collect(config(project())))
  assert.equal(rules.some((r) => r.affix === '_chk'), false)
  for (const r of rules) assert.ok((r.evidence ?? 0) >= 3, `no rule below threshold: ${r.kind}`)
})

test('a single-object pattern is dropped as a rule but survives as an observation', () => {
  const model = collect(config(project()))
  assert.equal(inferRules(model).some((r) => r.affix === 'cc'), false)
  const deal = entry(model, 'object_p:deal_p')
  const derived = deal.members.filter((m) => m.derived).map((m) => m.name)
  assert.ok(derived.includes('ccode_p'), 'ccode_p observed as derived on deal_p')
  assert.ok(derived.includes('ccdate_p'), 'ccdate_p observed as derived on deal_p')
})

// ---- detect -----------------------------------------------------------------

test('detect classifies the four roots from file content', () => {
  const cwd = project()
  const found = detect(cwd)
  assert.equal(found.roots.baseline, join('metacode', 'platform'))
  assert.equal(found.roots.liveOverlay, join('metacode', 'active'))
  assert.equal(found.roots.resolved, join('metacode', 'compiled'))
})

test('detect ignores a directory whose subdirectories are not component types', () => {
  const cwd = project()
  const found = detect(cwd)
  for (const root of Object.values(found.roots)) {
    assert.equal(root.includes('decoy'), false, `decoy must not be adopted as a root: ${root}`)
  }
  assert.equal(found.roots.baseline, join('metacode', 'platform'))
})

test('detect marks a root it could not classify from content', () => {
  const found = detect(project())
  assert.equal(found.confidence.resolved, 'content')
  assert.equal(found.confidence.authored, 'name') // metadata/ is empty, nothing to sample
})

// ---- build, hooks, durability ----------------------------------------------

test('build writes an index and a gitignore that keeps maps but drops the index', () => {
  const cwd = project()
  build(config(cwd))
  assert.ok(existsSync(join(cwd, '.aspen-model', 'index.md')))
  const ignore = readFileSync(join(cwd, '.aspen-model', '.gitignore'), 'utf8')
  assert.match(ignore, /^\*$/m)
  assert.match(ignore, /^!maps\/\*\*$/m)
})

test('component pages name their sources relative to the project, not absolutely', () => {
  const cwd = project()
  build(config(cwd))
  const page = readFileSync(join(cwd, '.aspen-model', 'components', 'object_p__contact_p.md'), 'utf8')
  assert.match(page, /`metacode\/platform\/object_p\/contact_p\.json`/)
  assert.equal(page.includes(cwd), false, 'no absolute machine path in the digest')
})

test('a rebuild preserves maps written by a previous run', () => {
  const cwd = project()
  build(config(cwd))
  const map = join(cwd, '.aspen-model', 'maps', 'object_p.md')
  mkdirSync(dirname(map), { recursive: true })
  writeFileSync(map, '# hand-made map\n')
  build(config(cwd))
  assert.equal(readFileSync(map, 'utf8'), '# hand-made map\n')
})

test('a map built from unchanged files stays current, and index says so', () => {
  const cwd = project()
  const { signatures } = build(config(cwd)).state
  const map = join(cwd, '.aspen-model', 'maps', 'object_p.md')
  mkdirSync(dirname(map), { recursive: true })
  writeFileSync(map, `# objects\n\n<!-- signature: ${signatures.object_p} -->\n`)
  build(config(cwd))
  assert.match(readFileSync(join(cwd, '.aspen-model', 'index.md'), 'utf8'), /`maps\/object_p\.md`/)
})

test('changing a source file marks only that type\'s map stale', () => {
  const cwd = project()
  const { signatures } = build(config(cwd)).state
  const maps = join(cwd, '.aspen-model', 'maps')
  mkdirSync(maps, { recursive: true })
  for (const ctype of ['object_p', 'layout_p']) {
    writeFileSync(join(maps, `${ctype}.md`), `# ${ctype}\n\n<!-- signature: ${signatures[ctype]} -->\n`)
  }
  // Touch one object; layouts are untouched and their map must stay current.
  const src = join(cwd, 'metacode', 'platform', 'object_p', 'widget_p.json')
  writeFileSync(src, JSON.stringify({ ctype: 'object_p', name: 'widget_p', fields: [{ name: 'label_p' }, { name: 'extra_p' }] }))
  build(config(cwd))

  const index = readFileSync(join(cwd, '.aspen-model', 'index.md'), 'utf8')
  assert.match(index, /object_p\.md` \(stale\)/)
  assert.doesNotMatch(index, /layout_p\.md` \(stale\)/)
})

test('a crash mid-rebuild leaves the previous index and maps intact', () => {
  const cwd = project()
  build(config(cwd))
  const map = join(cwd, '.aspen-model', 'maps', 'object_p.md')
  mkdirSync(dirname(map), { recursive: true })
  writeFileSync(map, '# precious\n')
  build(config(cwd))
  const before = readFileSync(join(cwd, '.aspen-model', 'index.md'), 'utf8')

  assert.throws(() => build({ ...config(cwd), crashAfterStage: true }))

  assert.equal(readFileSync(join(cwd, '.aspen-model', 'index.md'), 'utf8'), before)
  assert.equal(readFileSync(map, 'utf8'), '# precious\n')
})

test('with no config the session-start hook names detect and exits 0', () => {
  const cwd = project()
  const out = execFileSync('node', [SCRIPT, 'session-start'], { cwd, encoding: 'utf8', input: '' })
  assert.match(out, /detect/)
})

test('the session-start hook stays silent in a project that is not Aspen', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'not-aspen-'))
  const out = execFileSync('node', [SCRIPT, 'session-start'], { cwd, encoding: 'utf8', input: '' })
  assert.equal(out.trim(), '')
})

test('a checkin marks the digest stale', () => {
  const cwd = project()
  writeFileSync(join(cwd, 'aspen-model.json'), JSON.stringify(detect(cwd), null, 2))
  execFileSync('node', [SCRIPT, 'build'], { cwd, encoding: 'utf8' })
  const payload = JSON.stringify({ tool_input: { command: 'aspen move checkin-deploy' } })
  const out = execFileSync('node', [SCRIPT, 'post-tool'], { cwd, encoding: 'utf8', input: payload })
  assert.match(out, /stale/i)
  assert.match(readFileSync(join(cwd, '.aspen-model', 'index.md'), 'utf8'), /Stale/)
})
