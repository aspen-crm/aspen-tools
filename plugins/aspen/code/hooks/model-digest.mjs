#!/usr/bin/env node
// Builds a Markdown digest of an Aspen instance's metadata.
//
// The digest is a pure function of the files already on disk. This script never
// touches the network and never runs the aspen CLI, so it is safe on a session-start
// hook: worst case it finds nothing and says so.
//
// An Aspen metacode tree holds four layers of the SAME component, so the index is
// keyed by (ctype, name) and carries the layers -- never one entry per file. See
// docs/superpowers/specs/2026-09-09-aspen-model-digest-design.md.
//
// Modes:
//   detect         propose roots by sampling file content, write aspen-model.json
//   build          rebuild unconditionally (run it by hand)
//   verify <dir>   report what would be inferred from a real tree; writes nothing
//   session-start  rebuild if the metadata changed since the last build, then report
//   post-tool      react to an `aspen` command that just ran (rebuild, or mark stale)

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, relative, resolve } from 'node:path'

const CONFIG_NAME = 'aspen-model.json'
const DEFAULT_OUT = '.aspen-model'
const STATE_FILE = 'digest.json'
const LAYERS = ['baseline', 'liveOverlay', 'authored', 'resolved']

// A rule needs this many distinct components behind it. Chosen from evidence, not
// taste: on a real instance every genuine rule cleared 17, and every pattern at 2 was
// a name coincidence between two ordinary authored fields.
const MIN_EVIDENCE = 3

// Directory names each producer happens to use. Only ever a fallback -- content wins,
// because the CLI lets the caller name these roots whatever they like.
const KNOWN_NAMES = { platform: 'baseline', active: 'liveOverlay', metadata: 'authored', compiled: 'resolved' }

const MEMBER_KEYS = ['fields', 'sections', 'items', 'columns', 'members', 'values', 'picklistValues']

// ------------------------------------------------------------------ filesystem

const isDir = (p) => { try { return statSync(p).isDirectory() } catch { return false } }
const subdirs = (p) => { try { return readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => join(p, e.name)) } catch { return [] } }
const jsonFiles = (p) => { try { return readdirSync(p).filter((f) => f.endsWith('.json')).map((f) => join(p, f)) } catch { return [] } }
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null } }

function newestMtime (paths) {
  let newest = 0
  for (const p of paths) { try { newest = Math.max(newest, statSync(p).mtimeMs) } catch { /* gone */ } }
  return newest
}

// A ctype directory holds a component type's files: <root>/<ctype>/<name>.json.
// Component types are platform-defined and so are always namespace-suffixed. Requiring
// that keeps an ordinary directory that merely contains JSON from being adopted as a
// metadata root -- real projects are full of those.
const CTYPE_DIR = /_[pc]$/
const ctypeDirs = (root) => subdirs(root).filter((d) => CTYPE_DIR.test(basename(d)) && jsonFiles(d).length > 0)

// ------------------------------------------------------------- instance folder

// Builder creates one folder per instance under ~/Aspen, named <domain>-<instance>,
// and `aspen init --dir` defaults to the same root. That folder is where a session
// has to be rooted: the CLI resolves the instance from the login, and the hooks and
// the digest all key off the session's own directory.
const ASPEN_HOME = 'Aspen'
const BUILDER_STATE = join('.aspen', 'state.json')

// Recognise the folder by what Builder leaves in it, never by its name -- the name
// is the instance's, and nothing on disk has to match it. `.aspen/` holds the token
// as well as the cache, so existence is all this ever asks about; it is never read.
const isInstanceFolder = (dir) =>
  isDir(join(dir, 'metacode')) || existsSync(join(dir, BUILDER_STATE))

