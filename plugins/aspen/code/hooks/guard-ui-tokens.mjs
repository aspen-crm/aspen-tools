#!/usr/bin/env node
// PreToolUse (Write, Edit) guard for custom UI styling under `metacode/ui/`.
//
// Two failures this catches are both SILENT, which is why prose could never hold the line
// on them. A misspelled `var(--ap-sem-color-text-primry)` is not an error anywhere: the
// declaration is dropped, the element renders with whatever it inherited, and the build
// passes -- the token list exists only inside a running instance, so neither `npm run
// build` nor the browser can tell a real name from a typo. A hardcoded `#11171d` is worse
// than silent: it looks correct, because the author is on the light theme. It renders
// black-on-black the first time someone opens the page in dark mode, and nothing tightens
// on a phone.
//
// Verified against the platform (app/ui/engine/distribution + the custom-UI e2e suite):
// custom UI renders in a shadow root on the platform document, so `--ap-*` inherits from
// `:root` and every token resolves -- semantic, component, dark-mode and the responsive
// steps. The tokens are genuinely there to use, which is what makes ignoring them a bug
// rather than a preference.
//
// It denies rather than asks, like guard-metadata-writes: a typo is never intended, and a
// hardcode has a documented escape hatch, so there is nothing for a human to weigh in on
// in the moment. The escape hatch is the point of the design -- see EXEMPT below. Real
// pages do need a value the system has no token for, and a rule with no way to say so
// gets switched off. This one makes deviation cost one comment and leave a reason behind.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

// The shipped inventory is the source of truth for what names exist. Parsing the two
// skill files rather than a generated copy means there is no second artifact to go stale:
// when the platform team re-syncs the docs, the guard follows in the same commit.
const TOKEN_DOCS = [
  join(HERE, '..', 'skills', 'using-aspen', 'ui-design-tokens.md'),
  join(HERE, '..', 'skills', 'using-aspen', 'ui-component-tokens.md')
]

// Names ending in `-` are prose -- the files write `--ap-sem-color-*` when naming a family.
export function loadTokenNames (paths = TOKEN_DOCS) {
  const names = new Set()
  for (const path of paths) {
    let text
    try { text = readFileSync(path, 'utf8') } catch { continue }
    for (const match of text.matchAll(/--ap-[a-z0-9-]+/g)) {
      if (!match[0].endsWith('-')) names.add(match[0])
    }
  }
  return names
}

// ---- what this guard looks at ------------------------------------------------------

const UI_SOURCE = /(^|[/\\])metacode[/\\]ui[/\\].*\.(ts|tsx|js|jsx|mjs|css|scss)$/

// One comment anywhere on the offending line, or on the line above it, stands the rule
// down for that line. `aspen-token-exempt: the grid's header matches the product, which
// paints 400 where the label token says 500` is the shape -- a reason, in the file, next
// to the value it explains.
const EXEMPT = /aspen-token-exempt/

// ---- stripping what must not be scanned --------------------------------------------

// Replace a span with spaces so every column index downstream still lines up with the
// original text -- the line numbers in the message have to point at the real line.
const blank = (text, start, end) =>
  text.slice(0, start) + text.slice(start, end).replace(/[^\n]/g, ' ') + text.slice(end)

