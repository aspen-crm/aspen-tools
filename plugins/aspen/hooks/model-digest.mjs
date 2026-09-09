#!/usr/bin/env node
// Builds a Markdown digest of the local Aspen metadata tree.
//
// The digest is a pure function of the metadata already on disk. This script never
// touches the network and never runs the aspen CLI, so it is safe on a session-start
// hook: worst case it finds nothing and says so.
//
// Modes:
//   session-start  rebuild if the metadata changed since the last build, then report
//   post-tool      react to an `aspen` command that just ran (rebuild, or mark stale)
//   build          rebuild unconditionally (run it by hand)

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'

const TIERS = ['platform', 'app', 'custom']
const OUT_DIRNAME = join('.aspen', 'model')
const CONFIG_PATH = join('.aspen', 'model.config.json')
const STATE_FILE = 'digest.json'
const MAX_DEPTH = 3

// ---------------------------------------------------------------- configuration

function loadConfig (cwd) {
  const config = { metadataRoot: null, outDir: join(cwd, OUT_DIRNAME), maxComponents: 20000 }
  const file = join(cwd, CONFIG_PATH)
  if (existsSync(file)) {
    try { Object.assign(config, JSON.parse(readFileSync(file, 'utf8'))) } catch { /* keep defaults */ }
  }
  if (process.env.ASPEN_METADATA_ROOT) config.metadataRoot = process.env.ASPEN_METADATA_ROOT
  if (config.metadataRoot) config.metadataRoot = resolve(cwd, config.metadataRoot)
  config.outDir = resolve(cwd, config.outDir)
  return config
}

// An instance directory is one that holds the tier trees the CLI downloads. Two of
// the three is enough -- an instance with no custom components is normal.
function looksLikeInstance (dir) {
  const hits = TIERS.filter((tier) => isDir(join(dir, tier)))
  return hits.length >= 2 ? hits : null
}

// Here, just below here, or we are inside it. Ancestors are checked but their other
// children are not -- a project that merely sits next door to an instance is not that
// instance, and scanning siblings up to the home directory is both slow and surprising.
function findMetadataRoot (cwd) {
  if (looksLikeInstance(cwd)) return cwd
  for (const child of subdirs(cwd)) {
    if (looksLikeInstance(child)) return child
  }
  let dir = cwd
  for (let up = 0; up < MAX_DEPTH; up += 1) {
    const parent = dirname(dir)
    if (parent === dir) break
    if (looksLikeInstance(parent)) return parent
    dir = parent
  }
  return null
}

// ------------------------------------------------------------------ filesystem

function isDir (path) {
  try { return statSync(path).isDirectory() } catch { return false }
}

function subdirs (dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
      .map((entry) => join(dir, entry.name))
  } catch { return [] }
}

function walkFiles (dir, acc = []) {
  let entries = []
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return acc }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(path, acc)
    else if (entry.isFile()) acc.push(path)
  }
  return acc
}

function newestMtime (paths) {
  let newest = 0
  for (const path of paths) {
    try { newest = Math.max(newest, statSync(path).mtimeMs) } catch { /* ignore */ }
  }
  return newest
}

// --------------------------------------------------------------------- parsing
//
// Best-effort only. The digest is an index into the real files, never a substitute
// for them -- every entry carries the source path so the shape can be read from the
// component itself. An unparsed file still gets indexed by name.

const NAME_KEYS = ['apiName', 'api_name', 'name', 'fullName', 'objectName', 'componentName']
const LABEL_KEYS = ['label', 'displayName', 'display_name', 'title', 'pluralLabel']
const TYPE_KEYS = ['componentType', 'component_type', 'type', 'dataType', 'data_type', 'kind']
const CHILD_KEYS = ['fields', 'attributes', 'columns', 'picklistValues', 'values', 'items', 'members']