// Where this session sits relative to the instance folders on the machine.
export function locate (cwd, home = homedir()) {
  if (isInstanceFolder(cwd)) return { where: 'instance', name: basename(cwd) }

  // Only ever speak up from the two directories a person lands in by mistake. A
  // machine with instance folders on it is somebody's daily driver, and an Aspen
  // notice in an unrelated repo is noise every session for the rest of their life.
  const root = join(home, ASPEN_HOME)
  if (cwd !== root && cwd !== home) return { where: 'elsewhere' }

  const instances = subdirs(root).filter(isInstanceFolder).map((d) => basename(d))
  return instances.length ? { where: 'near', instances } : { where: 'elsewhere' }
}

// ---------------------------------------------------------------------- detect

// Classify a root by what its files contain, not by what it is called.
function classify (root) {
  const sample = ctypeDirs(root).flatMap((d) => jsonFiles(d)).slice(0, 25).map(readJson).filter(Boolean)
  if (!sample.length) return null
  if (sample.some((d) => d._derived)) return 'resolved'
  if (sample.some((d) => d.extends)) return 'overlay'
  return 'baseline'
}

export function detect (cwd) {
  const roots = {}
  const confidence = {}
  const candidates = [cwd, ...subdirs(cwd), ...subdirs(cwd).flatMap(subdirs)]
  const overlays = []

  for (const dir of candidates) {
    const kind = classify(dir)
    const name = KNOWN_NAMES[basename(dir)]
    if (kind === 'baseline' || kind === 'resolved') {
      if (!roots[kind]) { roots[kind] = relative(cwd, dir); confidence[kind] = 'content' }
    } else if (kind === 'overlay') {
      overlays.push(dir)
    } else if (kind === null && name && isDir(dir) && !roots[name]) {
      // Nothing to sample -- an empty layer is normal in a fresh checkout.
      roots[name] = relative(cwd, dir)
      confidence[name] = 'name'
    }
  }

  // Both overlays carry `extends`, so content cannot tell live from authored. Fall
  // back to the directory name and flag it, which is why detect writes a proposal
  // rather than acting on its own.
  for (const dir of overlays) {
    const slot = KNOWN_NAMES[basename(dir)] === 'authored' ? 'authored' : 'liveOverlay'
    roots[slot] = relative(cwd, dir)
    confidence[slot] = overlays.length > 1 ? 'name' : 'content'
  }

  return { roots, confidence, out: DEFAULT_OUT }
}

// ---------------------------------------------------------------------- config

export function loadConfig (cwd) {
  const file = join(cwd, CONFIG_NAME)
  if (!existsSync(file)) return null
  const raw = readJson(file)
  if (!raw?.roots) return null
  const roots = {}
  for (const layer of LAYERS) if (raw.roots[layer]) roots[layer] = resolve(cwd, raw.roots[layer])
  return { cwd, roots, out: resolve(cwd, raw.out ?? DEFAULT_OUT) }
}

// --------------------------------------------------------------------- collect

const membersOf = (doc) => {
  for (const key of MEMBER_KEYS) {
    if (Array.isArray(doc?.[key])) {
      return doc[key].map((m) => ({
        name: m.name ?? m.field ?? String(m),
        type: m.type ?? null,
        subtype: m.subtype ?? null
      })).filter((m) => m.name)
    }
  }
  return []
}

