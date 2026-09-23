#!/usr/bin/env node
// Opt-in model-backed planning evals: grade recommendations, not Claude's Skill tool.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const cases = ['field-not-object', 'reuse-platform-object', 'status-flow-is-lifecycle']
export function grade(name, answer) {
  if (!Array.isArray(answer.newObjects) || !Array.isArray(answer.fields) || !Array.isArray(answer.metadataTypes) || typeof answer.explanation !== 'string') return false
  if (answer.newObjects.length) return false
  if (name === 'field-not-object') return answer.fields.length === 2 && answer.fields.every(f => f.object === 'account_p') &&
    answer.fields.some(f => f.type === 'checkbox') && answer.fields.some(f => f.type === 'date')
  if (name === 'reuse-platform-object') return /opportunity_p/.test(answer.explanation)
  if (name === 'status-flow-is-lifecycle') return answer.metadataTypes.includes('lifecycle_p')
  throw new Error(`unknown case: ${name}`)
}
export function runEvals(outdir) {
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const plugin = join(repo, 'plugins/aspen/code')
  mkdirSync(outdir, { recursive: true })
  const results = []
  for (const name of cases) {
    const work = mkdtempSync(join(tmpdir(), `aspen-codex-${name}-`))
    try {
      const fixture = join(plugin, 'evals', name, 'fixture.sh')
      if (existsSync(fixture) && spawnSync('bash', [fixture], { cwd: work, encoding: 'utf8' }).status !== 0) throw new Error(`fixture failed: ${name}`)
      mkdirSync(join(work, 'metacode'), { recursive: true })
      const request = readFileSync(join(plugin, 'evals', name, 'prompt.md'), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, '')
      const prompt = `This is an offline Aspen planning evaluation. Read the using-aspen, lean-data-model and model-first SKILL.md files under ${join(plugin, 'skills')}. Use the supplied metacode fixtures and the user's facts. Do not deploy, contact any instance, run recovery commands, or install anything. Return the plan as the requested JSON structure; fields represent nested object fields, not standalone components.\n\n${request}`
      const answerPath = join(outdir, `${name}.json`)
      const run = spawnSync('codex', ['exec', '--ephemeral', '--ignore-user-config', '--sandbox', 'read-only', '--skip-git-repo-check',
        '-C', work, '--output-schema', join(plugin, 'evals/codex-output.schema.json'), '-o', answerPath, '-'],
      { input: prompt, encoding: 'utf8', timeout: 300000, maxBuffer: 8 * 1024 * 1024 })
      if (run.status !== 0) throw new Error(`Codex eval failed: ${name}; exit=${run.status}. Check Codex authentication and connectivity.`)
      const passed = grade(name, JSON.parse(readFileSync(answerPath, 'utf8')))
      results.push({ name, passed })
      console.log(`${name}: ${passed ? 'PASS' : 'FAIL'}`)
    } finally { rmSync(work, { recursive: true, force: true }) }
  }
  writeFileSync(join(outdir, 'results.json'), JSON.stringify(results, null, 2) + '\n')
  return results.every(r => r.passed)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] !== '--run' || !process.argv[3] || process.argv.length > 4) {
    console.error('usage: node scripts/eval-codex.mjs --run <output-directory> (makes model calls using your Codex login)')
    process.exitCode = 2
  } else process.exitCode = runEvals(resolve(process.argv[3])) ? 0 : 1
}
