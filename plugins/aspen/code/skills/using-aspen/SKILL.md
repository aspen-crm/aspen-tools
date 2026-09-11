---
name: using-aspen
description: Use for ANY change to an Aspen CRM — authoring or extending objects, fields, picklists, layouts, tabs, writing a Rust trigger or a TypeScript page, compiling and deploying. This is the whole procedure — the folder map, the commands, and the loop, in order.
---

# Building on Aspen

One instance's metadata, Rust server code, and TypeScript UI code. You build locally; the
**instance validates and deploys** what it is given. Do the loop below in order and do not
re-derive it between steps.

## Where you are

The session is rooted in the instance folder Aspen Builder created — `~/Aspen/<domain>-<instance>`.
It holds `metacode/` and the CLI at `.aspen/bin/aspen` (not on `PATH` — run it by that path;
everywhere below `aspen` means `.aspen/bin/aspen`). If the session is rooted anywhere else, stop
and ask the human to reopen Claude Code in the instance folder — the CLI and the paths below only
line up from there.

The session-start note already listed the CLI's commands (`aspen --help`, `aspen move --help`).
Use those. **Do not re-read help during a task.**

## The layout

```
metacode/
  metadata/<ctype>/<name>.json   authored, the ONLY place you write
  platform/  compiled/  active/  generated siblings — read-only, never edit
  server/server_main_c/          Rust (record triggers) — this exact name, see rust-trigger-notes.md
  ui/ui_main_c/                  TypeScript (pages), declared in aspen.client.json
```

- `active/` is a **downloaded snapshot of what's currently on the instance**, kept in sync from
  it — not a place anything you write survives, by design, whatever tool does the writing.
  A write to `platform/`, `compiled/`, or `active/` is blocked before it happens — not just
  discouraged. Those tiers don't error on a stray write, they silently discard it, so a hook
  denies it up front and names the `metadata/` path to use instead.

- `compiled/<ctype>/<name>.json` is the **resolved truth** — platform defaults filled in. It is the
  shape you copy. Builder fills it lazily, so it can be incomplete.
- The generated tiers are **siblings of `metadata/`, never inside it**, and there is **no `custom/`
  layer** — every subdirectory of `metadata/` must name a component type, or the instance rejects
  the whole root.
- Fields live **inside their object's file** under `fields`. There is no `field_p` directory.

## The loop

1. **Find the shape.** `ls metacode/compiled/<ctype>/` to see what exists, then `cat` one that is
   like what you want. That file is a working example — copy it, do not invent attribute names or
   enum values. Filtering a big one down to the part you need: `jq`, not a Python heredoc — one
   line, no interpreter startup.