function firstString (object, keys) {
  for (const key of keys) {
    const value = object?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function parseJson (text) {
  const root = JSON.parse(text)
  const record = Array.isArray(root) ? { children: root } : root
  const children = []
  for (const key of CHILD_KEYS) {
    const value = record[key] ?? record.children
    if (!Array.isArray(value)) continue
    for (const child of value) {
      if (child && typeof child === 'object') {
        children.push({
          name: firstString(child, NAME_KEYS) ?? '(unnamed)',
          label: firstString(child, LABEL_KEYS) ?? '',
          type: firstString(child, TYPE_KEYS) ?? ''
        })
      } else if (typeof child === 'string') {
        children.push({ name: child, label: '', type: '' })
      }
    }
    if (children.length) break
  }
  return {
    name: firstString(record, NAME_KEYS),
    label: firstString(record, LABEL_KEYS),
    type: firstString(record, TYPE_KEYS),
    children
  }
}

function parseTagged (text) {
  const tag = (names) => {
    for (const name of names) {
      const match = text.match(new RegExp(`<${name}>([^<]{1,200})</${name}>`, 'i')) ||
        text.match(new RegExp(`^\\s*${name}\\s*:\\s*["']?([^"'\\n]{1,200})`, 'im'))
      if (match) return match[1].trim()
    }
    return null
  }
  return { name: tag(NAME_KEYS), label: tag(LABEL_KEYS), type: tag(TYPE_KEYS), children: [] }
}

function parseComponent (path) {
  const empty = { name: null, label: null, type: null, children: [], parsed: false }
  let text
  try { text = readFileSync(path, 'utf8') } catch { return empty }
  if (text.length > 4_000_000) return empty
  try {
    const extension = extname(path).toLowerCase()
    const parsed = extension === '.json' ? parseJson(text) : parseTagged(text)
    return { ...parsed, parsed: Boolean(parsed.name || parsed.label || parsed.children.length) }
  } catch { return empty }
}

// -------------------------------------------------------------------- the build

// A download groups component types into directories (objects/, layouts/, ...), so
// the directory is the grouping key. The component's own declared type is kept as a
// column, but it varies per component -- a field's type is its data type -- so it is
// only the fallback when a component sits loose at the tier root.
function groupingType (withinTier, declaredType) {
  const segments = withinTier.split(sep)
  const key = segments.length > 1 ? segments[0] : (declaredType || 'other')
  return key.toLowerCase().replace(/[^\w.-]+/g, '_')
}

function collect (metadataRoot, maxComponents) {
  const tiers = []
  let truncated = false
  let newest = 0
  for (const tier of TIERS) {
    const tierRoot = join(metadataRoot, tier)
    if (!isDir(tierRoot)) continue
    const components = []
    const slugs = new Set()
    for (const path of walkFiles(tierRoot).sort()) {
      if (components.length >= maxComponents) { truncated = true; break }
      const parsed = parseComponent(path)
      const withinTier = relative(tierRoot, path)
      let stat = { mtimeMs: 0, size: 0 }
      try { stat = statSync(path) } catch { /* keep zeroes */ }
      newest = Math.max(newest, stat.mtimeMs)
      components.push({
        name: parsed.name ?? basename(path, extname(path)),
        label: parsed.label ?? '',
        type: parsed.type ?? '',
        group: groupingType(withinTier, parsed.type),
        children: parsed.children,
        parsed: parsed.parsed,
        source: relative(metadataRoot, path),
        slug: uniqueSlug(withinTier, slugs),
        stamp: `${withinTier}:${stat.size}:${Math.round(stat.mtimeMs)}`
      })
    }
    tiers.push({ tier, root: tierRoot, components })
  }
  return { tiers, truncated, sourceMtime: newest }
}

// One entry per (tier, component type): the unit of work a mapper subagent takes.
// The signature changes only when that type's files change, so a re-map can skip the
// types nothing touched.
function groupTypes (tiers) {
  const groups = []
  for (const { tier, components } of tiers) {
    const byType = new Map()
    for (const component of components) {
      if (!byType.has(component.group)) byType.set(component.group, [])
      byType.get(component.group).push(component)
    }
    for (const [type, members] of [...byType].sort((a, b) => b[1].length - a[1].length)) {
      groups.push({
        tier,
        type,
        count: members.length,
        signature: createHash('sha1').update(members.map((member) => member.stamp).join('\n')).digest('hex').slice(0, 12),
        inventory: `.aspen/model/types/${tier}__${type}.md`,
        members
      })
    }
  }
  return groups
}

// Detail filenames are the tier-relative path, flattened. Two components can flatten
// to the same slug (same name, different extension), so keep them apart.
function uniqueSlug (relativePath, taken) {
  const base = relativePath
    .slice(0, relativePath.length - extname(relativePath).length)
    .split(sep).join('__')
    .replace(/[^\w.-]+/g, '_') || 'component'
  let slug = base
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`
  taken.add(slug)
  return slug
}

const escapeCell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()

function renderDetail (component, tier) {
  const lines = [
    `# ${component.name}`,
    '',
    `- Tier: \`${tier}\``,
    `- Source: \`${component.source}\` — read this file for the authoritative shape`,
    component.label ? `- Label: ${component.label}` : null,
    component.type ? `- Type: \`${component.type}\`` : null,
    ''
  ].filter((line) => line !== null)
  if (component.children.length) {
    lines.push(`## Attributes (${component.children.length})`, '', '| Name | Type | Label |', '| --- | --- | --- |')
    for (const child of component.children) {
      lines.push(`| \`${escapeCell(child.name)}\` | ${escapeCell(child.type)} | ${escapeCell(child.label)} |`)
    }
    lines.push('')
  } else if (!component.parsed) {
    lines.push('This file\'s format was not recognised, so only its name is indexed. Open the source file.', '')
  }
  return lines.join('\n')
}

function renderTier (tier, components, truncated) {
  const lines = [
    `# ${tier} tier — ${components.length} component${components.length === 1 ? '' : 's'}`,
    '',
    'Large file: grep it, do not read it whole. `grep -i "<name>" .aspen/model/' + tier + '.md`',
    '',
    '| Component | Type | Label | Attrs | Detail |',
    '| --- | --- | --- | --- | --- |'
  ]
  for (const component of components) {
    lines.push(`| \`${escapeCell(component.name)}\` | ${escapeCell(component.group)} | ${escapeCell(component.label)} | ${component.children.length || ''} | \`${tier}/${component.slug}.md\` |`)
  }
  if (truncated) lines.push('', '**Truncated** — raise `maxComponents` in `.aspen/model.config.json`.')
  lines.push('')
  return lines.join('\n')
}

function renderTypeInventory (group) {
  const lines = [
    `# ${group.tier} / ${group.type} — ${group.count} component${group.count === 1 ? '' : 's'}`,
    '',
    `Signature \`${group.signature}\`. One mapper's slice of the model.`,
    '',
    '| Component | Declared type | Label | Attrs | Detail | Source |',
    '| --- | --- | --- | --- | --- | --- |'
  ]
  for (const member of group.members) {
    lines.push(`| \`${escapeCell(member.name)}\` | ${escapeCell(member.type)} | ${escapeCell(member.label)} | ${member.children.length || ''} | \`${group.tier}/${member.slug}.md\` | \`${escapeCell(member.source)}\` |`)
  }
  lines.push('')
  return lines.join('\n')
}

function renderIndex ({ metadataRoot, tiers, groups, generatedAt, sourceMtime, truncated }) {
  const total = tiers.reduce((sum, entry) => sum + entry.components.length, 0)
  const lines = [
    '# Aspen model digest',
    '',
    '<!-- Generated by the aspen plugin. Do not edit; edits are overwritten. -->',
    '',
    `- Source: \`${metadataRoot}\``,
    `- Generated: ${generatedAt}`,
    `- Metadata last changed: ${new Date(sourceMtime).toISOString()}`,
    `- Components: ${total}`,
    '',
    'This is an **index into the downloaded metadata, not a copy of it**. Names and',
    'attributes are extracted best-effort; before you author against a component, open',
    'the source file the detail page names.',
    '',
    '## Tiers',
    '',
    '| Tier | Components | Inventory |',
    '| --- | --- | --- |'
  ]
  for (const { tier, components } of tiers) {
    lines.push(`| ${tier} | ${components.length} | \`.aspen/model/${tier}.md\` |`)
  }
  lines.push('', '## Component types', '', '| Tier | Type | Components | Inventory | Map |', '| --- | --- | --- | --- | --- |')
  for (const group of groups) {
    const path = `\`.aspen/model/maps/${group.tier}__${group.type}.md\``
    const map = !group.mapExists ? '—' : group.mapped ? path : `${path} **(stale)**`
    lines.push(`| ${group.tier} | ${group.type} | ${group.count} | \`${group.inventory}\` | ${map} |`)
  }
  lines.push('', 'A type with no map has never been read by a mapper; a stale map was built from files that', 'have since changed. Invoke `map-model` to fill in both — it only redoes what moved.')
  lines.push(
    '',
    '## Finding a component',
    '',
    '```',
    'grep -i "account" .aspen/model/platform.md      # locate it, get its detail path',
    'cat .aspen/model/platform/<detail>.md           # its attributes and source path',
    '```',
    ''
  )
  if (truncated) lines.push('**Truncated** — raise `maxComponents` in `.aspen/model.config.json`.', '')
  return lines.join('\n')
}

function build (config) {
  const metadataRoot = config.metadataRoot ?? findMetadataRoot(process.cwd())
  if (!metadataRoot || !looksLikeInstance(metadataRoot)) return { status: 'no-metadata' }

  const { tiers, truncated, sourceMtime } = collect(metadataRoot, config.maxComponents)
  const groups = groupTypes(tiers)
  const generatedAt = new Date().toISOString()

  // Mapper output is expensive to produce and is not derived from the tree, so it
  // survives a rebuild. Everything else is regenerated from scratch.
  //
  // Build into a staging directory and swap at the end. Writing in place would leave
  // a window where the maps are deleted and not yet restored -- crash there and the
  // one thing that cannot be regenerated is the thing that is gone.
  const maps = readMaps(config.outDir)
  const staging = `${config.outDir}.building`
  rmSync(staging, { recursive: true, force: true })
  mkdirSync(staging, { recursive: true })
  writeMaps(staging, maps)
  writeFileSync(join(staging, '.gitignore'), '*\n') // generated; keep it out of the user's repo

  for (const { tier, components } of tiers) {
    writeFileSync(join(staging, `${tier}.md`), renderTier(tier, components, truncated))
    if (!components.length) continue
    mkdirSync(join(staging, tier), { recursive: true })
    for (const component of components) {
      writeFileSync(join(staging, tier, `${component.slug}.md`), renderDetail(component, tier))
    }
  }

  for (const group of groups) {
    const map = maps[`${group.tier}__${group.type}.md`]
    group.mapExists = Boolean(map)
    group.mapped = map?.signature === group.signature
  }

  mkdirSync(join(staging, 'types'), { recursive: true })
  for (const group of groups) {
    writeFileSync(join(staging, 'types', `${group.tier}__${group.type}.md`), renderTypeInventory(group))
  }

  writeFileSync(join(staging, 'index.md'), renderIndex({ metadataRoot, tiers, groups, generatedAt, sourceMtime, truncated }))
  writeFileSync(join(staging, 'manifest.json'), JSON.stringify({
    generatedAt,
    metadataRoot,
    types: groups.map(({ tier, type, count, signature, inventory, mapped, mapExists }) => ({
      tier,
      type,
      count,
      signature,
      inventory,
      map: `.aspen/model/maps/${tier}__${type}.md`,
      mapped: Boolean(mapped),
      mapStale: Boolean(mapExists && !mapped)
    }))
  }, null, 2))
  const state = { metadataRoot, sourceMtime, generatedAt, stale: false, counts: Object.fromEntries(tiers.map((entry) => [entry.tier, entry.components.length])) }
  writeFileSync(join(staging, STATE_FILE), JSON.stringify(state, null, 2))

  // The only destructive moment, with no I/O between the two calls that could fail
  // in the gap. Anything that goes wrong before here leaves the old digest untouched.
  rmSync(config.outDir, { recursive: true, force: true })
  renameSync(staging, config.outDir)
  return { status: 'built', state }
}

// Maps are written by mapper subagents, not by this script. Carry them through a
// rebuild, and read back the signature each one recorded so a re-map can tell which
// are still current.
function readMaps (outDir) {
  const dir = join(outDir, 'maps')
  const maps = {}
  if (!isDir(dir)) return maps
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md')) continue
    try {
      const body = readFileSync(join(dir, name), 'utf8')
      maps[name] = { body, signature: body.match(/<!--\s*signature:\s*([0-9a-f]+)\s*-->/)?.[1] ?? null }
    } catch { /* skip unreadable */ }
  }
  return maps
}

