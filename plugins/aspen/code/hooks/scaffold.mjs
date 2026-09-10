#!/usr/bin/env node
// Writes an authored component file from the shape of a real one on this instance.
//
// The shape of a tab collection, a list view or an object overlay is not something to
// reason out: a real component of the type is already on disk, and copying it is a
// script's job. The model decides WHAT to build -- the name, the label, which tabs --
// and this does the rest: the attribute set, the member entry shapes, the directory and
// the filename. Nothing about any shape is hardcoded, so a platform change arrives with
// the next download instead of a plugin release. The instance still validates on
// compile; this only makes the file it will be asked to validate.
//
// Modes:
//   new <ctype> <name>      a new custom component, copied from a real one of the type
//   extend <ctype> <name>   an `extends` overlay on a delivered component, carrying only
//                           what is added
//
// Options:
//   --like <name>           which component to copy (new only; default: a custom one of
//                           the type if there is one, else the first by name)
//   --label <text>          default: the name, humanised
//   --description <text>
//   --add <array>=<ref>     append an entry to a member array, cloned from the exemplar's
//                           first entry with its references pointed at <ref>
//   --set <path>=<json>     set any path; JSON where it parses, a string otherwise;
//                           `path[]` appends
//   --dry-run               print, write nothing
//   --force                 overwrite an existing authored file
//
// Reads only the files the digest reads. No network, no CLI.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { collect, inferRules, loadConfig } from './model-digest.mjs'

// The keys that identify a component rather than describe it. Set from the arguments,
// never copied.
const IDENTITY = ['name', 'label', 'description', 'namespace']

// ------------------------------------------------------------------ arguments

export function parseArgs (argv) {
  const [mode, ctype, name, ...rest] = argv
  const opts = { mode, ctype, name, add: [], set: [], dryRun: false, force: false }
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]
    const next = () => {
      if (i + 1 >= rest.length) throw new Error(`${arg} needs a value`)
      return rest[++i]
    }
    if (arg === '--like') opts.like = next()
    else if (arg === '--label') opts.label = next()
    else if (arg === '--description') opts.description = next()
    else if (arg === '--add') opts.add.push(splitAssignment(next(), '--add'))
    else if (arg === '--set') opts.set.push(splitAssignment(next(), '--set'))
    else if (arg === '--dry-run') opts.dryRun = true
    else if (arg === '--force') opts.force = true
    else throw new Error(`Unknown option ${arg}`)
  }
  if (!['new', 'extend'].includes(mode)) throw new Error('Mode must be `new` or `extend`')
  if (!ctype || !name) throw new Error(`Usage: ${mode} <ctype> <name> [options]`)
  return opts
}

function splitAssignment (text, flag) {
  const at = text.indexOf('=')
  if (at < 1) throw new Error(`${flag} takes <key>=<value>, got ${JSON.stringify(text)}`)
  return { key: text.slice(0, at), value: text.slice(at + 1) }
}

// -------------------------------------------------------------------- model

// A component is referenced by its name, or by `<name>.<ctype>` -- both spellings occur
// in real files. A download can be partial, so a pointer to something that is not on
// disk has to be recognised by its shape: on this platform every namespaced identifier
// ends in `_p` or `_c`, and no enum value does (`object_type`, `field`, `asc`).
const NAMESPACED = /^[a-z][a-z0-9_.]*_[pc]$/

function referenceSet (model) {
  const refs = new Set()
  for (const c of model.components.values()) {
    refs.add(c.name)
    refs.add(`${c.name}.${c.ctype}`)
  }
  return refs
}

const isRef = (refs, value) => typeof value === 'string' && (refs.has(value) || NAMESPACED.test(value))
const isCustom = (name) => /_c\b/.test(String(name ?? ''))

// The document to copy: the instance's own merge where it has one, else what was
// authored. A component with neither is a name with no shape behind it.
const docOf = (c) => c.layers.resolved?.doc ?? c.layers.baseline?.doc ?? c.layers.liveOverlay?.doc ?? c.layers.authored?.doc ?? null
const pathOf = (c) => (c.layers.resolved ?? c.layers.baseline ?? c.layers.liveOverlay ?? c.layers.authored)?.path

function ofType (model, ctype) {
  const list = [...model.components.values()].filter((c) => c.ctype === ctype && docOf(c))
  if (list.length) return list.sort((a, b) => a.name.localeCompare(b.name))
  const types = [...new Set([...model.components.values()].map((c) => c.ctype))].sort()
  throw new Error(`No component of type ${ctype} on this instance to copy. Types here: ${types.join(', ')}`)
}