2. **Author** into `metacode/metadata/<ctype>/<name>.json`:
   - *Declarative* (object, field, picklist, layout, list view, tab, tab collection): copy the
     compiled shape, change `name`/`label` to your `_c` name with `"namespace": "custom"`, and swap
     in your members.
     - **The component's own name must end `_c` too, not just its members'.** `org_c.layout_p`
       fails checkin ("ensure the new component is in the custom namespace"); `org_c.layout_c` is
       what passes. The same is likely true of names nested inside it (a layout section, say) —
       copy an existing custom example for those rather than assuming.
     - Do **not** author platform-derived fields (`id_p`, `cb_p`, audit fields) — the instance
       adds those itself. **Polyid companion fields are the one exception**: for a polyid like
       `owner_c` (`related-object-field: "owneron_c"`, `related-display-field: "ownerdn_c"`) you
       must author both yourself — `owneron_c` as `picklist`/`object_ref` with
       `polymorphic-field: "owner_c"`, `ownerdn_c` as plain `text` — or checkin-prep fails with
       `related-object-field 'owneron_c' not found`.
     - A `number` field needs both `min-value` and `max-value`; checkin-prep fails on a missing
       `max-value` alone.
     - `searchable: true` needs an authored `global-search-config` component to go with it —
       default to `false` unless you're adding that too.
     - Field `type`/`subtype` is part of the shape, not something to work out from scratch —
       common pairs, copied from real objects: `text`/`text`; `number`/`number` (a plain count) or
       `number`/`percentage`; `currency`/`currency`; `datetime`/`datetime`; `id`/`lookup` with
       `relationship` for one object; `polyid`/`lookup` with `allowed-objects` for several;
       `picklist`/`picklist` with `picklist: "<object>.<field>"`. Anything else — still copy it
       from a real object.
   - *Rust trigger*: a crate at **`server/server_main_c/`, that exact directory name** — the
     platform only ever loads a server codefile named `server_main_c` (or `server_main_a`); any
     other crate directory compiles and checks in clean and then silently never fires, on any
     object or event. The trigger declared in its `aspen.server.json` (its `"name"` field, separate
     from the crate name) is what the `impl` block implements. The `aspen_crm` crate's own docs.rs
     coverage is thin — don't chase its API one struct at a time. This skill's
     `rust-trigger-notes.md` has the confirmed shapes (inserting a record, reading an
     `after_update` batch, which `RecordFieldValue` variant a field's own type/subtype needs, and
     what to do when a trigger seems to fire but does nothing), read only when you need it. For a
     fuller worked example
     than either file gives you, ask the human first, then fetch **only** `example-customer-repo/`
     — not the rest of `aspen-crm/aspen-tools`, which is unrelated plugin and doc source:
     ```
     git clone --no-checkout --filter=blob:none --sparse https://github.com/aspen-crm/aspen-tools <dir>
     git -C <dir> sparse-checkout set example-customer-repo
     git -C <dir> checkout
     ```
   - *TypeScript page*: a module under `ui/ui_main_c/src/pages/` with the route declared in
     `aspen.client.json`.

3. **Compile.**
   - `aspen compile --rust ./metacode` — **never bare `aspen compile`** (it also picks a TypeScript
     target this layout does not build that way).
   - UI, if you changed it: `cd metacode/ui/ui_main_c && npm install && npm run build`.

4. **Deploy.** Confirm with the human first — this changes the shared instance. Then, in order:
   ```
   aspen move save-package ./metacode
   aspen move checkin-prep
   aspen move checkin-index
   aspen move checkin-deploy
   ```
   Pass `./metacode` to `save-package`; the three checkin verbs are ordered and mandatory.

5. **Verify.** A green checkin proves it compiled, not that it works. Read the compiled file back,
   and exercise the change — open the record, load the page, trigger the event. A Rust trigger
   that seems to do nothing may not be running at all (check the crate directory is really named
   `server_main_c` first) or may be running with a `match` arm silently swallowing the case —
   `rust-trigger-notes.md`'s "Debugging a trigger" section has the ordered checklist, plus the
   diagnostic-hard-error technique (`aspen_crm::warn!`/`info!` have no confirmed way to be read
   back; a temporary `error::bail!` surfaces in the UI at the save that fired the trigger) before
   you start re-reading the `aspen_crm` API from memory.

## Rules

- **An object is not usable until it has a `layout_p` + a `list_view_p` + a `tab_p` placed in a
  `tab_collection_p`.** Without a layout its records cannot be opened; without a tab in a collection
  it cannot be reached. After creating an object, `ls metacode/compiled/{layout_p,list_view_p,tab_p}/`
  to see what it still needs.
- **Nothing on the platform deletes.** Anything you create while testing is permanent — say so
  before the human starts.
- **The instance is shared.** `aspen move checkin-clear` and `clear-package` clear state every
  builder on the instance shares — confirm before running them. (A guard hook also stops and asks.)
  They are not interchangeable: `clear-package` refuses while a checkin is in progress ("invoke
  the checkin-clear action" instead) — reach for `checkin-clear` when a `checkin-prep` partially
  started and needs halting before you can re-save; reach for `clear-package` to drop an
  unsubmitted save from the dev set.
- **Never run `aspen init`** (Builder owns the folder) or `aspen login` yourself (it is a browser
  hand-off Builder does; you never see, type, ask for, or print a token).
- **`ac` is not a system tool** — `/usr/sbin/ac` on macOS is something unrelated. If you need the
  instance's offline validator, `aspen download ac` fetches the one the logged-in instance
  publishes; don't search `PATH` for it. The instance still validates on checkin either way.
