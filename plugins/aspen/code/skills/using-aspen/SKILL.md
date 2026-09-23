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
everywhere below `aspen` means `.aspen/bin/aspen`). Run commands with this instance folder as their working directory. If it is not known, locate
the Builder-created folder or ask which instance the user intends. Do not initialize another
project to make the paths line up. A Codex worktree may not contain Builder's ignored `.aspen/`
cache; use the original instance folder for CLI operations when that is the selected instance.

Use the CLI commands from the session-start note when present. If hooks are disabled or not
trusted, run `.aspen/bin/aspen --help` and `.aspen/bin/aspen move --help` once from the instance
folder. Re-read help only when a command mismatch requires it. Resolve bundled references and
scripts from the absolute directory containing this `SKILL.md`.

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
  A write to `platform/`, `compiled/`, or `active/` is blocked by the enabled, trusted file-edit hook. Those tiers don't error on a stray write, they silently discard it, so a hook
  denies it up front and names the `metadata/` path to use instead.

- `compiled/<ctype>/<name>.json` is the **resolved truth** — platform defaults filled in. It is the
  shape you copy. Builder fills it lazily, so it can be incomplete.
- The generated tiers are **siblings of `metadata/`, never inside it**, and there is **no `custom/`
  layer** — every subdirectory of `metadata/` must name a component type, or the instance rejects
  the whole root.
- Fields live **inside their object's file** under `fields`. There is no `field_p` directory.

## The loop

0. **Earn it, then place it.** Before the first file, two questions, in this order.

   **Should it exist?** If the request creates an object, field, picklist, record type, tab or
   tab collection, invoke **`lean-data-model`** first. A business noun usually already has a
   platform object — deal is `opportunity_p`, company is `account_p`, ticket is `case_p` — and a
   second home for one concept splits every report, list view, trigger and integration. Nothing
   here deletes, so this question is only cheap now.

   **Which tier?** Then invoke **`model-first`** and fill in its placement table:
   every thing the request asks for, the tier it belongs in (1 metadata, 2 Rust trigger, 3
   TypeScript page), and why not the tier above. The request will not say which tier it wants —
   people name the screen they imagine, not the component they need — and a derived number, a
   status set or a validation rule answered in TypeScript is the one mistake this loop cannot
   undo later. **Nothing on this platform deletes**, and a value the page computes is invisible to
   lists, reports, triggers and the runtime MCP. Skip this only when the tier is already settled:
   editing a field you authored last turn, fixing a trigger's logic, restyling a page that exists.

1. **Find the shape.** `ls metacode/compiled/<ctype>/` to see what exists, then `cat` one that is
   like what you want. That file is a working example — copy it, do not invent attribute names or
   enum values. Filtering a big one down to the part you need: `jq`, not a Python heredoc — one
   line, no interpreter startup.
   - **Before writing or changing a query**, read [query-notes.md](query-notes.md). This applies
     to pages, triggers, scripts and verification queries. Check each selected field and lookup
     target against the schema; `name_p` is not a universal display field. The reference also
     covers picklist technical values versus UI labels and currency formatting.