function pickExemplar (model, ctype, like) {
  const list = ofType(model, ctype)
  if (like) {
    const hit = list.find((c) => c.name === like)
    if (!hit) throw new Error(`No ${ctype} named ${like}. Have: ${list.map((c) => c.name).join(', ')}`)
    return hit
  }
  return list.find((c) => /_c\b/.test(c.name)) ?? list[0]
}

const humanise = (name) =>
  name.replace(/\.[a-z_]+$/, '').replace(/_[pc]$/, '').split('_').filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

// ------------------------------------------------------------------- shaping

// The entry to clone when adding a member. Members the instance adds on its own --
// audit fields, companions -- must never be copied into something a person authors, and
// the digest already knows which they are. Among the rest, a custom entry is the best
// template for a custom entry: it is the shape a person on this instance actually wrote.
// A fresh custom object has nothing but derived members, so the search widens to the
// other components of the type before giving up.
const entryName = (e) => (e && typeof e === 'object') ? (e.name ?? e.field) : undefined

// A component with no authored layer on disk -- a partial download -- has every member
// flagged derived, because nothing says otherwise. The digest's rule for the type does:
// the members every resolved component of the type carries and none authored are the
// standard ones, and the rest are real fields.
const resolvedOnly = (c) => !c.layers.baseline && !c.layers.liveOverlay && !c.layers.authored

function candidates (component, key, standard) {
  const derived = resolvedOnly(component)
    ? standard
    : new Set(component.members.filter((m) => m.derived).map((m) => m.name))
  const list = docOf(component)?.[key]
  if (!Array.isArray(list)) return []
  return list.filter((e) => !derived.has(entryName(e)))
}

function templateFor (model, ctype, exemplar, key) {
  const standard = new Set(inferRules(model)
    .filter((r) => r.kind === 'standard-fields' && r.ctype === ctype)
    .flatMap((r) => r.fields))
  const others = [...model.components.values()].filter((c) => c.ctype === ctype && c !== exemplar && docOf(c))
  const own = candidates(exemplar, key, standard)
  const elsewhere = () => others.flatMap((c) => candidates(c, key, standard))
  const pick = own.find((e) => isCustom(entryName(e))) ?? own[0] ??
    elsewhere().find((e) => isCustom(entryName(e))) ?? elsewhere()[0]
  return pick === undefined ? undefined : structuredClone(pick)
}

// A cloned entry's references to ITSELF follow the new name -- a tab entry's `tab`
// points at the tab it names. Its references to anything else are cleared for the
// caller to fill: a lookup field cloned from one that pointed at contact_p does not
// now point at the new field.
function cloneEntry (template, refs, ref, at) {
  if (!template || typeof template !== 'object') return { entry: ref, fill: [] }
  const entry = structuredClone(template)
  const self = entryName(template)
  const fill = []
  for (const [k, v] of Object.entries(entry)) {
    if (!isRef(refs, v)) continue
    if (v === self || (self && v.startsWith(`${self}.`))) entry[k] = ref
    else { entry[k] = null; fill.push(`${at}.${k}`) }
  }
  if ('name' in entry) entry.name = ref.split('.')[0]
  if ('namespace' in entry) entry.namespace = isCustom(ref) ? 'custom' : 'platform'
  // label and description described the old member; they are identity, not shape.
  for (const k of ['label', 'description']) if (k in entry) entry[k] = null
  return { entry, fill }
}

// `a.b[0].c` and `a.b[]`. Written for the paths a component file actually has, not
// as a general-purpose JSON pointer.
function setPath (doc, path, raw) {
  let value
  try { value = JSON.parse(raw) } catch { value = raw }
  const steps = path.match(/[^.[\]]+|\[\]|\[\d+\]/g) ?? []
  let node = doc
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const last = i === steps.length - 1
    if (step === '[]') {
      if (!Array.isArray(node)) throw new Error(`${path}: [] on something that is not an array`)
      if (last) { node.push(value); return }
      node.push({}); node = node[node.length - 1]
      continue
    }
    const key = /^\[\d+\]$/.test(step) ? Number(step.slice(1, -1)) : step
    if (last) { node[key] = value; return }
    if (node[key] === undefined || node[key] === null) node[key] = /^\[/.test(steps[i + 1]) ? [] : {}
    node = node[key]
  }
}