export function collect (config) {
  const components = new Map()

  for (const layer of LAYERS) {
    const root = config.roots?.[layer]
    if (!root || !isDir(root)) continue
    for (const dir of ctypeDirs(root)) {
      const ctype = basename(dir)
      for (const path of jsonFiles(dir)) {
        const doc = readJson(path)
        if (!doc) continue
        const name = basename(path, '.json')
        const key = `${ctype}:${name}`
        if (!components.has(key)) components.set(key, { ctype, name, layers: {} })
        components.get(key).layers[layer] = { path, doc, members: membersOf(doc) }
      }
    }
  }

  for (const c of components.values()) {
    // What a human or Aspen actually wrote, across every authored layer.
    const authored = new Set(
      ['baseline', 'liveOverlay', 'authored']
        .flatMap((l) => c.layers[l]?.members ?? [])
        .map((m) => m.name)
    )

    if (c.layers.resolved) {
      // compiled/ IS the merge -- read it rather than recomputing it.
      c.resolved = true
      c.source = 'compiled'
      c.members = c.layers.resolved.members.map((m) => ({ ...m, derived: !authored.has(m.name) }))
    } else {
      c.resolved = false
      c.source = 'baseline+overlay'
      const seen = new Set()
      c.members = ['baseline', 'liveOverlay', 'authored']
        .flatMap((l) => c.layers[l]?.members ?? [])
        .filter((m) => !seen.has(m.name) && seen.add(m.name))
        .map((m) => ({ ...m, derived: false }))
    }
    c.custom = c.members.filter((m) => /_c$/.test(m.name)).map((m) => m.name)
  }

  return { components, roots: config.roots }
}

// ----------------------------------------------------------------- infer rules

// Rules are learned from the instance's own files, never hardcoded, so a platform
// change arrives with the next download instead of a plugin release.
export function inferRules (model) {
  const rules = []
  const resolved = [...model.components.values()].filter((c) => c.resolved)

  // Members that appear in every resolved component of a ctype and are authored in
  // none. Scoped per ctype: a layout shares no member with an object, so intersecting
  // across every ctype at once collapses to nothing and the rule is lost.
  const byCtype = new Map()
  for (const c of resolved) {
    if (!byCtype.has(c.ctype)) byCtype.set(c.ctype, [])
    byCtype.get(c.ctype).push(c)
  }
  for (const [ctype, list] of byCtype) {
    if (list.length < MIN_EVIDENCE) continue
    let universal = null
    for (const c of list) {
      const derived = c.members.filter((m) => m.derived).map((m) => m.name)
      universal = universal === null ? new Set(derived) : new Set([...universal].filter((n) => derived.includes(n)))
    }
    if (universal?.size) rules.push({ kind: 'standard-fields', ctype, fields: [...universal], evidence: list.length })
  }

  // A companion is a member whose name is built from another member's name. Evidence
  // is counted in distinct components, so a pattern that recurs inside one component
  // cannot manufacture a rule.
  const seen = new Map()
  for (const c of resolved) {
    const names = c.members.map((m) => m.name)
    for (const src of c.members) {
      const m = /^(.*)_([a-z])$/.exec(src.name)
      if (!m) continue
      const [, stem] = m
      for (const candidate of names) {
        if (candidate === src.name) continue
        const hit = new RegExp(`^${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.+)_([a-z])$`).exec(candidate)
        if (!hit) continue
        const key = `${src.type}/${src.subtype ?? '-'}|${hit[1]}`
        if (!seen.has(key)) seen.set(key, { trigger: `${src.type}/${src.subtype ?? '-'}`, affix: hit[1], components: new Set(), examples: [] })
        const rule = seen.get(key)
        rule.components.add(`${c.ctype}:${c.name}`)
        if (rule.examples.length < 3) rule.examples.push(`${src.name} -> ${candidate}`)
      }
    }
  }

  for (const rule of seen.values()) {
    if (rule.components.size < MIN_EVIDENCE) continue
    rules.push({ kind: 'companion', trigger: rule.trigger, affix: rule.affix, evidence: rule.components.size, examples: rule.examples })
  }

  return rules.sort((a, b) => b.evidence - a.evidence)
}

// A map is expensive to produce, so a rebuild should only invalidate the ones whose
// source files actually moved. The signature is over each contributing file's path and
// mtime, per ctype.
function signatures (model, config) {
  const perCtype = new Map()
  for (const c of model.components.values()) {
    if (!perCtype.has(c.ctype)) perCtype.set(c.ctype, [])
    for (const layer of LAYERS) {
      const l = c.layers[layer]
      if (!l) continue
      let mtime = 0
      try { mtime = statSync(l.path).mtimeMs } catch { /* gone */ }
      perCtype.get(c.ctype).push(`${relative(config.cwd ?? process.cwd(), l.path)}@${mtime}`)
    }
  }
  const out = {}
  for (const [ctype, parts] of perCtype) {
    out[ctype] = createHash('sha256').update(parts.sort().join('\n')).digest('hex').slice(0, 16)
  }
  return out
}

