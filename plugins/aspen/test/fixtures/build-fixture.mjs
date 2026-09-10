// Builds a synthetic Aspen metacode tree that is structurally faithful to a real
// instance, without publishing one. Shapes and derived-field names match what a real
// download produces; object and business-field names are invented.
//
// What the shapes encode, and which spec assertion each one serves:
//
//   contact_p     22 baseline fields, a 1-field extends overlay, 31 compiled
//                 (22 + 1 overlay + 8 standard). The two-files-one-component case.
//   note_p        polyid related_to_p with related_toon_p / related_todn_p companions
//   task_p        polyid owner_p    with owneron_p    / ownerdn_p
//   email_p       polyid who_p      with whoon_p      / whodn_p
//                 -> polyid pattern on 3 distinct objects, so it clears the threshold
//   deal_p        currency amount_p + authored amountcc_p; compiled adds ccode_p and
//                 ccdate_p -> 1 object only, so the rule is dropped but the
//                 per-component observation survives
//   alpha_p       authored score_p + score_chk_p    } the same name pattern on exactly
//   beta_p        authored score_p + score_chk_p    } 2 objects -> must be dropped
//   widget_p      baseline only, no compiled file -> the unresolved case
//
// UI coverage cases (layouts, list views, tabs, tab collections):
//
//   contact_p     layout + list view + tab, tab placed in a collection -> complete
//   deal_p/note_p layout only -> partial
//   task_p        list view + tab but NO layout, and its tab is in no collection
//                 -> both warnings at once: a row you can click that cannot open,
//                    and a tab nobody can reach
//   email_p       a list view named `special_view_p` -> grouping must read the
//                 `object` attribute, because the real platform ships names like
//                 `currency_view_p` that say nothing about their object
//   alpha_p, beta_p, widget_p   no UI at all

import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

export const STANDARD = ['id_p', 'cb_p', 'mb_p', 'ct_p', 'mt_p', 'smb_p', 'smt_p', 'extid_p']

const std = () => [
  { name: 'id_p', type: 'id', subtype: 'id' },
  { name: 'cb_p', type: 'id', subtype: 'lookup' },
  { name: 'mb_p', type: 'id', subtype: 'lookup' },
  { name: 'ct_p', type: 'datetime', subtype: 'datetime' },
  { name: 'mt_p', type: 'datetime', subtype: 'datetime' },
  { name: 'smb_p', type: 'id', subtype: 'lookup' },
  { name: 'smt_p', type: 'datetime', subtype: 'datetime' },
  { name: 'extid_p', type: 'text', subtype: 'case_sensitive' }
]

const f = (name, type = 'text', subtype = 'text') => ({ name, type, subtype })

// 22 plain business fields, matching the real contact_p baseline count.
const contactBaseline = Array.from({ length: 22 }, (_, i) => f(`contact_attr_${i + 1}_p`))

const polyid = (base) => [
  { name: `${base}_p`, type: 'polyid', subtype: 'parent' },
  f(`${base}on_p`, 'picklist', 'object_ref'),
  f(`${base}dn_p`)
]

const OBJECTS = {
  contact_p: { baseline: contactBaseline },
  note_p: { baseline: [f('title_p'), ...polyid('related_to')] },
  task_p: { baseline: [f('subject_p'), ...polyid('owner')] },
  email_p: { baseline: [f('subject_p'), ...polyid('who')] },
  deal_p: {
    baseline: [
      f('stage_p', 'picklist', 'picklist'),
      { name: 'amount_p', type: 'currency', subtype: 'currency' },
      { name: 'amountcc_p', type: 'currency', subtype: 'converted' }
    ],
    // added by the instance, authored nowhere -- the currency object-level companions
    derived: [f('ccode_p', 'picklist', 'picklist'), f('ccdate_p', 'datetime', 'datetime')]
  },
  // The decoy: the same derivable-looking name pattern on exactly two objects, and
  // authored in the baseline rather than added by the instance.
  alpha_p: { baseline: [{ name: 'score_p', type: 'id', subtype: 'parent' }, f('score_chk_p')] },
  beta_p: { baseline: [{ name: 'score_p', type: 'id', subtype: 'parent' }, f('score_chk_p')] },
  widget_p: { baseline: [f('label_p')], noCompiled: true }
}

const OVERLAY = { contact_p: [f('nickname_c')] }

export const LIST_VIEWS = [
  { name: 'contact_p.list_view_p', object: 'contact_p', tab: 'contact_p.tab_p', columns: ['contact_attr_1_p', 'contact_attr_2_p'] },
  { name: 'task_p.list_view_p', object: 'task_p', tab: 'task_p.tab_p', columns: ['subject_p'], 'query-filter': 'owner_p is not null' },
  // The name says nothing about its object, exactly like the platform's own
  // `currency_view_p`. Anything grouping by filename gets this one wrong.
  { name: 'special_view_p', object: 'email_p', tab: null, columns: ['subject_p'] }
]