// Block comments only. A `//` is left alone on purpose: inside the CSS template literals
// these files are built from, `//` is not a comment at all, and stripping it would eat
// the rest of a real declaration.
export function stripBlockComments (source) {
  let out = source
  for (const match of source.matchAll(/\/\*[\s\S]*?\*\//g)) {
    out = blank(out, match.index, match.index + match[0].length)
  }
  return out
}

// A `var()` fallback is not a deviation -- it is the recommended way to write one, since
// a typo'd token otherwise resolves to nothing at all. Fallbacks nest and carry commas
// and parens of their own (`var(--ap-sem-elevation-low, 0 1px 2px rgba(17,23,29,.06))`),
// so this counts parens instead of trying to match them with a regex.
export function stripVarCalls (source) {
  let out = source
  for (let i = 0; i < out.length; i++) {
    if (!out.startsWith('var(', i)) continue
    let depth = 0
    let end = i
    for (let j = i + 3; j < out.length; j++) {
      if (out[j] === '(') depth++
      else if (out[j] === ')') {
        depth--
        if (depth === 0) { end = j + 1; break }
      }
    }
    if (end > i) {
      out = blank(out, i, end)
      i = end - 1
    }
  }
  return out
}

// ---- the rules ---------------------------------------------------------------------

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/
const PX_LITERAL = /(?<![\w-])\d+(\.\d+)?px\b/

// Keyed by the CSS property, because the literal alone says nothing. `240px` is a
// deviation as `padding` and is perfectly correct as `min-width`: the system publishes a
// spacing scale and does not publish page dimensions. Scoping by property is what keeps
// this from crying wolf on the grid's `--ps-row-h: 38px` and getting itself disabled.
const RULES = [
  {
    properties: /^(color|background-color|background|border(-(top|right|bottom|left))?-color|outline-color|text-decoration-color|caret-color|fill|stroke|border(-(top|right|bottom|left))?|outline)$/,
    literal: COLOR_LITERAL,
    family: '--ap-sem-color-*',
    note: 'light and dark both come free from a color token; a hex is only ever correct in one of them'
  },
  {
    properties: /^box-shadow$/,
    literal: COLOR_LITERAL,
    family: '--ap-sem-elevation-*',
    note: 'shadows are deliberately heavier in dark mode'
  },
  {
    properties: /^(padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(row-|column-)?gap$/,
    literal: PX_LITERAL,
    family: '--ap-sem-spacing-inner-* (inside a component) or --ap-sem-spacing-layout-* (between blocks)',
    note: 'spacing tokens tighten on their own at tablet and phone widths'
  },
  {
    properties: /^border(-(top|bottom)-(left|right))?-radius$/,
    literal: PX_LITERAL,
    family: '--ap-sem-radius-*',
    note: null
  },
  {
    properties: /^border(-(top|right|bottom|left))?-width$/,
    literal: PX_LITERAL,
    family: '--ap-sem-border-width-*',
    note: null
  },
  {
    properties: /^font-size$/,
    literal: PX_LITERAL,
    family: '--ap-sem-font-size-*',
    note: 'display and heading sizes shrink on phones on their own'
  },
  {
    properties: /^line-height$/,
    literal: PX_LITERAL,
    family: '--ap-sem-line-height-*',
    note: 'pair it with the font-size token of the same role'
  },
  {
    properties: /^font-weight$/,
    literal: /^\s*(\d{3}|bold|bolder)\s*$/,
    family: '--ap-sem-font-weight-*',
    note: null
  },
  {
    // A monospace stack is deliberately not matched. The system publishes one family
    // token and it is Geist -- there is no mono token to point at, so flagging an id or
    // a code block's `ui-monospace` would be telling the author to make it unreadable.
    properties: /^(font-family|font)$/,
    literal: /system-ui|-apple-system|sans-serif|(?<!ui-)\bserif|Helvetica|Arial|Geist/i,
    skip: /\bmonospace\b/i,
    family: '--ap-sem-font-family-body',
    note: 'one family token covers every role'
  }
]

// A declaration, not an assignment: `padding: 16px` in a style string or a style object.
// The property side allows a leading quote so `{ 'font-size': '14px' }` is seen too.
const DECLARATION = /(^|[;{'"`\s])([a-zA-Z-]+)\s*:\s*([^;{}\n]*)/g

export function findHardcodedValues (source) {
  const scannable = stripVarCalls(stripBlockComments(source))
  const lines = scannable.split('\n')
  const originalLines = source.split('\n')
  const findings = []

  lines.forEach((line, index) => {
    const exempt = EXEMPT.test(originalLines[index] ?? '') ||
      EXEMPT.test(originalLines[index - 1] ?? '')
    if (exempt) return

    for (const match of line.matchAll(DECLARATION)) {
      const property = match[2].toLowerCase()
      const value = match[3]
      // A custom property is the author's own variable (`--ps-row-h`), not a styled
      // declaration -- its whole purpose is to name a local value once.
      if (property.startsWith('--')) continue

      // `blank()` preserves every column, so the same span of the original line is this
      // declaration with its `var()` calls still in it. A declaration that reads any
      // variable is composing, not hardcoding: `calc(var(--ap-comp-table-search-padding)
      // + 20px)` leaves room for an icon, and `calc(var(--ps-row-h) - 1px)` derives a
      // line-height from the grid's own row height -- a token could not express either.
      // Author-local variables count for the same reason platform ones do: the value is
      // named once and the literal is the offset from it. Flagging these is how a guard
      // teaches people to route around it.
      const original = (originalLines[index] ?? '').slice(match.index, match.index + match[0].length)
      if (original.includes('var(')) continue

      for (const rule of RULES) {
        if (!rule.properties.test(property)) continue
        if (rule.skip?.test(value)) continue
        if (!rule.literal.test(value)) continue
        findings.push({
          line: index + 1,
          property,
          value: value.trim(),
          family: rule.family,
          note: rule.note
        })
        break
      }
    }
  })

  return findings
}

export function findUnknownTokens (source, known) {
  const findings = []
  source.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(/var\(\s*(--ap-[a-z0-9-]*)/g)) {
      const name = match[1]
      if (known.has(name)) continue
      findings.push({ line: index + 1, name, nearest: nearestName(name, known) })
    }
  })
  return findings
}

// A typo is nearly always one edit away from a real name, and handing the name back is
// the difference between a one-turn fix and a grep through a 2000-line inventory.
export function nearestName (name, known) {
  let best = null
  let bestScore = Infinity
  for (const candidate of known) {
    if (Math.abs(candidate.length - name.length) > 3) continue
    const score = distance(name, candidate, bestScore)
    if (score < bestScore) { bestScore = score; best = candidate }
  }
  return bestScore <= 3 ? best : null
}

function distance (a, b, ceiling) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      rowMin = Math.min(rowMin, current[j])
    }
    if (rowMin > ceiling) return Infinity
    previous = current
  }
  return previous[b.length]
}

