# Aspen customer project

One instance's metadata, Rust server code, and TypeScript UI code. You build locally; the instance
validates and deploys what it is given.

## Instance connection

Every `move` command needs one. Without it they fail with `No instance is logged in.`; an expired
credential fails with `INVALID_SESSION_ID`. Either way, ask the user to run:

```sh
aspen login -i <instance-url>
```

Never run `aspen login` yourself — it needs a browser and refuses when an agent drives the shell.
Nothing names the connected instance, so when it matters, ask.

## SDK path, before any Rust build

`metacode/server/server_main_c/Cargo.toml` reaches `aspen-crm` by path, and the committed value
assumes a sibling `x-platform` checkout that usually is not there. Point it at the local one:

1. `HOST_PROJECT_PATH`, if set — the checkout is its parent.
2. Search the user's code directories for `app/server/packages/crust/aspen-crm/Cargo.toml`;
   confirm it declares `name = "aspen-crm"`.
3. Otherwise ask. Never guess a path.

The edit is machine-local. Do not commit it.

## Metadata

Author only in `metacode/metadata/<ctype>/<name>.json`; each file declares its own `ctype` and
`name`. Fields go inside their object's file under `fields` — there is no `field_p` directory.

`platform/`, `compiled/`, and `active/` are generated siblings of `metadata/`. Never edit them, and
never create a `custom/` directory inside `metadata/` — every subdirectory of a metadata root must
name a component type.

## Build

```sh
aspen compile --rust ./metacode

cd metacode/ui/ui_main_c && npm install && npm run build
```

Never bare `aspen compile`: it also selects a TypeScript target this layout does not have.

`--rust` builds with `--locked`, so a fresh clone runs `cargo generate-lockfile` once, and
`cargo update -p aspen-crm` after a platform release bump.

## Validate

Install `ac` with `aspen download ac`, not by other means.

Delete `metacode/platform` and `metacode/active` first — `download-active-set` refuses a non-empty
target. Both are gitignored.

```sh
aspen move download-active-set --platform-dir ./metacode/platform --custom-dir ./metacode/active

ac validate --custom ./metacode/metadata \
            --active-custom ./metacode/active \
            --active-platform ./metacode/platform \
            --out <a-temp-directory>
```

Download both tiers: `active/` is the baseline that decides what is genuinely pending. Omit
`--active-custom` only before the first download, when the directory does not exist.

## Deploy

Confirm with the user first; this changes the instance.

```sh
aspen move save-package ./metacode
aspen move checkin-prep
aspen move checkin-index
aspen move checkin-deploy
```

Always pass `./metacode`. The three checkin verbs are ordered and mandatory; `checkin-clear` halts
an active checkin, `clear-package` clears the dev set.