export const TABS = [
  { name: 'contact_p.tab_p', object: 'contact_p', 'default-list-view': 'contact_p.list_view_p' },
  // Deliberately in no collection: the tab exists and nobody can reach it.
  { name: 'task_p.tab_p', object: 'task_p', 'default-list-view': 'task_p.list_view_p' }
]

export const TAB_COLLECTIONS = [
  { name: 'main_tabs_p', tabs: ['contact_p.tab_p'] }
]

export function buildFixture (root) {
  rmSync(root, { recursive: true, force: true })
  const write = (rel, body) => {
    const p = join(root, rel)
    mkdirSync(join(p, '..'), { recursive: true })
    writeFileSync(p, JSON.stringify(body, null, 2))
  }

  for (const [name, spec] of Object.entries(OBJECTS)) {
    write(`platform/object_p/${name}.json`, {
      ctype: 'object_p', name, label: name.replace(/_p$/, ''), fields: spec.baseline
    })

    const overlay = OVERLAY[name]
    if (overlay) {
      write(`active/object_p/${name}.json`, { ctype: 'object_p', extends: name, fields: overlay })
    }

    if (spec.noCompiled) continue
    write(`compiled/object_p/${name}.json`, {
      _derived: {
        attribution: 'none: this is the resolved document as the instance returned it',
        from: 'metadata',
        scalars: 'resolved, including platform defaults'
      },
      ctype: 'object_p',
      name,
      label: name.replace(/_p$/, ''),
      fields: [...std(), ...spec.baseline, ...(overlay ?? []), ...(spec.derived ?? [])]
    })
  }

  // A second ctype, so the tree is not all objects. Layouts carry sections and none of
  // the object standard fields -- a real instance mixes ctypes, and a rule computed
  // across all of them at once intersects to nothing.
  for (const name of ['contact_p.layout_p', 'deal_p.layout_p', 'note_p.layout_p']) {
    const sections = [{ name: 'main_p', label: 'Main', 'section-type': 'detail', columns: 2 }]
    // A real layout names the object it renders, and `object-type` is null unless the
    // layout is specific to one type. Coverage groups on that attribute.
    const doc = { ctype: 'layout_p', name, label: name, object: name.replace(/\.layout_p$/, ''), 'object-type': null, sections }
    write(`platform/layout_p/${name}.json`, doc)
    write(`compiled/layout_p/${name}.json`, {
      _derived: { attribution: 'none', from: 'metadata', scalars: 'resolved' },
      ...doc
    })
  }

  // List views, tabs and collections. A list view and its tab reference each other,
  // which is why the real ones are always authored as a pair.
  const col = (field) => ({ active: true, 'column-type': 'field', field, name: field })

  for (const lv of LIST_VIEWS) {
    const doc = {
      ctype: 'list_view_p',
      name: lv.name,
      label: lv.name,
      object: lv.object,
      columns: lv.columns.map(col),
      sort: [{ active: true, column: lv.columns[0], direction: 'asc', name: 'sort_p' }],
      'query-filter': lv['query-filter'] ?? null,
      tab: lv.tab ?? null
    }
    write(`platform/list_view_p/${lv.name}.json`, doc)
    write(`compiled/list_view_p/${lv.name}.json`, doc)
  }

  for (const tab of TABS) {
    const doc = {
      ctype: 'tab_p',
      name: tab.name,
      label: tab.name,
      object: tab.object,
      'default-list-view': tab['default-list-view'],
      'tab-type': 'object_type'
    }
    write(`platform/tab_p/${tab.name}.json`, doc)
    write(`compiled/tab_p/${tab.name}.json`, doc)
  }

  for (const tc of TAB_COLLECTIONS) {
    const doc = {
      ctype: 'tab_collection_p',
      name: tc.name,
      label: tc.name,
      tabs: tc.tabs.map((t) => ({ active: true, name: t.replace(/\.tab_p$/, ''), tab: t }))
    }
    write(`platform/tab_collection_p/${tc.name}.json`, doc)
    write(`compiled/tab_collection_p/${tc.name}.json`, doc)
  }

  // Authored custom source: present as a directory, empty, exactly like a fresh checkout.
  mkdirSync(join(root, 'metadata'), { recursive: true })

  // A decoy beside the instance: JSON in a directory that is not a component type.
  // Real projects are full of these, and one of them must not be mistaken for the
  // baseline just because it happens to contain JSON.
  write('../decoy/notatype/thing.json', { hello: 'world' })

  return root
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = process.argv[2]
  if (!out) { console.error('usage: build-fixture.mjs <dir>'); process.exit(1) }
  buildFixture(out)
  console.log(`fixture written to ${out}`)
}
