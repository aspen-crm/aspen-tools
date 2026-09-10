#!/usr/bin/env node
// Which objects have the UI a person needs in order to actually use them.
//
// An object with no layout, list view or tab exists only to an API caller. Three
// components make it usable, and they are not independent:
//
//   layout_p          renders one record. Without it a row cannot be opened.
//   list_view_p       the rows. Carries its columns, sort and query-filter.
//   tab_p             where the list view is reached from. Names a default list view,
//                     and is itself invisible until a tab_collection_p contains it.
//
// This is a pure function of the files on disk -- no network, no CLI -- so it is safe on
// a hook and always reflects the tree as it is right now rather than a stored index.
//
// Modes:
//   report [object]   the coverage table, whole-model or for one object
//   post-tool         PostToolUse(Edit|Write): an object file was authored, so say what
//                     its UI is missing

import { collect, loadConfig } from './model-digest.mjs'

// These three ctypes are platform SEMANTICS, not CLI verbs -- what a layout is for is
// not something `aspen --help` can tell you -- so naming them here is the one place this
// plugin does not defer to discovery. Which object each one belongs to is still read
// from its `object` attribute, never from its name: the platform ships `currency_view_p`
// and `user_view_p`, whose names say nothing about the object they serve.
const BUCKETS = { layout_p: 'layouts', list_view_p: 'listViews', tab_p: 'tabs' }
const COLLECTION = 'tab_collection_p'
const OBJECT_TYPE = 'object_type_p'

const LABELS = { layouts: 'layout', listViews: 'list view', tabs: 'tab' }

// A component can exist in any layer. Prefer the instance's own merge, then whatever was
// authored -- a layout authored locally and not yet checked in still counts as existing,
// because the point of the check is to stop you shipping without one.
const DOC_ORDER = ['resolved', 'authored', 'liveOverlay', 'baseline']
const docOf = (c) => {
  for (const layer of DOC_ORDER) if (c.layers[layer]) return c.layers[layer].doc
  return null
}

export function coverage (config) {
  const model = collect(config)
  const objects = new Map()
  const ensure = (name) => {
    if (!objects.has(name)) {
      objects.set(name, { object: name, layouts: [], objectLayouts: [], listViews: [], tabs: [], usesTypes: false, types: [] })
    }
    return objects.get(name)
  }

  const placed = new Set()
  const collections = []
  const typesOf = new Map()      // object -> [{ name, isBase }]
  const layoutForType = new Map() // object type -> the layout naming it

  // Every object, so an object with nothing on it is a row rather than an absence. The
  // object itself declares whether it uses types -- nothing has to be inferred.
  for (const c of model.components.values()) {
    if (c.ctype !== 'object_p') continue
    ensure(c.name).usesTypes = Boolean(docOf(c)?.['uses-object-types'])
  }

  for (const c of model.components.values()) {
    const doc = docOf(c)
    if (c.ctype === COLLECTION) {
      collections.push(c.name)
      for (const entry of doc?.tabs ?? []) if (entry?.tab) placed.add(entry.tab)
      continue
    }
    if (c.ctype === OBJECT_TYPE) {
      if (doc?.object) {
        if (!typesOf.has(doc.object)) typesOf.set(doc.object, [])
        typesOf.get(doc.object).push({ name: c.name, isBase: Boolean(doc['is-base']) })
      }
      continue
    }
    const bucket = BUCKETS[c.ctype]
    if (!bucket || !doc?.object) continue
    ensure(doc.object)[bucket].push(c.name)
    if (c.ctype === 'layout_p') {
      // A layout either names a type or is the object's own. Both are layouts; only the
      // second is what an untyped record renders with.
      if (doc['object-type']) { if (!layoutForType.has(doc['object-type'])) layoutForType.set(doc['object-type'], c.name) }
      else ensure(doc.object).objectLayouts.push(c.name)
    }
  }

  for (const c of objects.values()) {
    for (const bucket of Object.values(BUCKETS)) c[bucket].sort()
    c.objectLayouts.sort()
    c.types = (typesOf.get(c.object) ?? [])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({ ...t, layout: layoutForType.get(t.name) ?? null }))
    // A type with no layout of its own renders with the object's, so this is an
    // enhancement worth offering -- never a defect. Flagging it would cry wolf on every
    // type that is working exactly as designed.
    c.typesInheriting = c.types.filter((t) => !t.layout).map((t) => t.name)
    c.inheritsFrom = c.objectLayouts[0] ?? c.types.find((t) => t.isBase)?.layout ?? null

    c.unplacedTabs = c.tabs.filter((t) => !placed.has(t))
    // A missing layout is only a bug once something can reach a record. An object with
    // no UI at all is not broken -- it is just not surfaced yet. Object types do not add
    // a second rule here; they raise the stakes on this one, because with no layout of
    // any kind there is nothing for any type to fall back to.
    c.needsLayout = c.layouts.length === 0 && (c.listViews.length > 0 || c.tabs.length > 0)
    c.complete = c.layouts.length > 0 && c.listViews.length > 0 &&
      c.tabs.length > 0 && c.unplacedTabs.length === 0
  }

  return { objects, collections }
}

// -------------------------------------------------------------------- rendering

const cell = (names) => names.length ? names.map((n) => `\`${n}\``).join(', ') : '**missing**'

