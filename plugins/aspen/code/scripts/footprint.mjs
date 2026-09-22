#!/usr/bin/env node
// The checks guard-footprint.mjs runs on a write, over a whole instance at once.
//
// The hook only binds a Claude Code session with this plugin loaded, and only fires on the
// component being written. An instance that is ALREADY too big never triggers it -- the
// components are all on disk, none of them new. This is the copy that reads the whole tree
// and answers "how big has this got", which is what `/lean-data-model` runs when there is no
// pending change, and what CI runs to keep a reference repo honest.
//
//   node scripts/footprint.mjs <metacode-dir> [--json]
//
// Exits 1 when anything is flagged, 0 when the tree is clean.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

import {
  LIMITS, loadObjects, overlap, bareName, distinctiveWords
} from '../hooks/guard-footprint.mjs'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const target = args.find((a) => !a.startsWith('--'))

if (!target) {
  console.error('usage: node scripts/footprint.mjs <metacode-dir> [--json]')
  process.exit(2)
}
const root = target.endsWith('metacode') ? target : join(target, 'metacode')
if (!existsSync(root)) {
  console.error(`no metacode tree at ${root}`)
  process.exit(2)
}

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null } }
const docsIn = (ctype) => {
  const seen = new Map()
  for (const tier of ['metadata', 'active', 'compiled']) {
    const dir = join(root, tier, ctype)
    let files = []
    try { files = readdirSync(dir).filter((f) => f.endsWith('.json')) } catch { continue }
    for (const file of files) {
      const doc = readJson(join(dir, file))
      if (doc?.name && !seen.has(doc.name)) seen.set(doc.name, { doc, at: relative(process.cwd(), join(dir, file)) })
    }
  }
  return seen
}

const findings = []
const add = (check, component, detail) => findings.push({ check, component, detail })

// ---- objects ---------------------------------------------------------------------------

const objects = loadObjects(root)
const custom = [...objects.entries()].filter(([name, doc]) => name.endsWith('_c') && doc.tier !== 'platform')

const reported = new Set()
for (const [name, doc] of custom) {
  if (distinctiveWords(doc).size >= LIMITS.MIN_DISTINCTIVE_FIELDS) {
    for (const [other, existing] of objects) {
      if (other === name) continue
      const share = overlap(doc, existing)
      if (share < LIMITS.FIELD_OVERLAP) continue
      // One line per pair, not two.
      const pair = [name, other].sort().join(' ~ ')
      if (reported.has(pair)) continue
      reported.add(pair)
      add('near-duplicate', name,
        `${Math.round(share * 100)}% of its field names are already on \`${other}\``)
    }
  }
  const fields = doc.fields?.length ?? 0
  if (fields > LIMITS.OBJECT_FIELDS) {
    add('object-width', name, `${fields} fields, past ${LIMITS.OBJECT_FIELDS}`)
  }
}

// ---- picklists -------------------------------------------------------------------------

for (const [name, { doc }] of docsIn('picklist_p')) {
  if (!name.endsWith('_c')) continue
  const items = doc.items?.length ?? 0
  if (items > 0 && items <= LIMITS.PICKLIST_MAX_THIN) {
    add('thin-picklist', name, `${items} item${items === 1 ? '' : 's'}; a checkbox needs no component`)
  }
}

// ---- nav ---------------------------------------------------------------------------------

for (const [name, { doc }] of docsIn('tab_collection_p')) {
  const tabs = doc.tabs?.length ?? 0
  if (tabs > LIMITS.COLLECTION_TABS) {
    add('nav-width', name, `${tabs} tabs, past ${LIMITS.COLLECTION_TABS}`)
  }
}

// ---- objects nobody can open ---------------------------------------------------------------

const placed = { layout_p: new Set(), list_view_p: new Set(), tab_p: new Set() }
for (const ctype of Object.keys(placed)) {
  for (const [name, { doc }] of docsIn(ctype)) {
    const owner = doc.object ?? String(name).split('.')[0]
    if (owner) placed[ctype].add(owner)
  }
}
for (const [name] of custom) {
  const missing = Object.entries(placed)
    .filter(([, owners]) => !owners.has(name))
    .map(([ctype]) => ctype)
  if (missing.length) add('unusable', name, `no ${missing.join(', no ')}`)
}

// ---- report -----------------------------------------------------------------------------

const summary = {
  customObjects: custom.length,
  customFields: custom.reduce((n, [, doc]) => n + (doc.fields?.length ?? 0), 0),
  picklists: [...docsIn('picklist_p').keys()].filter((n) => n.endsWith('_c')).length,
  tabs: docsIn('tab_p').size,
  collections: docsIn('tab_collection_p').size
}

if (asJson) {
  console.log(JSON.stringify({ root, summary, findings }, null, 2))
} else {
  console.log(`${root}`)
  console.log(`  ${summary.customObjects} custom objects · ${summary.customFields} fields · ` +
    `${summary.picklists} picklists · ${summary.tabs} tabs in ${summary.collections} collections`)
  if (!findings.length) {
    console.log('\n  nothing flagged.')
  } else {
    console.log('')
    const byCheck = new Map()
    for (const f of findings) byCheck.set(f.check, [...(byCheck.get(f.check) ?? []), f])
    for (const [check, group] of byCheck) {
      console.log(`  ${check} (${group.length})`)
      for (const f of group) console.log(`    ${f.component}: ${f.detail}`)
    }
    console.log(`\n  ${findings.length} finding${findings.length === 1 ? '' : 's'}. ` +
      'Nothing on this platform deletes, so each one is a question about what to build NEXT, ' +
      'not a demand to remove what is there.')
  }
}

process.exit(findings.length ? 1 : 0)
