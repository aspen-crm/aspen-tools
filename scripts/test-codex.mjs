#!/usr/bin/env node
// Native Codex loader smoke test: no installation, model call, credentials or CRM traffic.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const child = spawn('codex', ['app-server', '--stdio'], { stdio: ['pipe', 'pipe', 'pipe'] })
const pending = new Map()
let id = 0
const lines = createInterface({ input: child.stdout })
const fail = error => { for (const { reject } of pending.values()) reject(error); pending.clear() }
child.on('error', fail)
child.on('exit', code => fail(new Error(`Codex app-server exited (${code}); check that Codex can initialize its local state directory`)))
// Do not forward unrelated account/config diagnostics into CI logs.
child.stderr.resume()
lines.on('line', line => {
  let response
  try { response = JSON.parse(line) } catch { return }
  const request = pending.get(response.id)
  if (!request) return
  pending.delete(response.id)
  response.error ? request.reject(new Error(response.error.message)) : request.resolve(response.result)
})
function call(method, params) {
  return new Promise((resolve, reject) => {
    const request = ++id
    const timer = setTimeout(() => { pending.delete(request); reject(new Error(`Timed out: ${method}`)) }, 20000)
    pending.set(request, { resolve: v => { clearTimeout(timer); resolve(v) }, reject: e => { clearTimeout(timer); reject(e) } })
    child.stdin.write(JSON.stringify({ id: request, method, params }) + '\n')
  })
}
try {
  await call('initialize', { clientInfo: { name: 'aspen-plugin-test', version: '1' }, capabilities: { experimentalApi: true } })
  child.stdin.write('{"method":"initialized"}\n')
  for (const [lane, expectedSkills, expectedHooks] of [['code', 3, 2], ['cowork', 8, 0]]) {
    const name = `aspen-${lane}`
    const { plugin } = await call('plugin/read', { pluginName: name, marketplacePath: join(repo, '.claude-plugin/marketplace.json') })
    const manifest = JSON.parse(readFileSync(join(repo, 'plugins/aspen', lane, '.codex-plugin/plugin.json')))
    assert.equal(plugin.summary.localVersion, manifest.version)
    assert.equal(plugin.summary.interface.displayName, manifest.interface.displayName)
    assert.equal(plugin.skills.length, expectedSkills)
    assert.equal(plugin.hooks.length, expectedHooks)
    assert.deepEqual(plugin.mcpServers, lane === 'cowork' ? ['aspen-runtime-mcp'] : [])
    assert.ok(plugin.skills.every(skill => skill.name.startsWith(`${name}:`)))
    console.log(`${name}: native Codex loader found ${plugin.skills.length} skills, ${plugin.hooks.length} hooks, ${plugin.mcpServers.length} MCP servers`)
  }
} finally {
  lines.close()
  child.kill()
}
