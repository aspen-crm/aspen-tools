#!/usr/bin/env node
// PreToolUse (Write, Edit, MultiEdit) guard on the SIZE of an instance's model.
//
// The failure this catches is not a bug. Every component it flags is correctly authored and
// would deploy clean. The problem is that it should not exist: a second object for a concept
// the platform already ships, a near-copy of an object next door, a picklist with two items
// that wanted to be a checkbox, a nav nobody can scan. An AI builder produces these at a rate
// a human never would, because the dominant CRM shape in its training data is a large one --
// and on a platform where NOTHING DELETES, every one of them is permanent.
//
// The case that prompted this: "create a new deal object to capture sales opportunities" on an
// instance that already had opportunity_p, opportunity_line_c, quote_c, order_c and pricebooks.
// It produced a correct, well-formed deal_c whose fields were 10/13 a rename of opportunity_p's,
// and put it in the nav beside Opportunities. The model NOTICED -- and said so after building,
// which is the wrong end of the job. Ordering is the whole value here.
//
// So it ASKS, never denies. Every finding is a judgement about intent, and a second object is
// sometimes genuinely right. What it changes is WHEN the question gets asked.
//
// Noise control is the entire design constraint. It fires only on a component file that is NEW,
// or on a threshold a change newly CROSSES -- never on an edit that leaves both alone. Tuned
// against a real 46-object instance; see test/guard-footprint.test.mjs for what it must stay
// quiet about.

import { readFileSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

import { afterText } from './guard-custom-ui-surface.mjs'

// One block, so the numbers are readable and a test can pin them against the skill's prose.
export const LIMITS = {
  OBJECT_FIELDS: 25,
  PICKLIST_MAX_THIN: 2,
  COLLECTION_TABS: 15,
  FIELD_OVERLAP: 0.6,
  // Below this many DISTINCTIVE fields, an overlap ratio means nothing. Calibrated on a real
  // 46-object instance: without it the check fired on 26% of the objects already there, and
  // most of those were four-field objects whose name/owner/status/date matched everything.
  // With it the survivors are the genuine near-copies. See MEANINGLESS below.
  MIN_DISTINCTIVE_FIELDS: 6
}

// Field names that sit on almost every object and therefore carry no evidence of duplication.
// `engagement_c` and `project_task_c` share name, status, owner and two dates -- that is what
// a CRM record looks like, not a copy.
const MEANINGLESS = new Set([
  'name', 'owner', 'status', 'description', 'active', 'notes', 'comment', 'comments',
  'label', 'type', 'sequence', 'extid', 'external_id', 'start_date', 'end_date', 'date'
])

const METADATA = /(^|[/\\])metacode[/\\]metadata[/\\]([a-z_]+)[/\\]([^/\\]+)\.json$/

// Words a business uses for something the platform already ships. The object catalogue on disk
// is the primary source -- this only covers the names that do not match by string.
const SYNONYMS = {
  deal: 'opportunity_p',
  pipeline: 'opportunity_p',
  company: 'account_p',
  organization: 'account_p',
  organisation: 'account_p',
  org: 'account_p',
  customer: 'account_p',
  client: 'account_p',
  firm: 'account_p',
  person: 'contact_p',
  people: 'contact_p',
  prospect: 'lead_p',
  ticket: 'case_p',
  issue: 'case_p',
  incident: 'case_p',
  todo: 'task_p',
  reminder: 'task_p',
  followup: 'task_p',
  activity: 'activity_p',
  event: 'meeting_p',
  appointment: 'meeting_p',
  sku: 'product_p',
  item: 'product_p',
  document: 'file_p',
  attachment: 'attachment_p',
  user: 'user_p',
  staff: 'employee_p',
  worker: 'employee_p'
}

// ---- reading the instance around the file being written -----------------------------

export function instanceRoot (path) {
  let dir = dirname(path)
  while (dir && dir !== dirname(dir)) {
    if (dir.endsWith(`${sep}metacode`) || dir.endsWith('/metacode')) return dir
    dir = dirname(dir)
  }
  return null
}

const readJson = (path) => {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
}

const listJson = (dir) => {
  try { return readdirSync(dir).filter((f) => f.endsWith('.json')) } catch { return [] }
}

// Components live across tiers: `metadata/` is what is authored here, `active/` is what is
// already deployed, `platform/` is what ships. A footprint question spans all three -- an
// object deployed last month is just as real as one authored this morning.
export function loadObjects (root, tiers = ['metadata', 'active', 'platform', 'compiled']) {
  const objects = new Map()
  for (const tier of tiers) {
    const dir = join(root, tier, 'object_p')
    for (const file of listJson(dir)) {
      const doc = readJson(join(dir, file))
      if (!doc?.name || objects.has(doc.name)) continue
      objects.set(doc.name, { ...doc, tier })
    }
  }
  return objects
}

// `amount_c` and `amount_p` are the same word wearing different namespaces, which is exactly
// what makes a duplicate object hard to see by eye.
export const bareName = (name) => String(name ?? '').replace(/_(c|p|a)$/, '')

export const fieldWords = (doc) =>
  new Set((doc?.fields ?? []).map((field) => bareName(field?.name)).filter(Boolean))

// What is left once the words every object has are dropped. This is the object's actual shape,
// and the thing worth comparing.
export const distinctiveWords = (doc) =>
  new Set([...fieldWords(doc)].filter((word) => !MEANINGLESS.has(word)))

// Share of the NEW object's own fields that something else already has. The denominator is the
// new object deliberately: a 13-field copy of a 40-field platform object is still a copy.
export function overlap (candidate, existing) {
  const mine = fieldWords(candidate)
  if (mine.size === 0) return 0
  const theirs = fieldWords(existing)
  let shared = 0
  for (const word of mine) if (theirs.has(word)) shared++
  return shared / mine.size
}

// ---- the checks ----------------------------------------------------------------------

function objectFindings (doc, before, root) {
  const findings = []
  const objects = loadObjects(root)
  const bare = bareName(doc.name)
  const isNew = before === null

  if (isNew) {
    // A thin object cannot be judged by overlap -- four generic fields match everything. Its
    // name and the synonym table still speak, because those do not depend on field count.
    const comparable = distinctiveWords(doc).size >= LIMITS.MIN_DISTINCTIVE_FIELDS

    const candidates = []
    for (const [name, existing] of objects) {
      if (name === doc.name) continue
      const share = comparable ? overlap(doc, existing) : 0
      const sameWord = bareName(name) === bare
      const synonym = SYNONYMS[bare] === name
      if (share >= LIMITS.FIELD_OVERLAP || sameWord || synonym) {
        candidates.push({ name, share, sameWord, synonym, tier: existing.tier })
      }
    }
    // The synonym table does not need the catalogue. Builder fills `platform/` in every real
    // instance folder, but a fresh or partially-downloaded one can have it empty -- and the
    // word "deal" means opportunity whether or not the tier happens to be on disk. Without
    // this the check went quiet exactly where a new instance needs it most.
    if (SYNONYMS[bare] && !candidates.some((hit) => hit.name === SYNONYMS[bare])) {
      candidates.push({ name: SYNONYMS[bare], share: 0, sameWord: false, synonym: true, tier: 'platform' })
    }

    candidates.sort((a, b) => b.share - a.share)
    for (const hit of candidates.slice(0, 3)) {
      const pct = Math.round(hit.share * 100)
      const why = hit.synonym
        ? `\`${bare}\` is what people call \`${hit.name}\``
        : hit.sameWord
          ? `\`${hit.name}\` is the same word in another namespace`
          : `${pct}% of this object's field names are already on \`${hit.name}\``
      findings.push(
        `**\`${doc.name}\` looks like \`${hit.name}\`, which this instance already has.** ${why}` +
        (hit.share > 0 && !hit.synonym ? '' : ` (${pct}% of its field names match.)`) +
        ` Adding fields to \`${hit.name}\`, or an \`object_type_p\` on it, keeps one place for the` +
        ' concept. A second object splits reports, list views, triggers and every integration.'
      )
    }

    const unfinished = incompleteObjects(root, objects)
    if (unfinished.length) {
      findings.push(
        `**${unfinished.length} object${unfinished.length > 1 ? 's' : ''} here still cannot be used:** ` +
        unfinished.slice(0, 4).map((name) => `\`${name}\``).join(', ') +
        `${unfinished.length > 4 ? ', …' : ''} — each is missing a layout, a list view or a tab in a` +
        ' collection. An object nobody can open is not yet a feature. Finish those before adding another.'
      )
    }
  }

  const fields = doc.fields?.length ?? 0
  const fieldsBefore = before?.fields?.length ?? 0
  if (fields > LIMITS.OBJECT_FIELDS && fieldsBefore <= LIMITS.OBJECT_FIELDS) {
    findings.push(
      `**\`${doc.name}\` now has ${fields} fields**, past the ${LIMITS.OBJECT_FIELDS} this guard` +
      ' watches for. That is usually two concepts in one object, or a variant that wants an' +
      ' `object_type_p` with its own layout. Every field is permanent and shows on a layout' +
      ' someone has to read.'
    )
  }
  return findings
}

// An object is usable only with a layout, a list view, and a tab placed in a collection.
//
// Scoped to objects that are already DEPLOYED (present in `active/`), and deliberately so. A
// build authors the object first and its layout a minute later, so an object sitting in
// `metadata/` without one is normal work in progress -- flagging it would fire on every second
// object anyone ever creates, which is how a guard gets switched off. An object that reached
// the instance and still has no way in is a different thing: it shipped unusable.
function incompleteObjects (root, objects) {
  const deployed = new Set()
  for (const file of listJson(join(root, 'active', 'object_p'))) {
    const doc = readJson(join(root, 'active', 'object_p', file))
    if (doc?.name) deployed.add(doc.name)
  }
  if (deployed.size === 0) return []
  const placed = { layout_p: new Set(), list_view_p: new Set(), tab_p: new Set() }
  for (const tier of ['metadata', 'active', 'compiled']) {
    for (const ctype of Object.keys(placed)) {
      const dir = join(root, tier, ctype)
      for (const file of listJson(dir)) {
        const doc = readJson(join(dir, file))
        const owner = doc?.object ?? String(doc?.name ?? '').split('.')[0]
        if (owner) placed[ctype].add(owner)
      }
    }
  }
  const missing = []
  for (const [name, doc] of objects) {
    if (!name.endsWith('_c') || doc.tier === 'platform') continue
    if (!deployed.has(name)) continue
    if (!placed.layout_p.has(name) || !placed.list_view_p.has(name) || !placed.tab_p.has(name)) {
      missing.push(name)
    }
  }
  return missing.sort()
}

function picklistFindings (doc, before) {
  const items = doc.items?.length ?? 0
  const itemsBefore = before?.items?.length ?? 0
  if (before !== null && itemsBefore === items) return []
  if (items === 0 || items > LIMITS.PICKLIST_MAX_THIN) return []
  return [
    `**\`${doc.name}\` is a picklist with ${items} item${items === 1 ? '' : 's'}.** ` +
    (items <= 2
      ? 'Two values is a `checkbox` field, which needs no picklist component, no items to keep in sync, and reads as a yes/no in every list view. '
      : '') +
    'A picklist earns its place when the set is open to growing; one that will not grow is a field.'
  ]
}

function collectionFindings (doc, before) {
  const tabs = doc.tabs?.length ?? 0
  const tabsBefore = before?.tabs?.length ?? 0
  if (tabs <= LIMITS.COLLECTION_TABS || tabsBefore > LIMITS.COLLECTION_TABS) return []
  return [
    `**\`${doc.name}\` now lists ${tabs} tabs**, past the ${LIMITS.COLLECTION_TABS} this guard` +
    ' watches for. A nav this long is scanned by nobody. Most of these are probably child records' +
    ' reachable from their parent\'s layout as a related list, which costs no nav entry at all.'
  ]
}

// ---- the decision -----------------------------------------------------------------------

export function decide (filePath, toolInput, read = null) {
  const path = String(filePath ?? '')
  const match = path.match(METADATA)
  if (!match) return null
  const ctype = match[2]
  if (!['object_p', 'picklist_p', 'tab_collection_p'].includes(ctype)) return null

  const root = instanceRoot(path)
  if (!root) return null

  const readFile = read ?? ((p) => { try { return readFileSync(p, 'utf8') } catch { return null } })
  const text = afterText(path, toolInput, readFile)
  if (text === null) return null

  let doc
  try { doc = JSON.parse(text) } catch { return null }
  if (!doc || typeof doc !== 'object' || !doc.name) return null
  if (doc.active === false) return null

  const previous = readFile(path)
  let before = null
  if (previous !== null) { try { before = JSON.parse(previous) } catch { before = null } }

  let findings = []
  if (ctype === 'object_p') findings = objectFindings(doc, before, root)
  if (ctype === 'picklist_p') findings = picklistFindings(doc, before)
  if (ctype === 'tab_collection_p') findings = collectionFindings(doc, before)
  if (!findings.length) return null

  return [
    'Before this lands — **nothing on this platform deletes**, so every component here is' +
    ' permanent, and the cheapest moment to not build one is now.',
    findings.join('\n\n'),
    'If it is right, say why in one line and carry on: a genuinely distinct concept, a different' +
    ' lifecycle, a different audience. The `lean-data-model` skill has the questions. What this' +
    ' guard is for is making the question arrive BEFORE the files, not in the summary after them.'
  ].join('\n\n')
}

export const ask = (reason) => JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'ask',
    permissionDecisionReason: reason
  }
})

async function readStdin () {
  if (process.stdin.isTTY) return {}
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { return {} }
}

// "Am I being run, or imported?" -- see the note in the other hooks; a false here is a silent
// no-op the host cannot tell apart from "allowed".
function invokedDirectly () {
  const argv = process.argv[1]
  if (!argv) return false
  if (import.meta.url === pathToFileURL(argv).href) return true
  try { return import.meta.url === pathToFileURL(realpathSync(argv)).href } catch { return false }
}

if (invokedDirectly()) {
  try {
    const payload = await readStdin()
    const input = payload?.tool_input
    const reason = decide(input?.file_path, input)
    if (reason) process.stdout.write(ask(reason))
  } catch { /* a guard that crashes must not take the session with it */ }
  process.exit(0)
}
