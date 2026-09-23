#!/usr/bin/env node
// Credential-free protocol probe through the actual Codex launcher.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const binary = process.argv[2]
if (!binary) throw new Error('usage: node scripts/smoke-runtime-mcp.mjs <runtime-binary>')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const config = mkdtempSync(join(tmpdir(), 'aspen-mcp-smoke-'))
try {
  for (const bulk of ['0', '1']) {
    const messages = [
      { id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'codex-smoke', version: '1' } } },
      { method: 'notifications/initialized' }, { id: 2, method: 'tools/list' }, { id: 3, method: 'resources/list' }
    ]
    const output = spawnSync(process.execPath, [join(root, 'plugins/aspen/cowork/bin/aspen-runtime-mcp.mjs')], {
      env: { PATH: process.env.PATH, ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
        ASPEN_CONFIG_DIR: config, ASPEN_RUNTIME_MCP: resolve(binary), ASPEN_BULK_WRITES: bulk },
      input: messages.map(message => JSON.stringify({ jsonrpc: '2.0', ...message }) + '\n').join(''),
      encoding: 'utf8', timeout: 15000
    })
    assert.equal(output.status, 0, output.stderr)
    const responses = output.stdout.trim().split('\n').map(JSON.parse)
    const init = responses.find(r => r.id === 1).result
    const tools = responses.find(r => r.id === 2).result.tools
    assert.equal(init.serverInfo.name, 'aspen-runtime-mcp')
    assert.equal(tools.some(t => t.name === 'aspen_records_bulk_update'), bulk === '1')
    assert.ok(tools.every(t => typeof t.annotations?.readOnlyHint === 'boolean'))
    assert.ok(responses.find(r => r.id === 3).result.resources.some(r => r.uri === 'aspen://objects'))
    console.log(`Runtime ${init.serverInfo.version}: stdio handshake, ${tools.length} annotated tools, resources; bulk=${bulk}`)
  }
} finally { rmSync(config, { recursive: true, force: true }) }
