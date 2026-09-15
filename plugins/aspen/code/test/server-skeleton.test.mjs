import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The skill ships a server skeleton so a fresh instance folder can get a trigger crate
// without a network fetch. It is a copy of `example-customer-repo/`, which is the layout
// Builder creates and the one `aspen move` accepts. Two copies drift unless something
// says otherwise -- this does. Fix a difference by changing the example repo first and
// copying, never by editing the skeleton alone.

const HERE = dirname(fileURLToPath(import.meta.url))
const SKELETON = join(HERE, '..', 'skills', 'using-aspen', 'server-skeleton')
const EXAMPLE = join(HERE, '..', '..', '..', '..', 'example-customer-repo')

const PAIRS = [
  ['rust-toolchain.toml', 'rust-toolchain.toml'],
  ['server_main_c/Cargo.toml', 'metacode/server/server_main_c/Cargo.toml'],
  ['server_main_c/Cargo.lock', 'metacode/server/server_main_c/Cargo.lock'],
  ['server_main_c/aspen.server.json', 'metacode/server/server_main_c/aspen.server.json'],
  ['server_main_c/src/lib.rs', 'metacode/server/server_main_c/src/lib.rs']
]

for (const [skel, example] of PAIRS) {
  test(`server-skeleton/${skel} is byte-identical to example-customer-repo/${example}`, () => {
    const a = join(SKELETON, skel)
    const b = join(EXAMPLE, example)
    assert.ok(existsSync(a), `${a} is missing`)
    assert.ok(existsSync(b), `${b} is missing`)
    assert.equal(readFileSync(a, 'utf8'), readFileSync(b, 'utf8'))
  })
}

test('the toolchain pin names the channel the platform crate is built with', () => {
  const toml = readFileSync(join(SKELETON, 'rust-toolchain.toml'), 'utf8')
  assert.match(toml, /channel\s*=\s*"1\.98\.0"/)
  assert.match(toml, /wasm32-wasip2/)
})

test('the crate is named server_main_c, the one name the platform loads', () => {
  const toml = readFileSync(join(SKELETON, 'server_main_c', 'Cargo.toml'), 'utf8')
  assert.match(toml, /^name\s*=\s*"server_main_c"/m)
})
