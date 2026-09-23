import { test } from 'node:test'
import assert from 'node:assert/strict'
import { grade } from '../../../../scripts/eval-codex.mjs'

test('Codex eval grading rewards domain behavior, not a Skill tool invocation', () => {
  const answer = { newObjects: [], fields: [{object:'account_p', name:'nda_c', type:'checkbox'}, {object:'account_p', name:'signed_c', type:'date'}], metadataTypes: [], explanation: 'Two fields on account_p' }
  assert.equal(grade('field-not-object', answer), true)
  assert.equal(grade('field-not-object', {...answer, newObjects:['nda_c']}), false)
  assert.equal(grade('field-not-object', {...answer, fields:[]}), false)
  assert.equal(grade('reuse-platform-object', {...answer, explanation:'Reuse opportunity_p'}), true)
  assert.equal(grade('reuse-platform-object', {...answer, newObjects:['deal_c'], explanation:'opportunity_p'}), false)
  assert.equal(grade('status-flow-is-lifecycle', {...answer, metadataTypes:['lifecycle_p']}), true)
  assert.equal(grade('status-flow-is-lifecycle', {...answer, metadataTypes:['picklist_p']}), false)
})