function writeMaps (outDir, maps) {
  const names = Object.keys(maps)
  if (!names.length) return
  const dir = join(outDir, 'maps')
  mkdirSync(dir, { recursive: true })
  for (const name of names) writeFileSync(join(dir, name), maps[name].body)
}

// --------------------------------------------------------------------- state io

function readState (config) {
  try { return JSON.parse(readFileSync(join(config.outDir, STATE_FILE), 'utf8')) } catch { return null }
}

function markStale (config, reason) {
  const state = readState(config)
  if (!state) return
  writeFileSync(join(config.outDir, STATE_FILE), JSON.stringify({ ...state, stale: true, staleReason: reason }, null, 2))
  const indexPath = join(config.outDir, 'index.md')
  try {
    const index = readFileSync(indexPath, 'utf8')
    if (!index.includes('> **Stale**')) {
      writeFileSync(indexPath, index.replace('# Aspen model digest\n', `# Aspen model digest\n\n> **Stale** — ${reason} Re-pull with \`aspen move download-active-set\`.\n`))
    }
  } catch { /* index missing; state flag is enough */ }
}

function currentSourceMtime (metadataRoot) {
  return newestMtime(TIERS.flatMap((tier) => walkFiles(join(metadataRoot, tier))))
}

// ----------------------------------------------------------------------- output

