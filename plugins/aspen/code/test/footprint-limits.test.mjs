// The thresholds live in code and are explained in prose, and the two drift.
//
// A guard whose skill documents a limit it no longer enforces is worse than one with no prose:
// the reader trusts the number, the hook uses a different one, and nothing fails. This is the
// same coupling test the token guard has against its inventory -- cheap, and it catches the one
// mistake nobody notices by eye.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LIMITS } from '../hooks/guard-footprint.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SKILL = readFileSync(join(HERE, '..', 'skills', 'lean-data-model', 'SKILL.md'), 'utf8')

test('every threshold the guard enforces is written in the skill', () => {
  const written = {
    OBJECT_FIELDS: /more than (\d+) fields/,
    PICKLIST_MAX_THIN: /(\d+) items or fewer/,
    COLLECTION_TABS: /more than (\d+) tabs/,
    FIELD_OVERLAP: /(\d+)% of field names shared/,
    MIN_DISTINCTIVE_FIELDS: /needing (\d+) distinctive fields/
  }
  for (const [key, pattern] of Object.entries(written)) {
    const found = SKILL.match(pattern)
    assert.ok(found, `the skill never states ${key} (looked for ${pattern})`)
    const stated = Number(found[1])
    const actual = key === 'FIELD_OVERLAP' ? LIMITS[key] * 100 : LIMITS[key]
    assert.equal(stated, actual, `skill says ${key} is ${stated}, the guard uses ${actual}`)
  }
})

test('LIMITS holds exactly the keys the skill documents, so a new one cannot slip in unwritten', () => {
  assert.deepEqual(Object.keys(LIMITS).sort(), [
    'COLLECTION_TABS', 'FIELD_OVERLAP', 'MIN_DISTINCTIVE_FIELDS', 'OBJECT_FIELDS', 'PICKLIST_MAX_THIN'
  ])
})

test('the skill names the script the same way the repo spells it', () => {
  assert.match(SKILL, /scripts\/footprint\.mjs/)
})