function renderOne (c, collections = []) {
  const lines = [
    `## \`${c.object}\` — UI coverage`,
    '',
    '| Part | Have |',
    '| --- | --- |',
    ...Object.entries(LABELS).map(([bucket, label]) => `| ${label} | ${cell(c[bucket])} |`)
  ]
  if (c.needsLayout) {
    lines.push('',
      `> **\`${c.object}\` has a list view or a tab but no layout.** Someone can reach a row`,
      '> and click it, and there is no layout for the record to open with. Author the layout',
      '> before this ships.')
    if (c.types.length) {
      // With no layout of any kind, "inherit the object's layout" inherits nothing, so
      // every type is affected rather than just untyped records.
      lines.push(`> Every one of its object types is affected — ${cell(c.types.map((t) => t.name))} —`,
        '> because there is no object layout for any of them to fall back to.')
    }
  }
  if (c.types.length) {
    lines.push('', '### Object types', '', '| Type | Layout |', '| --- | --- |')
    for (const t of c.types) {
      const has = t.layout
        ? `\`${t.layout}\``
        : c.inheritsFrom ? `inherits \`${c.inheritsFrom}\`` : 'inherits — **and there is no object layout to inherit**'
      lines.push(`| \`${t.name}\`${t.isBase ? ' (base)' : ''} | ${has} |`)
    }
    if (c.typesInheriting.length && c.inheritsFrom) {
      lines.push('',
        `> ${cell(c.typesInheriting)} render with the object layout. Giving one its own layout`,
        '> is an enhancement, not a fix — offer it, do not flag it.')
    }
  }
  if (c.unplacedTabs.length) {
    // Not stated as a defect. The platform itself ships tabs it never places -- on a real
    // instance 3 of 10 -- so this is a reachability observation, and naming the
    // collections that were searched is what lets a reader judge it.
    const searched = collections.length
      ? `the ${COLLECTION} in this download (${cell(collections)})`
      : `any ${COLLECTION} in this download (there are none)`
    lines.push('',
      `> **Not reached by a tab collection:** ${cell(c.unplacedTabs)} is listed by none of`,
      `> ${searched}. A tab is only reachable once a collection lists it. That can be`,
      '> deliberate — the platform ships tabs it does not place — so confirm before adding it.')
  }
  if (c.complete) lines.push('', 'Nothing missing.')
  return lines.join('\n') + '\n'
}

export function render (cov, object) {
  if (object) {
    const c = cov.objects.get(object)
    return c ? renderOne(c, cov.collections) : `No object \`${object}\` in the downloaded model.\n`
  }
  const rows = [...cov.objects.values()].sort((a, b) => a.object.localeCompare(b.object))
  const flag = (c) => [c.needsLayout ? 'no layout' : '', c.unplacedTabs.length ? 'tab unplaced' : ''].filter(Boolean).join(', ')
  return [
    `# UI coverage — ${rows.length} objects`,
    '',
    '| Object | Layout | List view | Tab | Note |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((c) => `| \`${c.object}\` | ${c.layouts.length ? 'yes' : '—'} | ${c.listViews.length ? 'yes' : '—'} | ${c.tabs.length ? 'yes' : '—'} | ${flag(c)} |`),
    ''
  ].join('\n')
}

// ------------------------------------------------------------------------- main

const emit = (context) => process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context }
}))

async function readStdin () {
  if (process.stdin.isTTY) return {}
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { return {} }
}

const OBJECT_FILE = /(?:^|\/)object_p\/([^/]+)\.json$/
const TYPE_FILE = /(?:^|\/)object_type_p\/([^/]+)\.json$/

const OFFER = '\nOffer this with the `complete-object-ui` skill. Do not author any of it unasked.\n'

function postTool (cwd, payload) {
  const file = String(payload?.tool_input?.file_path ?? '')
  const object = OBJECT_FILE.exec(file)?.[1]
  const type = TYPE_FILE.exec(file)?.[1]
  if (!object && !type) return
  const config = loadConfig(cwd)
  if (!config) return
  const cov = coverage(config)

  if (type) {
    const owner = [...cov.objects.values()].find((c) => c.types.some((t) => t.name === type))
    const t = owner?.types.find((t) => t.name === type)
    // It already has its own layout, so there is nothing to offer.
    if (!t || t.layout) return
    const inherits = owner.inheritsFrom
      ? `It currently renders with \`${owner.inheritsFrom}\`.`
      : `\`${owner.object}\` has no object layout, so this type has nothing to render with at all.`
    return emit(
      `\`${type}\` is an object type on \`${owner.object}\` with no layout of its own. ${inherits}\n\n` +
      'Ask whether it should have a layout specific to this type — what this type shows that the ' +
      'object layout does not. Inheriting is a perfectly good answer.\n' + OFFER)
  }

  const c = cov.objects.get(object)
  if (!c || c.complete) return
  emit(renderOne(c, cov.collections) + OFFER)
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] ?? 'report'
  const cwd = process.cwd()
  try {
    if (mode === 'post-tool') postTool(cwd, await readStdin())
    else if (mode === 'report') {
      const config = loadConfig(cwd)
      if (!config) { console.log('No aspen-model.json. Run the digest\'s `detect` first.'); process.exit(1) }
      console.log(render(coverage(config), process.argv[3]))
    } else {
      console.error(`Unknown mode: ${mode}. Use report or post-tool.`)
      process.exit(1)
    }
  } catch (error) {
    // On a hook, a crash must be quieter than the value this adds.
    if (mode === 'post-tool') process.exit(0)
    console.error(`aspen ui coverage: ${error?.message ?? error}`)
    process.exit(1)
  }
  process.exit(0)
}