// ---- the decision -------------------------------------------------------------------

export function decide (filePath, content, known = loadTokenNames()) {
  const path = String(filePath ?? '')
  if (!UI_SOURCE.test(path)) return null
  const source = String(content ?? '')
  if (!source) return null

  const unknown = findUnknownTokens(source, known)
  const hardcoded = findHardcodedValues(source)
  if (!unknown.length && !hardcoded.length) return null

  const parts = []

  if (unknown.length) {
    parts.push(
      'These `--ap-*` names are not in the inventory, and a name that does not exist is ' +
      'not an error anywhere — the declaration is silently dropped and the element keeps ' +
      'whatever it inherited:\n' +
      unknown.map(({ line, name, nearest }) =>
        `  line ${line}: \`${name}\`` + (nearest ? ` — did you mean \`${nearest}\`?` : '')
      ).join('\n')
    )
  }

  if (hardcoded.length) {
    parts.push(
      'These are hardcoded where the design system publishes a token. Custom UI renders in ' +
      'a shadow root on the platform document, so every `--ap-*` token resolves — including ' +
      'its dark value and its responsive steps, which a literal cannot follow:\n' +
      hardcoded.map(({ line, property, value, family, note }) =>
        `  line ${line}: \`${property}: ${value}\` → use \`${family}\`` + (note ? ` (${note})` : '')
      ).join('\n')
    )
  }

  parts.push(
    'Names are in `ui-design-tokens.md` beside the skill (grep `ui-component-tokens.md` ' +
    'for one component\'s `--ap-comp-*`). Copy them exactly. Writing the light value as a ' +
    'fallback — `var(--ap-sem-color-text-primary, #11171d)` — is encouraged and not ' +
    'flagged. If a value genuinely has no token, keep it and put `aspen-token-exempt: ' +
    '<reason>` in a comment on that line or the line above.'
  )

  return parts.join('\n\n')
}

export const deny = (reason) => JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: reason
  }
})

// Write carries the whole file; Edit carries only the replacement, which is the right
// thing to scan -- it is what this turn is adding.
export function contentOf (toolInput) {
  if (!toolInput) return ''
  if (typeof toolInput.content === 'string') return toolInput.content
  if (typeof toolInput.new_string === 'string') return toolInput.new_string
  if (Array.isArray(toolInput.edits)) {
    return toolInput.edits.map((edit) => edit?.new_string ?? '').join('\n')
  }
  return ''
}

async function readStdin () {
  if (process.stdin.isTTY) return {}
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { return {} }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  try {
    const payload = await readStdin()
    const reason = decide(payload?.tool_input?.file_path, contentOf(payload?.tool_input))
    if (reason) process.stdout.write(deny(reason))
  } catch { /* a guard that crashes must not take the session with it */ }
  process.exit(0)
}
