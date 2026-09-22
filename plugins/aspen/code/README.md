# Aspen Code — Claude Code plugin

Customizing an [Aspen Platform](https://github.com/aspen-crm) instance with the `aspen` CLI. This
is the build half of the Aspen tools; the collaboration half ships separately as
[aspen-cowork](../cowork).

Deliberately small. Its whole job is to remove decisions from the session — two gates before the
first file, one skill that is the entire procedure for building it, a session-start hook that
hands the model the CLI's own commands so it never stops to discover them, and five safety
guards. No metadata index, no subagents, nothing to route between.

The two gates answer different questions, in order. **`lean-data-model`** asks whether a
component should exist at all. **`model-first`** asks which tier it belongs in. Both run before
anything is authored, because **nothing on this platform deletes** — a component that turns out
to be a mistake is retired with `"active": false` and stays in the model forever.

## The first gate: `lean-data-model`

Asked to "create a new deal object to capture sales opportunities", an agent on a real instance
produced a correct, well-formed `deal_c` — object, two picklists, layout, list view, tab, and a
nav entry beside Opportunities. Every component was properly authored. The instance already had
`opportunity_p`, and 62% of `deal_c`'s field names were a rename of its. The agent *noticed*, and
said so in its closing summary, after building all six.

That ordering is the failure. The knowledge was there; nothing made it arrive first.

`lean-data-model` is six questions asked before authoring: which platform object already holds
this, is it a field rather than an object, is it a checkbox rather than a picklist, who opens it
weekly and in what role, does the nav need a tab or does a related list do, and are you copying
Salesforce. It ships `platform-objects.md`, the catalogue of ~48 platform objects with the words
people actually use for them.

`hooks/guard-footprint.mjs` backs it, asking on a new object that duplicates one that exists, an
object past 25 fields, a picklist of 2 items or fewer, a nav past 15 tabs, and a new object while
a deployed one is still missing its layout, list view or tab.

The overlap check is the interesting one, and it is tuned rather than guessed. Comparing raw
field names fired on 26% of the objects on a real 46-object instance, almost all of them
four-field objects whose name, owner, status and dates matched everything. Ignoring the field
names every object carries, and refusing to compare an object with fewer than six distinctive
fields, takes that to 15% — and what survives is the genuine quote/order/line duplication that
instance really has. `scripts/footprint.mjs` runs the same checks over a whole tree for CI and
for arriving on an instance someone else built.

## The second gate: `model-first`

An Aspen instance has three tiers — metadata, Rust trigger, TypeScript page — and a request never
says which one it wants. People name the screen they imagine, not the component they need, so a
derived number, a status flow or a validation rule gets answered in TypeScript over a model that
does not hold it. The screen looks right, review passes, and the value is then invisible to list
views, reports, triggers and the runtime MCP. Nothing on this platform deletes, so that is
permanent.

`model-first` runs before the first file. It walks a six-question ladder and produces a
**placement table** — one row per thing the request asks for, with the tier, the component, and
why not the tier above. Every tier-3 row has to carry a reason; a row with an empty reason is not
built. Tier 3 is often the right answer, and the skill says so: an editable grid, a chart, a
timeline and a multi-object workspace all earn a page. What they do not earn is a page instead of
a model.

It ships `placement-table.md` beside it — the format plus seven worked rows from real instances,
three of them placements that shipped the wrong way first.

## The loop: `using-aspen`

`using-aspen` is the whole loop, and it applies to any change — a picklist, a field, a Rust
trigger, a TS page. Step 0 is `model-first`; the rest is:

1. **Find the shape** — `ls`/`cat` a real component of the type under `metacode/compiled/`.
2. **Author** — copy that shape into `metacode/metadata/<ctype>/<name>.json`, or write the Rust/TS
   codefile and its descriptor.
3. **Validate offline** — `./ac validate` against the tiers Builder keeps in the folder. It is
   the instance's own validator and reports what `checkin-prep` would, in 0.2s, before anything
   touches the shared instance.
4. **Compile** — `aspen compile --rust ./metacode` (and `npm run build` for UI).
5. **Deploy** — `aspen move save-package ./metacode`, then `checkin-prep → checkin-index →
   checkin-deploy`.
6. **Verify** — read the compiled file back and exercise it; a green checkin is not proof.

It carries the folder map (which directories are authored versus generated, and where server and UI
code live) and the rules that are easy to get wrong: an object needs a layout, list view and tab in
a collection before it is usable; nothing on the platform deletes, so retiring is `"active": false`
and a deleted entry is rejected; one bad component fails the whole checkin batch; never `aspen init`
or `aspen login` yourself.

Sibling files hold the parts that are read only when authoring that kind of thing, so the skill
itself stays short: the `aspen_crm` shapes for a Rust trigger, the design-token inventory for a
page, the metadata shapes that have no compiled example to copy (a dot-walked list view column, a
custom-page tab), and the XQL rules for a query from either a page or a trigger.

For triggers the skill also ships two things a fresh instance folder does not have. A **server
skeleton** — the toolchain pin, a `server_main_c` crate with its lockfile and descriptor — copied
in locally rather than fetched, and kept byte-identical to `example-customer-repo/` by a test. And
**`trigger-patterns.rs`**: six handlers that fired on a real instance, one complete `lib.rs` that
type-checks on the pinned toolchain, so a new trigger starts from the nearest working one.

Platform rules learned on one instance are true on every instance at that platform version, so
they go here, not in a per-folder memory. The skill says so, and asks the model to say so too.

The skill is kept aligned with [`example-customer-repo/AGENTS.md`](../../../example-customer-repo/AGENTS.md),
which is the same map and commands written for a git-checkout customer project.

## The session-start hook

`hooks/session-start.mjs` runs once when a session opens in an instance folder. It executes
`aspen --help` and `aspen move --help` (~0.1s) and injects their output, so the model has the CLI's
exact commands — including the ordered checkin chain — in context before the first task, and never
re-reads help mid-work. It adds one line naming which of three optional pieces the folder lacks —
the Rust toolchain pin, the server crate, the offline validator — because each fails silently or
misleadingly when absent, and before the first command is the cheapest place to know. Outside an
instance folder it points the human at the right one. It touches no network, authors nothing, and
fails quiet.

## Safety rails

`hooks/guard-destructive.mjs` (a `PreToolUse` hook on `Bash`) asks — never blocks — before `aspen
move checkin-clear` and `aspen move clear-package`, the two verbs that reach the dev set every
builder on the instance shares. It matches on what a command *means* (quotes, tabs, line
continuations, case, and an absolute path to the binary all resolve to the same verb) and returns
`permissionDecision: "ask"`, so a host that does not understand the field degrades to *allowed*,
never *blocked* — the hook cannot wedge a recovery path.

`hooks/guard-footprint.mjs` (a `PreToolUse` hook on `Write`/`Edit`/`MultiEdit`) asks before a
component that should probably not exist — see the first gate above for the checks and how the
thresholds were calibrated. Like the surface guard it fires only on a new component file or a
threshold newly crossed, and it asks rather than denies, because every finding is a judgement
about intent and a second object is sometimes genuinely right.

`hooks/guard-custom-ui-surface.mjs` (a `PreToolUse` hook on `Write`/`Edit`/`MultiEdit`) asks
before a **new** custom UI surface lands — a route or layout section in `aspen.client.json`, a
`custom_page` tab, a `custom_code` layout section. Whether a page is the right tier is a
judgement about what the model already holds, not a pattern in a diff, so this asks rather than
denies, and names what is new. It fires once, on the write that first declares the surface: it
diffs the surfaces in the incoming file against the copy on disk, replaying an `Edit` against
that copy rather than scanning a fragment. Later edits to a surface that already exists are
silent, because the decision is already made and a guard that re-asks is a guard people switch
off. A component at `"active": false` is not a surface.

`hooks/guard-metadata-writes.mjs` (a `PreToolUse` hook on `Write`/`Edit`) denies — there is nothing
to ask about — a write into `metacode/platform/`, `metacode/compiled/`, or `metacode/active/`. Those
tiers don't error on a stray write, they silently discard it, so without this a session can "author"
a whole object there, watch every field report success, and only find out from a failed deploy
minutes later. The hook computes the `metadata/` path that would have worked and hands it back in
the denial reason.

## Reading the model

There is no index. `metacode/compiled/<ctype>/<name>.json` is the resolved truth for one component —
`ls` the directory to find one, `cat` it to read it. `compiled/`, `platform/`, and `active/` are
generated, read-only siblings of `metadata/`; you author only under `metadata/`. The instance
validates on checkin, so an authoring mistake surfaces there rather than from a local index.

## Install

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen-code@aspen
```

Invoke the skill directly by its namespaced name if you like: `/aspen-code:using-aspen`. (The plugin
is named `aspen-code`; the marketplace it comes from is named `aspen`, which is what the `@aspen`
suffix refers to.)

### Local development

```
claude --plugin-dir /path/to/aspen-tools/plugins/aspen/code
```

### Tests

```
cd plugins/aspen/code && node --test "test/*.test.mjs"
```

## Layout

```
.claude-plugin/plugin.json                # plugin manifest (name: aspen-code)
hooks/hooks.json                          # SessionStart + PreToolUse wiring
hooks/session-start.mjs                   # inject the CLI's commands; point at the skill
hooks/guard-destructive.mjs               # PreToolUse (Bash): ask before clearing shared instance state
hooks/guard-metadata-writes.mjs           # PreToolUse (Write/Edit): deny writes outside metadata/
hooks/guard-ui-tokens.mjs                 # PreToolUse (Write/Edit): deny hardcoded styling, unknown --ap-* names, component rebuilds
hooks/guard-custom-ui-surface.mjs         # PreToolUse (Write/Edit): ask before a new route, custom_page tab or custom_code section
hooks/guard-footprint.mjs                 # PreToolUse (Write/Edit): ask before a duplicate object, wide object, thin picklist, long nav
scripts/lint-ui-tokens.mjs                # the same two checks over a whole tree, for CI
scripts/footprint.mjs                     # the same footprint checks over a whole tree, for CI
skills/lean-data-model/SKILL.md           # gate 1 — should this component exist at all
skills/lean-data-model/platform-objects.md  # the ~48 platform objects and the words for them
skills/model-first/SKILL.md               # gate 2 — which tier each piece belongs in
skills/model-first/placement-table.md     # the table's format and seven worked rows
skills/using-aspen/SKILL.md               # the loop — step 0 runs both gates
skills/using-aspen/rust-trigger-notes.md  # aspen_crm shapes, read only when writing a trigger
skills/using-aspen/trigger-patterns.rs    # six handlers that fired in production; copy the nearest
skills/using-aspen/server-skeleton/       # toolchain pin + server_main_c crate; identical to example-customer-repo
skills/using-aspen/ui-design-tokens.md    # --ap-sem-* token inventory, read only when styling a page
skills/using-aspen/ui-component-tokens.md # every --ap-comp-* name; grep it for one component
skills/using-aspen/metadata-shapes.md     # shapes with no compiled example; read when step 1 finds nothing
skills/using-aspen/query-notes.md         # XQL rules, counting, paging; read before writing a query
start.md                                  # setup guide, bundled so a re-read after install is local
test/                                     # node:test suite (session-start, four guards, eval hygiene, skeleton identity)
```
