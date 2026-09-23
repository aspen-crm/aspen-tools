import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { patchFiles } from '../hooks/patch-input.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const patch = (...lines) => ['*** Begin Patch', ...lines, '*** End Patch'].join('\n')
function run(command, cwd, tool = 'apply_patch', codex = true) {
  const env = { ...process.env }
  delete env.PLUGIN_ROOT
  if (codex) env.PLUGIN_ROOT = root
  const result = spawnSync(process.execPath, [join(root, 'hooks/pre-tool.mjs')], {
    env, input: JSON.stringify({ cwd, tool_name: tool, tool_input: { command } }), encoding: 'utf8'
  })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim() ? JSON.parse(result.stdout).hookSpecificOutput : null
}
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'aspen codex hooks '))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}
function put(dir, path, text) {
  mkdirSync(dirname(join(dir, path)), { recursive: true })
  writeFileSync(join(dir, path), text)
}

test('Codex blocks generated-tier writes in every file of a patch', t => {
  const dir = fixture(t)
  const out = run(patch('*** Add File: notes.txt', '+fine', '*** Add File: metacode/active/object_p/org_c.json', '+{}'), dir)
  assert.equal(out.permissionDecision, 'deny')
  assert.match(out.permissionDecisionReason, /metadata/)
})

test('Codex blocks deleting and moving generated files, including move destinations', t => {
  const dir = fixture(t)
  put(dir, 'metacode/active/x.json', '{}\n')
  put(dir, 'notes.txt', '{}\n')
  for (const command of [
    patch('*** Delete File: metacode/active/x.json'),
    patch('*** Update File: notes.txt', '*** Move to: metacode/compiled/x.json', '@@', '-{}', '+{"x":1}'),
    patch('*** Update File: metacode/active/x.json', '*** Move to: notes2.txt', '@@', '-{}', '+{"x":1}')
  ]) assert.equal(run(command, dir).permissionDecision, 'deny')
})

test('Codex resolves dot segments and blocks an update with hardcoded CSS', t => {
  const dir = fixture(t)
  put(dir, 'metacode/ui/panel.css', 'a { color: inherit }\n')
  const out = run(patch('*** Update File: metacode/ui/../ui/panel.css', '@@', '-a { color: inherit }', '+a { color: #ff0000 }'), dir)
  assert.equal(out.permissionDecision, 'deny')
  assert.match(out.permissionDecisionReason, /hardcoded/)
  assert.equal(readFileSync(join(dir, 'metacode/ui/panel.css'), 'utf8'), 'a { color: inherit }\n', 'the hook must not apply the patch')
})

test('Codex reconstructs multiple hunks before evaluating a new UI surface', t => {
  const dir = fixture(t)
  put(dir, 'metacode/metadata/tab_p/panel_c.json', '{\n  "name": "panel_c",\n  "tab-type": "object",\n  "label": "Old"\n}\n')
  const out = run(patch('*** Update File: metacode/metadata/tab_p/panel_c.json', '@@', '-  "tab-type": "object",', '+  "tab-type": "custom_page",', '@@', '-  "label": "Old"', '+  "label": "New"'), dir)
  assert.equal(out.permissionDecision, undefined)
  assert.match(out.additionalContext, /custom UI surface/)
})

test('Codex footprint findings are advisory, and hard denials take precedence', t => {
  const dir = fixture(t)
  const lines = ['*** Add File: metacode/metadata/object_p/deal_c.json', '+{"name":"deal_c","fields":[]}']
  assert.match(run(patch(...lines), dir).additionalContext, /opportunity_p/)
  assert.equal(run(patch(...lines, '*** Add File: metacode/platform/bad.json', '+{}'), dir).permissionDecision, 'deny')
})

test('Codex permits a valid token edit, and leaves unrelated files alone', t => {
  const dir = fixture(t)
  assert.equal(run(patch('*** Add File: metacode/ui/panel.css', '+a { color: var(--ap-sem-color-text-primary) }'), dir), null)
  assert.equal(run(patch('*** Add File: other.css', '+a { color: #ff0000 }'), dir), null)
})

test('an uninspectable Aspen patch is blocked with an actionable error', t => {
  const dir = fixture(t)
  put(dir, 'metacode/ui/panel.css', 'actual\n')
  const out = run(patch('*** Update File: metacode/ui/panel.css', '@@', '-not the file', '+a { color: #ff0000 }'), dir)
  assert.equal(out.permissionDecision, 'deny')
  assert.match(out.permissionDecisionReason, /context|inspect/)
})

test('patch previews preserve insertion-only, anchored and EOF hunk semantics', t => {
  const dir = fixture(t)
  put(dir, 'metacode/ui/example.txt', 'heading\nold\n')
  const preview = command => patchFiles(command, dir)[0].content
  assert.equal(preview(patch('*** Update File: metacode/ui/example.txt', '@@', '+tail', '@@ heading', '-old', '+new')), 'heading\nnew\ntail\n')
  assert.equal(preview(patch('*** Update File: metacode/ui/example.txt', '@@ heading', '-old', '+new', ' ', '*** End of File')), 'heading\nnew\n')
})

test('a directory alias cannot hide a generated-tier write', t => {
  const dir = fixture(t)
  mkdirSync(join(dir, 'metacode/active'), { recursive: true })
  symlinkSync(join(dir, 'metacode/active'), join(dir, 'alias'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.equal(run(patch('*** Add File: alias/x.json', '+{}'), dir).permissionDecision, 'deny')
})

test('the shared adapter preserves Claude file-edit guard decisions', t => {
  const dir = fixture(t)
  const env = { ...process.env }
  delete env.PLUGIN_ROOT
  for (const [path, content, expected] of [
    ['metacode/platform/x.json', '{}', 'deny'],
    ['metacode/ui/panel.css', 'a { color: #ff0000 }', 'deny'],
    ['metacode/metadata/object_p/deal_c.json', '{"name":"deal_c","fields":[]}', 'ask']
  ]) {
    const result = spawnSync(process.execPath, [join(root, 'hooks/pre-tool.mjs')], {
      env, input: JSON.stringify({ cwd: dir, tool_name: 'Write', tool_input: { file_path: path, content } }), encoding: 'utf8'
    })
    assert.equal(result.status, 0, result.stderr)
    assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, expected)
  }
})

test('Codex blocks unconfirmed shared-state recovery, Claude still asks', t => {
  const dir = fixture(t)
  const cmd = '.aspen/bin/aspen move checkin-clear'
  assert.equal(run(cmd, dir, 'Bash').permissionDecision, 'deny')
  assert.equal(run(cmd, dir, 'Bash', false).permissionDecision, 'ask')
  assert.equal(run('aspen move checkin-clear --help', dir, 'Bash'), null)
})

test('the configured hook entrypoint is used for both hosts', () => {
  const hooks = JSON.parse(readFileSync(join(root, 'hooks/hooks.json'), 'utf8'))
  const groups = hooks.hooks.PreToolUse
  assert.ok(groups.some(g => new RegExp(g.matcher).test('apply_patch')))
  assert.ok(groups.every(g => g.hooks.every(h => h.command.includes('/hooks/pre-tool.mjs'))))
})