function emit (context) {
  if (context) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: process.env.ASPEN_HOOK_EVENT ?? 'SessionStart', additionalContext: context }
    }))
  }
  process.exit(0)
}

function describe (state, extra = '') {
  const counts = Object.entries(state.counts ?? {}).map(([tier, count]) => `${tier} ${count}`).join(', ')
  return `Aspen model digest ready at \`.aspen/model/index.md\` (${counts}). Read it before authoring; ${extra || 'it indexes the downloaded metadata, so open a component\'s source file for its authoritative shape.'}`
}

async function readStdin () {
  if (process.stdin.isTTY) return {}
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { return {} }
}

// ------------------------------------------------------------------------- main

// A crash must not be louder than the value this adds. In a hook, report one line to
// stderr and exit 0: the swap above means the previous digest is still in place, and
// its own freshness stamp stays honest, so the agent is not handed a broken model.
// Run by hand, a failure exits non-zero -- that is a person who wants to know.
function guard (mode, run) {
  try { return run() } catch (error) {
    process.stderr.write(`aspen model digest: ${error?.message ?? error}\n`)
    process.exit(mode === 'build' ? 1 : 0)
  }
}

const mode = process.argv[2] ?? 'build'
const config = loadConfig(process.cwd())

if (mode === 'build') {
  guard(mode, () => {
    const result = build(config)
    console.log(result.status === 'built' ? describe(result.state) : 'No Aspen metadata found. Run `aspen move download-active-set` first.')
  })
  process.exit(0)
}