2. **Author** into `metacode/metadata/<ctype>/<name>.json`:
   - *Declarative* (object, field, picklist, layout, list view, tab, tab collection): copy the
     compiled shape, change `name`/`label` to your `_c` name, and swap in your members.
     - **Never author a `namespace` field — not on the component, not on a nested member.** The
       compiled tier shows `namespace` because it is resolved output; the importer refuses it on
       the way in (`namespace field not allowed in input '<name>'`, one per component). Namespace
       is inferred from the `_c`/`_p` suffix. Strip it when you copy.
     - **The component's own name must end `_c` too, not just its members'.** `org_c.layout_p`
       fails checkin ("ensure the new component is in the custom namespace"); `org_c.layout_c` is
       what passes. The same is likely true of names nested inside it (a layout section, say) —
       copy an existing custom example for those rather than assuming.
     - **A name cannot have an underscore in the last two characters before its suffix.**
       `tier_1_c` fails ("component name cannot contain underscore in the last 2 characters");
       `tier_one_c` passes. Numbered picklist items are the usual casualty — spell them out.
     - Do **not** author platform-derived fields (`id_p`, `cb_p`, audit fields) — the instance
       adds those itself. **Polyid companion fields are the one exception**: for a polyid like
       `owner_c` (`related-object-field: "owneron_c"`, `related-display-field: "ownerdn_c"`) you
       must author both yourself — `owneron_c` as `picklist`/`object_ref` with
       `polymorphic-field: "owner_c"`, `ownerdn_c` as plain `text` — or checkin-prep fails with
       `related-object-field 'owneron_c' not found`.
     - A `number` field needs both `min-value` and `max-value`, **written as strings**
       (`"min-value": "0", "max-value": "999999"`, as every compiled one is). A bare integer
       fails ("expected a Decimal type"); a missing `max-value` fails on its own.
     - `indexed` is valid on text, picklist, date, datetime, number, currency and uuid fields —
       **not on `id`, `polyid`, `checkbox`, or `text/long`** ("unknown fields: indexed"). Before
       setting it on a type not listed here, survey which types carry it:
       `jq -r '.fields[] | select(has("indexed")) | "\(.type)/\(.subtype)"' metacode/compiled/object_p/*.json | sort -u`
     - `searchable: true` needs an authored `global-search-config` component to go with it —
       default to `false` unless you're adding that too.
     - Field `type`/`subtype` is part of the shape, not something to work out from scratch —
       common pairs, copied from real objects: `text`/`text`; `number`/`number` (a plain count) or
       `number`/`percentage`; `currency`/`currency`; `datetime`/`datetime`; `id`/`lookup` with
       `relationship` for one object; `polyid`/`lookup` with `allowed-objects` for several;
       `picklist`/`picklist` with `picklist: "<object>.<field>"`. Anything else — still copy it
       from a real object.
     - **To remove anything, retire it with `"active": false`. Never delete its JSON.** Dropping a
       child entry — a tab from a `tab_collection_p`, a column from a `list_view_p`, a field from
       an object, a `tab_p` or `list_view_p` itself — fails checkin-prep with "is dropping child
       components … Child components cannot be dropped". `"active": false` is accepted on all of
       them (a child entry takes `active`/`label`/`description`); reordering entries is fine.
     - Overriding a **platform** component: an object-level `label` on `account_p` or
       `opportunity_p` works. These reject any override, by import ("Unsupported input for
       ctype") and by the offline validator alike, and `"namespace": "platform"` does not help:
       - a base object type (`opportunity_p.base_p`);
       - a platform picklist (`task_p.priority_p`, `role_p`) — so `contact_role_p` roles cannot
         be extended to a custom object, and `items: unlocked` only applies to the Builder editor;
       - the stock tab collection (`tab_collection_p:aspen_crm_p`) — so a custom object **cannot
         be added to the "Aspen" nav**. Author a new custom `tab_collection_p` (`marketing_c`)
         that lists the platform tabs you want beside your own; referencing a platform tab is
         fine, only overriding the collection is not.
       A platform *field* override is untested and risks the whole batch — to relabel a field in
       one view, set `label` on that `list_view_p` column instead. **Deploy anything that touches
       a platform component as its own package**, apart from your custom work, so one rejection
       cannot take the rest down with it.
     - A new field on an object that has record types must also be declared in each of its
       `object_type_p` files, or typed records reject it. A layout needs an `object` attribute
       and names fields by their raw name (`amount_p`), never an object-type alias (`amount_c`).
     - Some shapes have **no compiled example to copy** — a dot-walked list view column, a
       `custom_page` tab, a `query-filter` on the current user. `metadata-shapes.md` beside this
       file has them, reverse-engineered and checked in; read it when step 1 turns up nothing.
   - *Rust trigger*: a crate at **`server/server_main_c/`, that exact directory name** — the
     platform only ever loads a server codefile named `server_main_c` (or `server_main_a`); any
     other crate directory compiles and checks in clean and then silently never fires, on any
     object or event. The trigger declared in its `aspen.server.json` (its `"name"` field, separate
     from the crate name) is what the `impl` block implements.
     - **No `server/` yet?** Copy the skeleton that ships beside this file — nothing to fetch:
       ```
       cp -R <this skill's dir>/server-skeleton/server_main_c metacode/server/
       cp <this skill's dir>/server-skeleton/rust-toolchain.toml ./
       rustup target add wasm32-wasip2      # once per machine
       ```
       The `rust-toolchain.toml` goes at the **instance root**, beside `metacode/`, and it is not
       optional: without it the crate compiles and links, then dies at componentization with
       `invalid leading byte (0x63)` naming wit-bindgen — an error that reads as a dependency
       problem and is not one. Don't chase it through lockfiles; check for the pin.
     - **Don't start from the `aspen_crm` docs** (8.8% coverage). Start from `trigger-patterns.rs`
       beside this file: six handlers that fired on a real instance — set a field in
       `before_insert`, a batched lookup, a transition that creates records, one body for two
       events, a self-writing trigger with its guard, and `before_delete` — plus the helper block
       they share. Copy the helpers and the one closest to yours. `rust-trigger-notes.md` has the
       rules behind them (variant per field type, the changed-fields-only batch, the debugging
       order), read when a pattern doesn't cover your case.
   - *TypeScript page*: a module under `ui/ui_main_c/src/pages/` with the route declared in
     `aspen.client.json`. A custom (`_c`) codefile serves at
     `/ui/c/<base-url-path-part>/<route path>` — `/ui/a/` is app scope, not yours. The page runs
     in a **sandboxed guest iframe**: build URLs and navigate through `window.top`, and intercept
     your own link clicks (`preventDefault` + `stopPropagation`) — the guest runtime mis-resolves
     even an absolute `href` against the guest route. The SDK's `navigation.navigate` to
     `/objects/:objectName/:recordId` needs `config.tabName`, or the platform errors "No active
     tab found". Data comes from the instance's query endpoints via `@aspen-crm/sdk/request`;
     follow the AQL and paging/counting rules read in step 1.
     - **Picklist values stay technical; visible text uses the item's metadata label.** Keep
       names such as `usd_p` in API payloads, comparisons and option values. Resolve labels from
       the field's picklist for options, cells, badges and read-only text; never derive a label
       by stripping a suffix or changing case. See [Picklist values and UI labels](query-notes.md#picklist-values-and-ui-labels)
       for the currency formatter boundary.
     - **Styling: read `ui-design-tokens.md` before the first line of markup, not after.** Which
       token a thing takes is structural, and retrofitting tokens onto a page built from hex and
       px is a rewrite. `definePage`/`defineLayoutSection` hand you a bare `element` and nothing to
       import for the look — style your own markup with Aspen's `--ap-sem-*` CSS variables, never
       a hex value or px size. That file is the inventory: every semantic token by name, with the
       per-component `--ap-comp-*` names in `ui-component-tokens.md` beside it (grep it for one
       component; never read it whole).
     - **The tokens do reach you, and nothing else does.** Only the JavaScript runs in that hidden
       iframe; the DOM renders in a **shadow root on the platform document**, so every `--ap-*`
       custom property inherits from `:root` — semantic, component, the dark value and the
       responsive steps alike. The platform's own CSS does not come with it: no utility classes,
       and **no resets**, so the guest starts at `box-sizing: content-box`. Set
       `box-sizing: border-box` on your own subtree yourself.
     - **Write the light value as a fallback** — `var(--ap-sem-color-text-primary, #11171d)`. A
       misspelled token is not an error anywhere: it resolves to nothing, the build passes, and the
       element silently keeps whatever it inherited. The fallback is the only thing standing
       between a typo and an invisible one.
     - **If Aspen already ships the thing you are building, start from that component's tokens.**
       A `<table>` in a record section sits inches from Aspen's own list views, and
       `--ap-comp-cell-*` and the 65 `--ap-comp-table-*` names already hold the cell padding,
       hover and border that the semantic layer only gets you close to. Compose from `--ap-sem-*`
       for what has no Aspen counterpart — which is most of a page, but not your table. Mixing the
       two is normal.
     - A hardcode, an unknown token name, or a `table`/`button`/`select`/`textarea` styled from the
       semantic layer alone is **denied by the enabled, trusted hook**, with the token family to use instead. When a
       value genuinely has no token — a page dimension, a grid track, a mono stack — keep it and
       write `aspen-token-exempt: <reason>` on that line or the line above; for a component you are
       deliberately not rebuilding, `aspen-component-exempt: <reason>` anywhere in the file. Widths,
       heights and `calc()` offsets from a variable are not flagged at all.

3. **Validate offline — before anything touches the instance.** The instance's own validator
   runs locally in 0.2s and reports the same errors `checkin-prep` would, with the same text:
   ```
   ./ac validate --custom ./metacode/metadata --active-custom ./metacode/active \
                 --active-platform ./metacode/platform --format json \
     | jq -r '.valid, (.["batch-failures"][]?), (.components[].failures[] | select(.subtype != "SKIPPED_DUE_TO_BATCH_ERRORS") | .detail)'
   ```
   The first line is `true`/`false`; the rest is only the root causes. **One bad component fails
   the whole batch**, and every other component then reports `SKIPPED_DUE_TO_BATCH_ERRORS` — the
   `select` above hides those, because they are the cascade, not the error. Fix what's left, run
   it again, and only go on when it prints `true`.
   - `./ac` is at the instance root once `aspen download ac` has fetched it (the session-start
     note says if it's missing). `platform/` is there in every Builder folder. Omit
     `--active-custom` only when `metacode/active/` is empty — it is the baseline of what is
     already deployed, and without it a reference to something already live reads as unresolved.
   - A metadata-only change can skip step 4. Everything that failed a real `checkin-prep` in the
     sessions this skill is built from — `namespace`, `indexed` on an id, a bad name, a platform
     override, a dropped child, a number field's bounds — is caught here first.

4. **Compile.**
   - `aspen compile --rust ./metacode` — **never bare `aspen compile`** (it also picks a TypeScript
     target this layout does not build that way).
   - UI, if you changed it: `cd metacode/ui/ui_main_c && npm install && npm run build`.
   - **Check new or changed queries and display values.** TypeScript and metadata validation do
     not validate AQL strings or formatter inputs. Run the actual queries read-only against the
     target instance's existing schema before deployment, and inspect response failures as well
     as HTTP status. Queries depending on newly deployed fields must be checked in step 6.
     Render representative returned values with their picklist metadata, including currency;
     confirm the UI shows labels and the selected technical values survive a form round trip.

5. **Deploy.** Confirm with the human first — this changes the shared instance. Then, in order:
   ```
   aspen move save-package ./metacode
   aspen move checkin-prep
   aspen move checkin-index
   aspen move checkin-deploy
   ```
   Pass `./metacode` to `save-package`; the three checkin verbs are ordered and mandatory.

   `save-package` validates shallowly; **`checkin-prep` is the real validator** on the instance
   side, and step 3 is its local twin. If prep still fails, read its errors the same way — the one
   that is not `SKIPPED_DUE_TO_BATCH_ERRORS` is the cause. A failed prep leaves an in-flight
   package that blocks the next `save-package` ("Operation Save is not allowed"). **Recover in
   this order, no diagnosis needed:**
   1. `aspen move clear-package` — drops this package from the dev set. Usually enough.
   2. Only if it refuses with "invoke the checkin-clear action": `aspen move checkin-clear` —
      halts the stuck checkin and clears the shared sets.
   Both change shared state, so obtain explicit authorization for the exact recovery operation.
   Claude Code can prompt through its hook. Codex blocks the direct command because its hook
   runtime does not support `ask`; after authorization, use the bundled helper:
   ```sh
   node "<absolute using-aspen skill directory>/scripts/recover.mjs" --confirmed clear-package .aspen/bin/aspen
   ```
   Use `checkin-clear` in place of `clear-package` only when that wider recovery is authorized.
   `--confirmed` asserts existing user authorization; it does not obtain it. Resolve the skill
   directory from the loaded skill location, and run from the instance folder.
   Starting with `clear-package` means the wider one runs only when the instance itself says so.

6. **Verify.** A green checkin proves it compiled, not that it works. Read the compiled file back,
   and exercise the change — open the record, load the page, trigger the event. A Rust trigger
   that seems to do nothing may not be running at all (check the crate directory is really named
   `server_main_c` first) or may be running with a `match` arm silently swallowing the case —
   `rust-trigger-notes.md`'s "Debugging a trigger" section has the ordered checklist, plus the
   diagnostic-hard-error technique (`aspen_crm::warn!`/`info!` have no confirmed way to be read
   back; a temporary `error::bail!` surfaces in the UI at the save that fired the trigger) before
   you start re-reading the `aspen_crm` API from memory.

   A UI change has its own false negative: **the codefile's record id rotates every checkin, and
   the serving URL embeds it under a 1-year immutable cache.** An old URL serves the old bundle
   forever, which looks exactly like a deploy that did nothing. Reload the browser — and if you
   fetch the bundle yourself, re-resolve the id from `download-active-set` — before concluding the
   page did not ship.

## Rules

- **An object is not usable until it has a `layout_p` + a `list_view_p` + a `tab_p` placed in a
  `tab_collection_p`.** Without a layout its records cannot be opened; without a tab in a collection
  it cannot be reached. After creating an object, `ls metacode/compiled/{layout_p,list_view_p,tab_p}/`
  to see what it still needs. A tab surfaces **only** its `default-list-view` — there is no view
  picker (platform 26.3.3), so a second list view pointing at the same tab is unreachable.
- **Nothing on the platform deletes.** Anything you create while testing is permanent — say so
  before the human starts. Retiring is `"active": false` (author step above); a deleted JSON entry
  is rejected at checkin, not honored.
- **The instance is shared.** `aspen move checkin-clear` and `clear-package` clear state every
  builder on the instance shares — confirm before running them. (Codex uses the confirmed recovery helper in step 5.)
  When a save is refused, use the recovery order in step 5: `clear-package` first, `checkin-clear`
  only when the instance says so.
- **Never run `aspen init`** (Builder owns the folder) or `aspen login` yourself (it is a browser
  hand-off Builder does; you never see, type, ask for, or print a token).
- **`ac` is not a system tool** — `/usr/sbin/ac` on macOS is something unrelated. The validator is
  `./ac` at the instance root, put there by `aspen download ac`; don't search `PATH` for it.
- **What you learn about the platform goes in this plugin, not in memory.** A rule discovered on
  one instance is true on every instance at that platform version, and a memory file is read by
  one folder's sessions only. When a checkin or a compile teaches you something this skill does
  not say, tell the human it belongs in `aspen-tools`.