const mapSignature = (body) => /<!--\s*signature:\s*([0-9a-f]+)\s*-->/.exec(body ?? '')?.[1] ?? null

// ---------------------------------------------------------------------- render

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|')
const slug = (c) => `${c.ctype}__${c.name}`.replace(/[^A-Za-z0-9_.-]/g, '_')

function renderIndex (model, rules, meta) {
  const all = [...model.components.values()]
  const byCtype = new Map()
  for (const c of all) byCtype.set(c.ctype, (byCtype.get(c.ctype) ?? 0) + 1)

  const lines = [
    '# Aspen model digest',
    '',
    '<!-- Generated by the aspen plugin. Do not edit; edits are overwritten. -->',
    '',
    `- Components: ${all.length}`,
    `- Resolved from \`compiled/\`: ${all.filter((c) => c.resolved).length}`,
    `- Unresolved (baseline + overlay only): ${all.filter((c) => !c.resolved).length}`,
    `- Generated: ${meta.generatedAt}`,
    '',
    'This indexes the downloaded metadata; it does not replace it. Every component page',
    'names its source files, and the instance validates on checkin and is the only',
    'authority. An **unresolved** entry has no `compiled/` file, so its member list is',
    'what was authored, not what the instance actually has.',
    '',
    '## Component types',
    '',
    '| Type | Components | Inventory | Map |',
    '| --- | --- | --- | --- |'
  ]
  for (const [ctype, count] of [...byCtype].sort((a, b) => b[1] - a[1])) {
    const body = meta.maps.get(`${ctype}.md`)
    const fresh = body != null && mapSignature(body) === meta.signatures[ctype]
    const map = body == null ? '—' : `\`maps/${ctype}.md\`${fresh ? '' : ' (stale)'}`
    lines.push(`| ${esc(ctype)} | ${count} | \`types/${ctype}.md\` | ${map} |`)
  }

  lines.push('', '## Derived members', '')
  if (!rules.length) {
    lines.push('No rule cleared the evidence threshold. Per-component pages still mark which')
    lines.push('members are derived, so the patterns remain readable from the entries themselves.')
  } else {
    lines.push(`Inferred from this instance's own files. A rule ships only with **${MIN_EVIDENCE}+ components**`)
    lines.push('behind it; thinner patterns stay as per-component observations rather than rules.')
    lines.push('')
    lines.push('| Rule | Detail | Evidence |')
    lines.push('| --- | --- | --- |')
    for (const r of rules) {
      if (r.kind === 'standard-fields') {
        lines.push(`| standard fields on \`${esc(r.ctype)}\` | ${r.fields.map((f) => `\`${f}\``).join(', ')} | ${r.evidence} components |`)
      } else {
        lines.push(`| companion | a \`${esc(r.trigger)}\` member adds \`${esc(r.affix)}\` — e.g. ${esc(r.examples[0])} | ${r.evidence} components |`)
      }
    }
    lines.push('')
    lines.push('**Do not author a derived member.** The instance adds it; authoring it too is a')
    lines.push('checkin error.')
  }

  lines.push('', '## Finding a component', '', '```',
    'grep -i "<name>" .aspen-model/types/*.md   # locate it, get its page',
    'cat .aspen-model/components/<page>.md      # members, layers, source paths', '```', '')
  return lines.join('\n')
}

