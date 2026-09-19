import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  decide,
  loadTokenNames,
  findHardcodedValues,
  findUnknownTokens,
  stripVarCalls,
  contentOf
} from '../hooks/guard-ui-tokens.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, '..', 'hooks', 'guard-ui-tokens.mjs')

const KNOWN = loadTokenNames()
const UI = '/Users/x/Aspen/veeva.com_niraj/metacode/ui/ui_main_c/src/pages/plan.ts'

const css = (body) => `export const STYLE = \`\n${body}\n\``
const flagged = (body) => findHardcodedValues(css(body))

// ---- the inventory the guard checks against ----------------------------------------

test('the shipped token docs parse into a real inventory', () => {
  // The two md files are the only copy of these names that reaches a customer; if the
  // parse ever returns a handful, every unknown-name check silently passes.
  assert.ok(KNOWN.size > 1700, `expected the full inventory, got ${KNOWN.size}`)
  assert.ok(KNOWN.has('--ap-sem-color-text-primary'))
  assert.ok(KNOWN.has('--ap-comp-button-radius'))
})

test('a family written as prose is not mistaken for a token name', () => {
  // The docs say "prefer `--ap-sem-*`" and name families like `--ap-sem-color-`; a parse
  // that accepted those would wave through a truncated name.
  for (const prose of ['--ap-sem-', '--ap-sem-color-', '--ap-comp-', '--ap-sem-spacing-']) {
    assert.ok(!KNOWN.has(prose), `${prose} is prose, not a token`)
  }
})

// ---- unknown token names -----------------------------------------------------------

test('a misspelled token is caught and the nearest real name handed back', () => {
  const found = findUnknownTokens('color: var(--ap-sem-color-text-primry);', KNOWN)
  assert.equal(found.length, 1)
  assert.equal(found[0].name, '--ap-sem-color-text-primry')
  assert.equal(found[0].nearest, '--ap-sem-color-text-primary')
})

test('a real token passes, with or without a fallback', () => {
  const source = 'a { color: var(--ap-sem-color-text-primary); }\n' +
    'b { gap: var(--ap-sem-spacing-inner-xs, 8px); }'
  assert.deepEqual(findUnknownTokens(source, KNOWN), [])
})

test('a name too far from anything real reports no suggestion rather than a wrong one', () => {
  const [found] = findUnknownTokens('color: var(--ap-totally-made-up-thing);', KNOWN)
  assert.equal(found.nearest, null)
})

// ---- hardcoded values, by property -------------------------------------------------

test('colors, spacing, radius, type and shadow are each caught on their own property', () => {
  const cases = [
    ['color: #11171d;', '--ap-sem-color-*'],
    ['background: rgb(255,255,255);', '--ap-sem-color-*'],
    ['border: 1px solid #d7dee2;', '--ap-sem-color-*'],
    ['padding: 16px;', '--ap-sem-spacing-inner-*'],
    ['margin-top: 24px;', '--ap-sem-spacing-inner-*'],
    ['gap: 8px;', '--ap-sem-spacing-inner-*'],
    ['border-radius: 8px;', '--ap-sem-radius-*'],
    ['font-size: 14px;', '--ap-sem-font-size-*'],
    ['line-height: 22px;', '--ap-sem-line-height-*'],
    ['font-weight: 600;', '--ap-sem-font-weight-*'],
    ['font-family: system-ui, sans-serif;', '--ap-sem-font-family-body'],
    ['box-shadow: 0 1px 2px rgba(17,23,29,.06);', '--ap-sem-elevation-*']
  ]
  for (const [declaration, family] of cases) {
    const [finding] = flagged(`.x { ${declaration} }`)
    assert.ok(finding, `${declaration} should be flagged`)
    assert.ok(finding.family.startsWith(family), `${declaration} → ${finding.family}`)
  }
})

// ---- what must NOT be flagged ------------------------------------------------------
//
// Every case below came out of real pages on veeva.com_niraj. A guard that fires on
// these is one a builder turns off, and then it protects nothing.

test('a var() fallback is not a hardcode', () => {
  // The skill actively recommends writing the light value as a fallback, because a
  // misspelled token otherwise resolves to nothing at all.
  assert.deepEqual(flagged('.x { color: var(--ap-sem-color-text-primary, #11171d); }'), [])
  assert.deepEqual(flagged('.x { padding: var(--ap-sem-spacing-inner-md, 16px); }'), [])
})

test('a multi-value fallback with nested parens is stripped whole', () => {
  const shadow = '.x { box-shadow: var(--ap-sem-elevation-low, 0 1px 2px rgba(17, 23, 29, 0.06)); }'
  assert.deepEqual(flagged(shadow), [])
  assert.ok(!stripVarCalls(shadow).includes('rgba'))
})

test('a dimension the system publishes no token for is left alone', () => {
  // There is a spacing scale and a type scale; there is no page-dimension scale. `240px`
  // is a deviation as padding and is simply the right answer as a min-width.
  assert.deepEqual(flagged('.x { width: 240px; min-height: 38px; background-size: 16px 16px; }'), [])
  assert.deepEqual(flagged('.x { top: -3px; flex-basis: 120px; max-width: 620px; }'), [])
})

test("an author's own custom property is a definition, not a styled declaration", () => {
  assert.deepEqual(flagged('.x { --ps-row-h: 38px; --ps-frame-max: 620px; }'), [])
})

