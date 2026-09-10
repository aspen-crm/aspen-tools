# Example customer repository

The smallest repository that exercises every part of an Aspen customer project: one metadata
component, one server codefile, one UI codefile. Nothing here changes how the instance behaves —
the page is a hello world, the trigger only logs, and the picklist is not referenced by any field.

## Layout

This is the layout Aspen Builder creates and reads, and the one `aspen move` and `ac validate`
both accept.

```
metacode/
  metadata/<ctype>/<name>.json   authored, committed
  platform/                      downloaded, gitignored
  compiled/                      derived, gitignored
  active/                        deployed mirror, gitignored
  server/server_main_c/          Rust, compiled to wasm32-wasip2
  ui/ui_main_c/                  TypeScript, built by x-cli
```

The three generated tiers are **siblings of `metadata/`, never inside it**. Every subdirectory of
a metadata root has to name a component type, so a tier directory inside `metadata/` makes
`ac validate` reject the whole root. For the same reason `metadata/` holds component-type
directories directly, with no `custom/` layer.

The Rust half depends on [`aspen-crm`](https://crates.io/crates/aspen-crm) from crates.io, so it
needs no checkout: `Cargo.lock` is committed and a fresh clone builds as is.

The UI half depends on [`@aspen-crm/sdk`](https://www.npmjs.com/package/@aspen-crm/sdk) and
[`@aspen-crm/x-cli`](https://www.npmjs.com/package/@aspen-crm/x-cli) from npm, so `npm install`
needs no registry configuration beyond the default.

## What is in it

| Piece | Where | Does |
| --- | --- | --- |
| Global picklist | `metadata/picklist_p/lead_source_c.json` | Three items. Global, so it is not named for an object and no field references it. |
| Record trigger | `server/server_main_c/` | `contact_logger_c` logs one line per contact on `after_insert`. |
| Page | `ui/ui_main_c/` | `helloPage` renders one paragraph at `/ui/a/example/`. |

The trigger reads `name_p` and logs it, and does nothing else — no writes, no rejections, so a
contact insert behaves exactly as it would without it.

## Working in it

`AGENTS.md` holds the build, validate, and deploy commands, and the rules that go with them:
which directories are authored, which are generated, and what has to be true before any of it
runs. `CLAUDE.md` points at the same file, so a coding agent reads one copy.

The short version:

```sh
aspen compile --rust ./metacode              # never bare `aspen compile`
cd metacode/ui/ui_main_c && npm install && npm run build
```

`aspen login -i <instance-url>` connects a machine to an instance, once, in a browser. Every other
command runs against whatever is connected, and says `No instance is logged in` when there is
nothing.
