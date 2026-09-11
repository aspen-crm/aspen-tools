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
  server/server_main_c/          Rust (record triggers), declared in aspen.server.json
  ui/ui_main_c/                  TypeScript (pages), declared in aspen.client.json
```

- `compiled/<ctype>/<name>.json` is the **resolved truth** — platform defaults filled in. It is the
  shape you copy. Builder fills it lazily, so it can be incomplete.
- The generated tiers are **siblings of `metadata/`, never inside it**, and there is **no `custom/`
  layer** — every subdirectory of `metadata/` must name a component type, or the instance rejects
  the whole root.
- Fields live **inside their object's file** under `fields`. There is no `field_p` directory.

## The loop

1. **Find the shape.** `ls metacode/compiled/<ctype>/` to see what exists, then `cat` one that is
   like what you want. That file is a working example — copy it, do not invent attribute names or
   enum values.

2. **Author** into `metacode/metadata/<ctype>/<name>.json`:
   - *Declarative* (object, field, picklist, layout, list view, tab, tab collection): copy the
     compiled shape, change `name`/`label` to your `_c` name with `"namespace": "custom"`, and swap
     in your members. Do **not** author audit or derived fields — the instance adds those itself.
   - *Rust trigger*: a crate under `server/server_main_c/` with the trigger declared in
     `aspen.server.json` (see `metacode/server/*/aspen.server.json` for the shape).
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
   and exercise the change — open the record, load the page, trigger the event.

## Rules

- **An object is not usable until it has a `layout_p` + a `list_view_p` + a `tab_p` placed in a
  `tab_collection_p`.** Without a layout its records cannot be opened; without a tab in a collection
  it cannot be reached. After creating an object, `ls metacode/compiled/{layout_p,list_view_p,tab_p}/`
  to see what it still needs.
- **Nothing on the platform deletes.** Anything you create while testing is permanent — say so
  before the human starts.
- **The instance is shared.** `aspen move checkin-clear` and `clear-package` clear state every
  builder on the instance shares — confirm before running them. (A guard hook also stops and asks.)
- **Never run `aspen init`** (Builder owns the folder) or `aspen login` yourself (it is a browser
  hand-off Builder does; you never see, type, ask for, or print a token).
