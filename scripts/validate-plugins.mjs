#!/usr/bin/env node
// Offline package checks used in CI and against the actual staged Codex archive.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const json = path => JSON.parse(readFileSync(path, 'utf8'))
export function validatePlugin(root) {
  const manifest = json(join(root, '.codex-plugin/plugin.json'))
  assert.match(manifest.name, /^[a-z][a-z0-9-]*$/)
  assert.match(manifest.version, /^\d+\.\d+\.\d+(?:[+-][\w.-]+)?$/)
  assert.ok(manifest.description && manifest.author?.name && manifest.interface?.displayName)
  assert.equal(manifest.skills, './skills/')
  const skills = readdirSync(join(root, 'skills'), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)
  assert.ok(skills.length)
  for (const skill of skills) {
    const text = readFileSync(join(root, 'skills', skill, 'SKILL.md'), 'utf8')
    assert.match(text, /^---\r?\nname: [\w-]+\r?\ndescription: .+/)
    assert.ok(!text.includes('${CLAUDE_PLUGIN_ROOT}'), `${skill}: resolve scripts relative to the skill`)
  }
  const hooks = join(root, 'hooks/hooks.json')
  if (existsSync(hooks)) {
    for (const groups of Object.values(json(hooks).hooks)) for (const group of groups) for (const hook of group.hooks) {
      assert.equal(hook.type, 'command')
      const path = /\$\{CLAUDE_PLUGIN_ROOT\}\/([^"\s]+)/.exec(hook.command)?.[1]
      assert.ok(path && existsSync(join(root, path)), `missing hook: ${hook.command}`)
    }
  }
  if (manifest.mcpServers) {
    const servers = typeof manifest.mcpServers === 'string'
      ? json(join(root, manifest.mcpServers)).mcpServers : manifest.mcpServers
    for (const server of Object.values(servers)) {
      assert.equal(server.command, 'node')
      for (const arg of server.args) {
        const relative = arg.replace(/^\$\{CLAUDE_PLUGIN_ROOT\}\//, '')
        assert.ok(!relative.includes('..') && existsSync(join(root, relative)), `missing MCP launcher: ${arg}`)
      }
      assert.ok(server.tool_timeout_sec >= 300, 'uploads need at least 300 seconds')
    }
  }
  return { name: manifest.name, version: manifest.version, skills: skills.length }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  for (const path of process.argv.slice(2)) console.log(JSON.stringify(validatePlugin(resolve(path))))
}
