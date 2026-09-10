# Aspen Code — Claude Code plugin

Developer workflow skills for customizing an [Aspen Platform](https://github.com/aspen-crm) instance
with the `aspen` CLI. This is the build half of the Aspen tools; the collaboration half ships
separately as [aspen-cowork](../cowork).

## Skills

| Skill           | Invoke             | What it does                                                              |
| --------------- | ------------------ | ------------------------------------------------------------------------- |
| `using-aspen`   | routes on any task | The entry point: discover the CLI at `.aspen/bin/aspen` (nothing hardcoded), extend delivered components, author custom ones, and the safety rails. |
| `read-metadata` | routes on any task | Read the instance's model as the source of truth before authoring or changing anything — a reader agent on a faster model walks the digest and brings back paths and shapes. |
| `map-model`     | after a download   | Fans out one subagent per component type to write what each type *means* — conventions, relationships, extension points. |
| `verify-change` | after a checkin    | Proves the change actually works — read the resolved model back, then exercise it with data. Any write is permanent and human-approved first. |
| `diagnose`      | on a failure       | Reproduce, then localize to a checkin phase before changing anything. No fix without a reproduction. |
| `complete-object-ui` | after an object | Checks whether the object has a layout, list view and tab; offers to author the missing ones and guides the shape. |

## Safety rails

`using-aspen` says the instance is shared. A `PreToolUse` hook makes that a property of
the system rather than of the model's diligence: `hooks/guard-destructive.mjs` asks —
never blocks — on `aspen move checkin-clear` and `aspen move clear-package`, the two verbs
that reach the dev set every builder on the instance shares.

It matches on what a command *means*, not one spelling of it: quotes, tabs, line
continuations, case and an absolute path to the binary all resolve to the same verb. It
returns `permissionDecision: "ask"`, so a host that does not understand the field sees a
plain exit 0 — an unrecognized field degrades to *allowed*, never to *blocked*, and the
hook cannot wedge a recovery path.

**Record writes are deliberately not guarded here.** The `aspen` CLI has no record verbs,
so there is no command shape to match, and a rule matching some other tool would read as
though record writes were covered when nothing is. `verify-change` owns that gate, in the
conversation.

## UI coverage

A new object exists only to an API caller until something surfaces it. Three components
do that, and they are not independent: `layout_p` renders one record, `list_view_p` is
the rows, `tab_p` is where the list view is reached from — and a tab is invisible until a
`tab_collection_p` lists it.

`hooks/ui-coverage.mjs` answers which objects have which, grouping on each component's
`object` attribute rather than its name, because the platform ships names like
`currency_view_p` that say nothing about their object. It reads the tree on every call
and stores nothing, so it cannot go stale.

```
node "${CLAUDE_PLUGIN_ROOT}/hooks/ui-coverage.mjs" report [object]
```

### Object types

Where an object sets `uses-object-types`, a layout can name one type through
`object-type`, and a type with no layout of its own **renders with the object's**. So the
report breaks a typed object down per type, and writing an `object_type_p` file asks
whether that type wants a layout specific to it — an enhancement, never a fix. Inheriting
is the designed behaviour, and on a real instance every one of the three object types has
its own layout anyway.

The base type's layout drops the type from its name (`product_p.layout_p` for
`product_p.base_p`); every other type keeps it (`product_p.bundle_p.layout_p`). Only
layouts vary by type — the object owns its list view and tab.

A `PostToolUse` hook runs the same check when an object or object type file is authored
and surfaces only that component's gap. Two things it reports are worth telling apart:

- **A list view or tab with no layout** is a defect: someone reaches a row, clicks it,
  and there is no layout to open the record with. It appears nowhere in platform
  metadata — only a customer can create it.
- **A type-using object with no layout at all** is the worst version of the first case:
  "inherit the object layout" inherits nothing, so every type is unrenderable.
- **A tab no collection lists** is an observation, not a defect. The platform itself
  ships tabs it never places (3 of 10 on a real instance), so the report names the
  collections it searched and leaves the judgement to you.