function renderComponent (c, cwd) {
  const lines = [
    `# ${c.name}`,
    '',
    `- Type: \`${c.ctype}\``,
    `- Members: ${c.members.length} (${c.resolved ? 'resolved from `compiled/`' : 'baseline + overlay; **no compiled file**'})`
  ]
  if (c.custom.length) lines.push(`- Custom members: ${c.custom.map((n) => `\`${n}\``).join(', ')}`)
  lines.push('', '## Layers', '', '| Layer | Source |', '| --- | --- |')
  for (const layer of LAYERS) {
    if (c.layers[layer]) lines.push(`| ${layer} | \`${esc(relative(cwd, c.layers[layer].path))}\` |`)
  }
  if (c.layers.liveOverlay && c.layers.authored) {
    lines.push('', '> Live and authored overlays both exist. Where they differ is what has not been checked in.')
  }
  lines.push('', '**Author against the source file, not this page.**', '')
  if (c.members.length) {
    lines.push('## Members', '', '| Name | Type | Origin |', '| --- | --- | --- |')
    for (const m of c.members) {
      lines.push(`| \`${esc(m.name)}\` | ${esc(m.type ?? '')}${m.subtype ? '/' + esc(m.subtype) : ''} | ${m.derived ? 'derived — do not author' : 'authored'} |`)
    }
  }
  return lines.join('\n') + '\n'
}

function renderTypeInventory (ctype, list) {
  const lines = [
    `# ${ctype} — ${list.length} components`,
    '',
    'Grep this file; do not read it whole on a large instance.',
    '',
    '| Component | Members | Resolved | Custom | Page |',
    '| --- | --- | --- | --- | --- |'
  ]
  for (const c of list.sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`| \`${esc(c.name)}\` | ${c.members.length} | ${c.resolved ? 'yes' : 'no'} | ${c.custom.length || ''} | \`components/${slug(c)}.md\` |`)
  }
  return lines.join('\n') + '\n'
}

// ----------------------------------------------------------------------- build

const GITIGNORE = ['*', '!.gitignore', '!maps/', '!maps/**', ''].join('\n')

// Maps are expensive LLM output and the one artifact a rebuild cannot regenerate.
function readMaps (dir) {
  const out = new Map()
  if (!isDir(dir)) return out
  for (const f of readdirSync(dir)) {
    try { out.set(f, readFileSync(join(dir, f), 'utf8')) } catch { /* skip */ }
  }
  return out
}

export function build (config) {
  const model = collect(config)
  if (!model.components.size) return { status: 'empty' }

  const rules = inferRules(model)
  const maps = readMaps(join(config.out, 'maps'))
  const staging = `${config.out}.building`

  rmSync(staging, { recursive: true, force: true })
  mkdirSync(join(staging, 'components'), { recursive: true })
  mkdirSync(join(staging, 'types'), { recursive: true })
  mkdirSync(join(staging, 'maps'), { recursive: true })

  const byCtype = new Map()
  for (const c of model.components.values()) {
    if (!byCtype.has(c.ctype)) byCtype.set(c.ctype, [])
    byCtype.get(c.ctype).push(c)
    writeFileSync(join(staging, 'components', `${slug(c)}.md`), renderComponent(c, config.cwd ?? process.cwd()))
  }
  for (const [ctype, list] of byCtype) {
    writeFileSync(join(staging, 'types', `${ctype}.md`), renderTypeInventory(ctype, list))
  }
  for (const [name, body] of maps) writeFileSync(join(staging, 'maps', name), body)

  const generatedAt = new Date().toISOString()
  const sigs = signatures(model, config)
  writeFileSync(join(staging, 'index.md'), renderIndex(model, rules, { generatedAt, maps, signatures: sigs }))
  writeFileSync(join(staging, '.gitignore'), GITIGNORE)

  const sourceMtime = newestMtime(
    Object.values(config.roots ?? {}).filter(isDir).flatMap((r) => ctypeDirs(r).flatMap(jsonFiles))
  )
  const state = {
    generatedAt,
    sourceMtime,
    components: model.components.size,
    resolved: [...model.components.values()].filter((c) => c.resolved).length,
    rules: rules.length,
    signatures: sigs,
    roots: config.roots,
    stale: false
  }
  writeFileSync(join(staging, STATE_FILE), JSON.stringify(state, null, 2))

  // Test seam: prove that a failure between staging and the swap destroys nothing.
  if (config.crashAfterStage) throw new Error('crash after stage (test)')

  // The one destructive moment, with nothing between the two calls.
  rmSync(config.out, { recursive: true, force: true })
  renameSync(staging, config.out)

  return { status: 'built', state, rules }
}