export function scaffold (config, opts) {
  const model = collect(config)
  const refs = referenceSet(model)

  const exemplar = opts.mode === 'extend'
    ? ofType(model, opts.ctype).find((c) => c.name === opts.name) ??
      (() => { throw new Error(`No ${opts.ctype} named ${opts.name} on this instance to extend`) })()
    : pickExemplar(model, opts.ctype, opts.like)
  const source = docOf(exemplar)
  const templates = {}
  for (const [key, value] of Object.entries(source)) {
    if (!Array.isArray(value)) continue
    const t = templateFor(model, opts.ctype, exemplar, key)
    if (t !== undefined) templates[key] = t
  }

  const doc = {}
  const fill = []
  const cleared = {}

  if (opts.mode === 'new') {
    for (const [key, value] of Object.entries(source)) {
      if (key === '_derived') continue
      if (key === 'ctype') { doc.ctype = opts.ctype; continue }
      if (IDENTITY.includes(key)) { doc[key] = null; continue }
      if (Array.isArray(value)) {
        doc[key] = []
        if (key in templates) cleared[key] = templates[key]
        continue
      }
      if (isRef(refs, value)) { doc[key] = null; fill.push(key); continue }
      doc[key] = structuredClone(value)
    }
    doc.name = opts.name
    if ('label' in doc) doc.label = opts.label ?? humanise(opts.name)
    if ('description' in doc) doc.description = opts.description ?? null
    if ('namespace' in doc) doc.namespace = 'custom'
    if (!('ctype' in doc)) doc.ctype = opts.ctype
  } else {
    doc.ctype = opts.ctype
    doc.extends = opts.name
  }

  for (const { key, value } of opts.add) {
    if (!(key in templates)) templates[key] = templateFor(model, opts.ctype, exemplar, key)
    if (templates[key] === undefined) throw new Error(`No ${opts.ctype} on this instance has a ${key} entry to copy for --add ${key}=${value}`)
    if (!Array.isArray(doc[key])) doc[key] = []
    const { entry, fill: more } = cloneEntry(templates[key], refs, value, `${key}[${doc[key].length}]`)
    doc[key].push(entry)
    fill.push(...more)
    delete cleared[key]
  }
  for (const { key, value } of opts.set) setPath(doc, key, value)

  // A reference the caller filled with --set is no longer something to fill in.
  const stillEmpty = (path) => {
    const steps = path.match(/[^.[\]]+|\[\d+\]/g) ?? []
    let node = doc
    for (const step of steps) {
      const key = /^\[\d+\]$/.test(step) ? Number(step.slice(1, -1)) : step
      if (node == null) return true
      node = node[key]
    }
    return node === null || node === undefined
  }

  return {
    doc,
    exemplar: { name: exemplar.name, path: pathOf(exemplar), template: templates },
    fill: [...new Set(fill)].filter(stillEmpty),
    cleared
  }
}

// -------------------------------------------------------------------- output

export function write (config, out, { force = false } = {}) {
  const root = config.roots.authored
  if (!root) throw new Error('This instance has no authored root configured; nowhere to write')
  const path = join(root, out.doc.ctype, `${out.doc.name ?? out.doc.extends}.json`)
  if (existsSync(path) && !force) throw new Error(`${relative(config.cwd, path)} already exists. Pass --force to overwrite it.`)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(out.doc, null, 2) + '\n')
  return path
}

export function report (config, out, path) {
  const rel = (p) => relative(config.cwd, p)
  const lines = [
    `${path ? `Wrote ${rel(path)}` : 'Would write'} (from ${rel(out.exemplar.path)})`,
    JSON.stringify(out.doc, null, 2)
  ]
  if (out.fill.length) lines.push(`Fill in: ${[...out.fill].sort().join(', ')} — each referenced another component in the exemplar.`)
  for (const [key, entry] of Object.entries(out.cleared)) {
    lines.push(`Cleared ${key}; add entries with --add ${key}=<ref> or --set ${key}[]=<json>. Exemplar entry: ${JSON.stringify(entry)}`)
  }
  return lines.join('\n')
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const cwd = process.cwd()
  try {
    const opts = parseArgs(process.argv.slice(2))
    const config = loadConfig(cwd)
    if (!config) throw new Error('No aspen-model.json here. Run this from the instance folder, where the session-start hook wrote one.')
    const out = scaffold(config, opts)
    const path = opts.dryRun ? null : write(config, out, { force: opts.force })
    console.log(report(config, out, path))
  } catch (error) {
    console.error(`aspen scaffold: ${error?.message ?? error}`)
    process.exit(1)
  }
}
