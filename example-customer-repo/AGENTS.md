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

`aspen-crm` comes from crates.io and `Cargo.lock` is committed, so a fresh clone builds as is.
`--rust` builds with `--locked`: after changing the `aspen-crm` version, run
`cargo update -p aspen-crm` to refresh the lockfile, and commit it.

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