// --------------------------------------------------------------------- state io

const readState = (config) => readJson(join(config.out, STATE_FILE))

function markStale (config, reason) {
  const state = readState(config)
  if (!state) return false
  writeFileSync(join(config.out, STATE_FILE), JSON.stringify({ ...state, stale: true, staleReason: reason }, null, 2))
  const indexPath = join(config.out, 'index.md')
  try {
    const index = readFileSync(indexPath, 'utf8')
    if (!index.includes('> **Stale**')) {
      writeFileSync(indexPath, index.replace('# Aspen model digest\n',
        `# Aspen model digest\n\n> **Stale** — ${reason} Re-pull, then rebuild.\n`))
    }
  } catch { /* index missing; the state flag is enough */ }
  return true
}

const currentMtime = (config) =>
  newestMtime(Object.values(config.roots ?? {}).filter(isDir).flatMap((r) => ctypeDirs(r).flatMap(jsonFiles)))

// ----------------------------------------------------------------------- output

function emit (context) {
  if (context) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: process.env.ASPEN_HOOK_EVENT ?? 'SessionStart', additionalContext: context }
    }))
  }
  process.exit(0)
}

const describe = (state, extra = '') =>
  `Aspen model digest ready at \`${DEFAULT_OUT}/index.md\` (${state.components} components, ` +
  `${state.resolved} resolved). Read it before authoring; ${extra || 'open a component\'s source file for its authoritative shape.'}`

async function readStdin () {
  if (process.stdin.isTTY) return {}
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { return {} }
}

// ------------------------------------------------------------------------- main

// A crash must not be louder than the value this adds. In a hook, one line to stderr
// and exit 0: the swap above means the previous digest is still in place and its
// freshness stamp stays honest. Run by hand, a failure exits non-zero -- that is a
// person who wants to know.
function guard (mode, run) {
  try { return run() } catch (error) {
    process.stderr.write(`aspen model digest: ${error?.message ?? error}\n`)
    process.exit(mode === 'session-start' || mode === 'post-tool' ? 0 : 1)
  }
}

function cmdDetect (cwd) {
  const found = detect(cwd)
  if (!Object.keys(found.roots).length) {
    console.log('No Aspen metadata found here. Download an active set first.')
    return
  }
  const file = join(cwd, CONFIG_NAME)
  if (existsSync(file)) {
    console.log(`${CONFIG_NAME} already exists. Proposed roots:\n${JSON.stringify(found, null, 2)}`)
    return
  }
  writeFileSync(file, JSON.stringify(found, null, 2) + '\n')
  console.log(`Wrote ${CONFIG_NAME}:\n${JSON.stringify(found.roots, null, 2)}`)
  const guessed = Object.entries(found.confidence).filter(([, how]) => how === 'name').map(([l]) => l)
  if (guessed.length) console.log(`\nConfirm these — classified by directory name, not content: ${guessed.join(', ')}`)
}

function cmdVerify (dir) {
  const root = resolve(dir)
  const found = detect(root)
  const roots = {}
  for (const [layer, rel] of Object.entries(found.roots)) roots[layer] = resolve(root, rel)
  const model = collect({ cwd: root, roots, out: join(root, DEFAULT_OUT) })
  const all = [...model.components.values()]
  console.log(`roots: ${JSON.stringify(found.roots)}`)
  console.log(`components: ${all.length} (${all.filter((c) => c.resolved).length} resolved)`)
  console.log('\nrules cleared:')
  for (const r of inferRules(model)) {
    console.log(r.kind === 'standard-fields'
      ? `  standard-fields x${r.evidence}: ${r.fields.join(', ')}`
      : `  companion x${r.evidence}: ${r.trigger} + "${r.affix}"  e.g. ${r.examples[0]}`)
  }
}

