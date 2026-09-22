// Static checks over the eval suite.
//
// `claude plugin eval` is in early access, so a contributor cannot necessarily RUN the cases
// to find out that one is malformed -- and a case the runner rejects, or a grader that can
// never fire, is invisible until someone with access dispatches the workflow and reads a
// score that is wrong for a reason nothing reports. These are the checks that do not need
// the runner: the frontmatter every grader type requires, regexes that actually compile, and
// the two couplings that silently rot -- a Skill indicator naming a skill that no longer
// exists, and a case whose allowed_tools omits Skill so its indicator can never fire at all.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PLUGIN = join(HERE, '..')
const EVALS = join(PLUGIN, 'evals')

// The grader types the runner supports, with the frontmatter each one requires.
const REQUIRED = {
  regex: ['pattern'],
  tool_used: ['tool'],
  tool_order: ['before', 'after'],
  file_exists: ['path'],
  llm: [],
  baseline: ['baseline_file']
}

const unquote = (value) => value.replace(/^\s*['"]|['"]\s*$/g, '').trim()

// A deliberately small frontmatter reader: these files are flat key/value plus one level of
// nesting under `focus:` / `target:`. A YAML dependency would be a heavier promise than the
// thing being checked.
function frontmatter (text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const flat = {}
  const nested = {}
  let parent = null
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const indented = /^\s/.test(line)
    const pair = line.match(/^\s*([A-Za-z_]+):\s*(.*)$/)
    if (!pair) continue
    const [, key, rawValue] = pair
    const value = rawValue.trim()
    if (indented && parent) {
      nested[parent] = nested[parent] ?? {}
      nested[parent][key] = unquote(value)
      continue
    }
    if (value === '') { parent = key; flat[key] = ''; continue }
    parent = null
    flat[key] = unquote(value)
  }
  return { flat, nested }
}

const list = (value) =>
  (value ?? '').replace(/^\[|\]$/g, '').split(',').map((entry) => entry.trim()).filter(Boolean)

const caseDirs = readdirSync(EVALS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'results')
  .map((entry) => entry.name)
  .sort()

test('the suite has cases, and each is a prompt plus at least one grader', () => {
  assert.ok(caseDirs.length >= 7, `expected the full suite, got ${caseDirs.length}`)
  for (const name of caseDirs) {
    assert.ok(existsSync(join(EVALS, name, 'prompt.md')), `${name} has no prompt.md`)
    const graders = readdirSync(join(EVALS, name, 'graders')).filter((f) => f.endsWith('.md'))
    assert.ok(graders.length > 0, `${name} has no graders`)
  }
})

for (const name of caseDirs) {
  const dir = join(EVALS, name)

  test(`${name}: prompt frontmatter is complete and names itself`, () => {
    const parsed = frontmatter(readFileSync(join(dir, 'prompt.md'), 'utf8'))
    assert.ok(parsed, 'prompt.md has no frontmatter block')
    assert.equal(parsed.flat.name, name, 'case name must match its directory')
    for (const key of ['description', 'model', 'allowed_tools']) {
      assert.ok(parsed.flat[key], `${name} prompt is missing \`${key}\``)
    }
  })

  test(`${name}: a scaffold_script it declares exists and is executable`, () => {
    const caseFile = join(dir, 'case.yaml')
    if (!existsSync(caseFile)) return
    const script = readFileSync(caseFile, 'utf8').match(/scaffold_script:\s*(\S+)/)
    if (!script) return
    const path = join(dir, script[1])
    assert.ok(existsSync(path), `${name} names ${script[1]}, which is not there`)
    // The runner executes it as the operator; a non-executable fixture fails the whole case.
    assert.ok(statSync(path).mode & 0o111, `${script[1]} is not executable`)
  })

  test(`${name}: every grader is a supported type with its required fields`, () => {
    for (const file of readdirSync(join(dir, 'graders')).filter((f) => f.endsWith('.md'))) {
      const where = `${name}/graders/${file}`
      const text = readFileSync(join(dir, 'graders', file), 'utf8')
      const parsed = frontmatter(text)
      assert.ok(parsed, `${where} has no frontmatter`)
      const { flat, nested } = parsed

      assert.ok(flat.type in REQUIRED, `${where}: unknown grader type \`${flat.type}\``)
      for (const key of REQUIRED[flat.type]) {
        assert.ok(flat[key], `${where}: \`${flat.type}\` needs \`${key}\``)
      }

      // An llm grader's rubric is its body. An empty body scores nothing.
      if (flat.type === 'llm') {
        const body = text.replace(/^---\n[\s\S]*?\n---/, '').trim()
        assert.ok(body.length > 80, `${where}: llm grader has no real rubric`)
      }

      if (flat.pattern !== undefined) {
        assert.doesNotThrow(() => new RegExp(flat.pattern, flat.flags ?? ''),
          `${where}: pattern does not compile`)
      }
      if (flat.input_match !== undefined) {
        assert.doesNotThrow(() => new RegExp(flat.input_match), `${where}: input_match does not compile`)
      }
      if (flat.match !== undefined) {
        assert.match(flat.match, /^(contains|not_contains|count:\d+)$/, `${where}: bad \`match\``)
      }
      if (flat.arm !== undefined) {
        assert.match(flat.arm, /^(with-only|both)$/, `${where}: bad \`arm\``)
      }
      if (flat.weight !== undefined && flat.weight !== '') {
        assert.match(flat.weight, /^\d+$/, `${where}: weight must be a number`)
      }
      for (const key of ['target', 'focus']) {
        const block = nested[key]
        if (!block) continue
        assert.match(block.source ?? '', /^(file|last_message|trace|files|mock_calls)$/,
          `${where}: bad ${key}.source`)
        if (block.source === 'file') assert.ok(block.path, `${where}: ${key}.source file needs a path`)
      }
    }
  })

  test(`${name}: a Skill indicator names a skill that exists, and the case may invoke it`, () => {
    for (const file of readdirSync(join(dir, 'graders')).filter((f) => f.endsWith('.md'))) {
      const { flat } = frontmatter(readFileSync(join(dir, 'graders', file), 'utf8'))
      if (flat.type !== 'tool_used' || flat.tool !== 'Skill') continue

      // The indicator's regex embeds the skill name. Renaming a skill without renaming it
      // here leaves a grader that can never pass and reports the plugin as not firing.
      const named = flat.input_match.match(/([a-z][a-z0-9-]*[a-z0-9])"?\s*$/)
      assert.ok(named, `${name}/${file}: cannot read a skill name out of input_match`)
      const skill = named[1]
      assert.ok(existsSync(join(PLUGIN, 'skills', skill, 'SKILL.md')),
        `${name}/${file}: indicator names \`${skill}\`, which is not a skill in this plugin`)

      // And the case has to be allowed to call it, or the indicator is dead on arrival.
      const prompt = frontmatter(readFileSync(join(dir, 'prompt.md'), 'utf8'))
      assert.ok(list(prompt.flat.allowed_tools).includes('Skill'),
        `${name}: has a Skill indicator but its allowed_tools omits Skill`)
    }
  })
}

test('the README case table lists exactly the cases on disk', () => {
  const readme = readFileSync(join(EVALS, 'README.md'), 'utf8')
  const listed = new Set([...readme.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|/gm)].map((m) => m[1]))
  for (const name of caseDirs) assert.ok(listed.has(name), `${name} is not in the README table`)
  for (const name of listed) {
    assert.ok(caseDirs.includes(name), `README lists ${name}, which is not a case directory`)
  }
})
