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
    if (!objects.has(name)) objects.set(name, { object: name, layouts: [], listViews: [], tabs: [] })
    return objects.get(name)
  }

  // Every object, so an object with nothing on it is a row rather than an absence.
  for (const c of model.components.values()) if (c.ctype === 'object_p') ensure(c.name)

  const placed = new Set()
  const collections = []
  for (const c of model.components.values()) {
    const doc = docOf(c)
    if (c.ctype === COLLECTION) {
      collections.push(c.name)
      for (const entry of doc?.tabs ?? []) if (entry?.tab) placed.add(entry.tab)
      continue
    }
    const bucket = BUCKETS[c.ctype]
    if (bucket && doc?.object) ensure(doc.object)[bucket].push(c.name)
  }

  for (const c of objects.values()) {
    for (const bucket of Object.values(BUCKETS)) c[bucket].sort()
    c.unplacedTabs = c.tabs.filter((t) => !placed.has(t))
    // A missing layout is only a bug once something can reach a record. An object with
    // no UI at all is not broken -- it is just not surfaced yet.
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

function postTool (cwd, payload) {
  const object = OBJECT_FILE.exec(String(payload?.tool_input?.file_path ?? ''))?.[1]
  if (!object) return
  const config = loadConfig(cwd)
  if (!config) return
  const cov = coverage(config)
  const c = cov.objects.get(object)
  if (!c || c.complete) return
  emit(renderOne(c, cov.collections) +
    '\nOffer to fill the gap with the `complete-object-ui` skill. Do not author any of it unasked.\n')
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