// What to say when there is no metadata to index: it depends entirely on where the
// session is, and in most places the answer is nothing at all.
function guidance (place) {
  if (place.where === 'instance') {
    return `This is the Aspen instance folder \`${place.name}\`, but no metadata has been ` +
      'downloaded into it yet. Read the model before authoring — the `read-metadata` skill has ' +
      'the loop for pulling the active set. The digest builds itself once the files land.'
  }
  if (place.where === 'near') {
    return 'No Aspen metadata here. Builder keeps each instance in its own folder under ' +
      `\`~/${ASPEN_HOME}\`: ${place.instances.map((n) => `\`${n}\``).join(', ')}. Aspen work happens ` +
      'with Claude Code rooted in one of those — ask the human to reopen it there rather than ' +
      'working from here.'
  }
  return ''
}

function sessionStart (cwd, home = homedir()) {
  const config = loadConfig(cwd)
  if (!config) {
    // No config. Metadata on disk means this is an Aspen project that just needs
    // indexing; otherwise where the session sits decides whether to say anything.
    const found = detect(cwd)
    if (!Object.keys(found.roots).length) emit(guidance(locate(cwd, home)))
    emit(`Aspen metadata is here but not indexed. Run \`node "\${CLAUDE_PLUGIN_ROOT}/hooks/model-digest.mjs" detect\` to write ${CONFIG_NAME}, then build the digest.`)
  }
  const state = readState(config)
  if (state && !state.stale && currentMtime(config) <= state.sourceMtime) emit(describe(state))
  const result = build(config)
  emit(result.status === 'built' ? describe(result.state, 'it was just rebuilt from the metadata on disk.') : '')
}

function postTool (cwd, payload) {
  const command = String(payload?.tool_input?.command ?? '')
  if (!/\baspen\b/.test(command)) process.exit(0)
  const config = loadConfig(cwd)
  if (!config) process.exit(0)

  if (/download[-\s]?active[-\s]?set|\bpull\b|\binit\b/.test(command)) {
    const result = build(config)
    emit(result.status === 'built' ? describe(result.state, 'it was just rebuilt from the download you ran.') : '')
  }
  if (/\b(checkin|check-in|deploy|promote|submit)\b/.test(command)) {
    if (markStale(config, 'the instance changed after this digest was built.')) {
      emit('The Aspen model digest is now stale — you changed the instance. Re-pull before reading the model again.')
    }
  }
  process.exit(0)
}

// Only run as a CLI, so importing this module from tests has no side effects.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] ?? 'build'
  const cwd = process.cwd()

  if (mode === 'detect') guard(mode, () => cmdDetect(cwd))
  else if (mode === 'verify') guard(mode, () => cmdVerify(process.argv[3] ?? cwd))
  else if (mode === 'build') {
    guard(mode, () => {
      const config = loadConfig(cwd)
      if (!config) { console.log(`No ${CONFIG_NAME}. Run \`model-digest.mjs detect\` first.`); process.exit(1) }
      const result = build(config)
      console.log(result.status === 'built' ? describe(result.state) : 'No Aspen metadata found under the configured roots.')
    })
  } else if (mode === 'session-start') {
    process.env.ASPEN_HOOK_EVENT = 'SessionStart'
    guard(mode, () => sessionStart(cwd))
  } else if (mode === 'post-tool') {
    process.env.ASPEN_HOOK_EVENT = 'PostToolUse'
    const payload = await readStdin()
    guard(mode, () => postTool(cwd, payload))
  } else {
    console.error(`Unknown mode: ${mode}. Use detect, build, verify, session-start, or post-tool.`)
    process.exit(1)
  }
}
