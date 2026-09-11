import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

// start.md is bundled into the plugin so that, once aspen-code is installed, the setup
// guide is a local file rather than a network fetch. The canonical copy is docs/start.md
// at the repo root; this guards the two from drifting. The bundled copy ships (the repo
// subdir IS the plugin); the test dir does not, so this only runs in the repo.
test('the bundled start.md matches the canonical docs/start.md', () => {
  const bundled = readFileSync(join(HERE, '..', 'start.md'), 'utf8')
  const canonical = readFileSync(join(HERE, '..', '..', '..', '..', 'docs', 'start.md'), 'utf8')
  assert.equal(bundled, canonical, 'plugins/aspen/code/start.md is out of sync with docs/start.md — copy docs/start.md over it')
})
