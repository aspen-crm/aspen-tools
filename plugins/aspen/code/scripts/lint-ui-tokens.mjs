#!/usr/bin/env node
// The same two checks guard-ui-tokens.mjs runs on a write, over a whole tree.
//
// The hook only binds a Claude Code session with this plugin loaded. Custom UI also gets
// written by hand, in another editor, by a teammate who has never installed it -- and the
// failures it catches are silent, so nothing downstream notices. This is the copy that
// runs in CI and covers everyone.
//
//   node scripts/lint-ui-tokens.mjs <dir> [--json]
//
// Exits 1 when anything is flagged, 0 when the tree is clean.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

import {
  loadTokenNames,
  findHardcodedValues,
  findUnknownTokens
} from '../hooks/guard-ui-tokens.mjs'

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.scss'])
const SKIP = new Set(['node_modules', 'dist', 'build', '.git', 'generated'])

function * walk (dir) {
  let entries
  try { entries = readdirSync(dir) } catch { return }
  for (const entry of entries) {
    if (SKIP.has(entry)) continue
    const path = join(dir, entry)
    let stats
    try { stats = statSync(path) } catch { continue }
    if (stats.isDirectory()) yield * walk(path)
    else if (EXTENSIONS.has(extname(entry))) yield path
  }
}

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const root = args.find((arg) => !arg.startsWith('--')) ?? '.'

const known = loadTokenNames()
const results = []

for (const path of walk(root)) {
  const source = readFileSync(path, 'utf8')
  const unknown = findUnknownTokens(source, known)
  const hardcoded = findHardcodedValues(source)
  if (!unknown.length && !hardcoded.length) continue
  results.push({ file: relative(root, path), unknown, hardcoded })
}

if (asJson) {
  console.log(JSON.stringify({ tokensKnown: known.size, results }, null, 2))
} else if (!results.length) {
  console.log('ui-tokens: clean.')
} else {
  for (const { file, unknown, hardcoded } of results) {
    console.log(`\n${file}`)
    for (const { line, name, nearest } of unknown) {
      console.log(`  ${line}: unknown token \`${name}\`` + (nearest ? ` — did you mean \`${nearest}\`?` : '') +
        ' (resolves to nothing; no error anywhere)')
    }
    for (const { line, property, value, family } of hardcoded) {
      console.log(`  ${line}: \`${property}: ${value}\` → use \`${family}\``)
    }
  }
  const counted = results.reduce((sum, r) => sum + r.unknown.length + r.hardcoded.length, 0)
  console.log(
    `\n${counted} finding(s) in ${results.length} file(s). Token names are in the ` +
    'aspen-code skill\'s ui-design-tokens.md / ui-component-tokens.md. A `var(--token, ' +
    'fallback)` fallback is fine. For a value the system has no token for, add ' +
    '`aspen-token-exempt: <reason>` in a comment on that line or the line above.'
  )
}

process.exit(results.length ? 1 : 0)