if (mode === 'session-start') {
  process.env.ASPEN_HOOK_EVENT = 'SessionStart'
  guard(mode, () => sessionStart())
  process.exit(0)
}

function sessionStart () {
  const state = readState(config)
  const metadataRoot = config.metadataRoot ?? state?.metadataRoot ?? findMetadataRoot(process.cwd())
  if (!metadataRoot || !looksLikeInstance(metadataRoot)) {
    // A configured root that is not there is a mistake worth reporting. Everything
    // else is just a project that has nothing to do with Aspen: say nothing at all.
    if (config.metadataRoot) emit(`\`.aspen/model.config.json\` points \`metadataRoot\` at \`${config.metadataRoot}\`, which holds no ${TIERS.join('/')} metadata. Fix the path, or run \`aspen move download-active-set\`.`)
    emit(state ? 'The Aspen model digest is there but the metadata it indexed is gone. Re-pull with `aspen move download-active-set`.' : '')
  }
  if (state && !state.stale && currentSourceMtime(metadataRoot) <= state.sourceMtime) emit(describe(state))
  const result = build({ ...config, metadataRoot })
  emit(result.status === 'built' ? describe(result.state, 'it was just rebuilt from the metadata on disk.') : '')
}

if (mode === 'post-tool') {
  process.env.ASPEN_HOOK_EVENT = 'PostToolUse'
  const payload = await readStdin()
  guard(mode, () => postTool(payload))
  process.exit(0)
}

function postTool (payload) {
  const command = String(payload?.tool_input?.command ?? '')
  if (!/\baspen\b/.test(command)) process.exit(0)

  // A fresh download changed the local tree -- rebuild from it.
  if (/download[-\s]?active[-\s]?set|\bpull\b|\binit\b/.test(command)) {
    const result = build(config)
    emit(result.status === 'built' ? describe(result.state, 'it was just rebuilt from the download you ran.') : '')
  }
  // A checkin or deploy changed the instance, so the local copy no longer matches it.
  if (/\b(checkin|check-in|deploy|promote|submit)\b/.test(command)) {
    markStale(config, 'the instance changed after this digest was built.')
    emit('The Aspen model digest is now stale — you changed the instance. Re-pull with `aspen move download-active-set` before you read the model again.')
  }
}

console.error(`Unknown mode: ${mode}. Use session-start, post-tool, or build.`)
process.exit(1)