## The model digest

A component is not a file. An Aspen `metacode/` tree holds up to four layers of the
same component, and no single layer is the truth:

| Layer | Holds |
| --- | --- |
| baseline | what Aspen delivers — platform-owned members only |
| liveOverlay | the customer overlay live on the instance, `extends`-keyed |
| authored | the overlay authored locally, not yet checked in |
| resolved | the real merge, with platform defaults filled in |

The digest indexes them by `(ctype, name)` into `.aspen-model/`, so one component is one
entry carrying every layer it has. It also marks the members the instance adds that
nobody authors — audit fields, currency and polyid companions — because authoring one of
those alongside your own field is a checkin error.

Those derived-member rules are **inferred from the instance's own files**, never
hardcoded, so a platform change arrives with the next download rather than a plugin
release. A rule ships only with three or more components behind it; thinner patterns
stay as per-component observations, because at two examples they are as likely to be a
name coincidence as a rule.

### Setting it up

```
node "${CLAUDE_PLUGIN_ROOT}/hooks/model-digest.mjs" detect   # writes aspen-model.json
node "${CLAUDE_PLUGIN_ROOT}/hooks/model-digest.mjs" build
```

`detect` classifies each root by sampling file content rather than trusting directory
names, since the CLI lets the caller name those roots anything. Commit
`aspen-model.json`; everyone else on the repo inherits it.

Two hooks then keep the digest current, and neither touches the network — it is a pure
function of the files on disk, so it works offline and cannot hang a session. SessionStart
rebuilds only if the metadata changed; PostToolUse rebuilds after a download and marks
the digest stale after a checkin or deploy.

`.aspen-model/` writes its own `.gitignore`: the index is ignored because it rebuilds in
under a second, and `maps/` is committed because it is expensive LLM output that
teammates should not pay to regenerate.

To point the inference at a real instance without writing anything:

```
node "${CLAUDE_PLUGIN_ROOT}/hooks/model-digest.mjs" verify /path/to/instance
```

## Install

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen-code@aspen
```

The skills route themselves as you work; you can also invoke one directly by its namespaced name,
e.g. `/aspen-code:read-metadata`. (The plugin is named `aspen-code`; the marketplace it comes from
is named `aspen`, which is what the `@aspen` suffix refers to.)

### Local development

```
claude --plugin-dir /path/to/aspen-tools/plugins/aspen/code
```

### Tests

```
cd plugins/aspen/code && node --test "test/*.test.mjs"
```

The fixture is synthesized rather than copied from a real instance — structurally
faithful, so it carries the shapes the assertions need without publishing anyone's
metadata.

## Layout

```
.claude-plugin/plugin.json          # plugin manifest (name: aspen-code)
agents/aspen-model-reader.md        # answers one model question from the digest; sonnet
agents/aspen-component-mapper.md    # one type's mapper; sonnet; no Bash, no network
agents/aspen-ui-proposer.md         # proposes layout sections and list view columns
agents/aspen-executor.md            # writes decided files, runs decided commands; sonnet
hooks/hooks.json                    # SessionStart + PreToolUse + PostToolUse wiring
hooks/model-digest.mjs              # the digest: detect, build, verify, hooks
hooks/scaffold.mjs                  # write an authored component from a real one's shape
hooks/guard-destructive.mjs         # PreToolUse: ask before clearing shared instance state
hooks/ui-coverage.mjs               # object -> layout / list view / tab coverage
skills/using-aspen/SKILL.md         # entry point and router
skills/read-metadata/SKILL.md       # read the model as the source of truth
skills/map-model/SKILL.md           # the fan-out
skills/verify-change/SKILL.md       # prove it worked; the approval gate on writes
skills/diagnose/SKILL.md            # reproduce and localize before fixing
skills/complete-object-ui/SKILL.md  # give a new object a layout, list view and tab
test/                               # node:test suite + synthesized fixture
```