test('a declaration composing off a variable keeps its offset', () => {
  // `calc(var(--ps-row-h) - 1px)` derives a line-height from the grid's row height and
  // `calc(var(--ap-comp-table-search-padding) + 20px)` leaves room for an icon. No token
  // expresses either, and the value is already named once.
  assert.deepEqual(flagged('.x { line-height: calc(var(--ps-row-h, 38px) - 1px); }'), [])
  assert.deepEqual(
    flagged('.x { padding: 0 var(--ap-comp-table-search-padding, 12px) 0 calc(var(--ap-comp-table-search-padding, 12px) + 20px); }'),
    []
  )
})

test('a monospace stack is left alone, because no mono token exists to point at', () => {
  assert.deepEqual(flagged('.x { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }'), [])
})

test('a value inside a block comment is prose, not code', () => {
  const source = css('/* measured on this instance: 400 14px/22px */\n.x { color: var(--ap-sem-color-text-primary); }')
  assert.deepEqual(findHardcodedValues(source), [])
})

test('zero needs no unit and no token', () => {
  assert.deepEqual(flagged('.x { padding: 0; margin: 0 auto; }'), [])
})

// ---- the escape hatch ---------------------------------------------------------------

test('an exemption comment stands the rule down for that line and the one under it', () => {
  assert.deepEqual(flagged('.x { padding: 3px; /* aspen-token-exempt: optical fix under the icon */ }'), [])
  assert.deepEqual(
    flagged('/* aspen-token-exempt: a 2px swatch; radius-xs would round it to a pill */\n.x { border-radius: 1px; }'),
    []
  )
})

test('an exemption on an unrelated line does not cover the next one', () => {
  const source = css(
    '.a { padding: 4px; /* aspen-token-exempt: reason */ }\n' +
    '.b { }\n' +
    '.c { padding: 5px; }'
  )
  const found = findHardcodedValues(source)
  assert.equal(found.length, 1)
  assert.equal(found[0].value, '5px')
})

// ---- scope ---------------------------------------------------------------------------

test('only custom UI source under metacode/ui is scanned', () => {
  const bad = css('.x { color: #11171d; }')
  assert.ok(decide(UI, bad, KNOWN))
  assert.equal(decide('/Users/x/Aspen/i/metacode/metadata/object_p/org_c.json', bad, KNOWN), null)
  assert.equal(decide('/Users/x/Aspen/i/metacode/server/server_main_c/src/lib.rs', bad, KNOWN), null)
  assert.equal(decide('/Users/x/notes/scratch.ts', bad, KNOWN), null)
})

test('clean custom UI passes', () => {
  const good = css('.x {\n  color: var(--ap-sem-color-text-primary, #11171d);\n  padding: var(--ap-sem-spacing-inner-md, 16px);\n  width: 240px;\n}')
  assert.equal(decide(UI, good, KNOWN), null)
})

// ---- the message -----------------------------------------------------------------------

test('the message names the line, the property and the token family to use', () => {
  const reason = decide(UI, css('.x { padding: 16px; }'), KNOWN)
  assert.match(reason, /padding: 16px/)
  assert.match(reason, /--ap-sem-spacing-inner-\*/)
  assert.match(reason, /aspen-token-exempt/)
  assert.match(reason, /ui-design-tokens\.md/)
})

test('the message says a fallback is fine, so the fix is not to strip them', () => {
  const reason = decide(UI, css('.x { color: #11171d; }'), KNOWN)
  assert.match(reason, /fallback/)
})

// ---- the tool payloads it runs on ---------------------------------------------------

test('content comes off Write, Edit and MultiEdit payloads alike', () => {
  assert.equal(contentOf({ content: 'a' }), 'a')
  assert.equal(contentOf({ new_string: 'b' }), 'b')
  assert.equal(contentOf({ edits: [{ new_string: 'c' }, { new_string: 'd' }] }), 'c\nd')
  assert.equal(contentOf(undefined), '')
})

test('an Edit is judged on what it is adding', () => {
  // Only the replacement is in the payload, so that is what gets scanned -- a hardcode
  // arriving this turn is caught even though the rest of the file is clean.
  const payload = {
    tool_name: 'Edit',
    tool_input: { file_path: UI, old_string: 'x', new_string: '.y { color: #d7dee2; }' }
  }
  const stdout = execFileSync('node', [SCRIPT], { input: JSON.stringify(payload), encoding: 'utf8' })
  const decision = JSON.parse(stdout)
  assert.equal(decision.hookSpecificOutput.permissionDecision, 'deny')
  assert.match(decision.hookSpecificOutput.permissionDecisionReason, /--ap-sem-color-\*/)
})

test('a clean write produces no output at all, so the tool proceeds', () => {
  const payload = {
    tool_name: 'Write',
    tool_input: { file_path: UI, content: css('.x { color: var(--ap-sem-color-text-primary); }') }
  }
  const stdout = execFileSync('node', [SCRIPT], { input: JSON.stringify(payload), encoding: 'utf8' })
  assert.equal(stdout, '')
})

test('a malformed payload is allowed through rather than wedging the session', () => {
  const stdout = execFileSync('node', [SCRIPT], { input: 'not json', encoding: 'utf8' })
  assert.equal(stdout, '')
})
