# Aspen — Claude Code plugin

Developer workflow skills for customizing an [Aspen Platform](https://github.com/aspen-crm) instance
with the `aspen` CLI.

## Skills

| Skill           | Invoke             | What it does                                                              |
| --------------- | ------------------ | ------------------------------------------------------------------------- |
| `using-aspen`   | routes on any task | The entry point: discover the CLI from `aspen --help` (nothing hardcoded), extend delivered components, author custom ones, and the safety rails. |
| `read-metadata` | routes on any task | Read the instance's model as the source of truth, starting from the digest, before authoring or changing anything. |
| `map-model`     | after a download   | Fans out one subagent per component type to write what each type *means* — conventions, relationships, extension points. |
| `verify-change` | after a checkin    | Proves the change actually works — read the model back, then round-trip a record. Any write is permanent and human-approved first. |
| `diagnose`      | on a failure       | Reproduce, then localize to a checkin phase before changing anything. No fix without a reproduction. |

## Safety rails

`using-aspen` states two rules that cost other people when they are broken: the dev set is
shared, and a record you write is permanent. A `PreToolUse` hook makes both a property of
the system rather than of the model's diligence.

`hooks/guard-destructive.mjs` asks — never blocks — on:

- `aspen move checkin-clear` and `aspen move clear-package`, which reach the dev set every
  builder on the instance shares;
- `aspenx record create|update|delete --confirmed`, the forms that actually write. The
  un-confirmed form sends nothing and is a useful dry run, so it gets no prompt.

It matches on what a command *means*, not one spelling of it: quotes, tabs, line
continuations, case and an absolute path to the binary all resolve to the same verb. It
returns `permissionDecision: "ask"`, so a host that does not understand the field sees a
plain exit 0 — an unrecognized field degrades to *allowed*, never to *blocked*, and the
hook cannot wedge a recovery path.

**The prompt is a backstop, not the approval.** A human clicking through a permission
dialog has not seen the field values; `verify-change` owns getting real approval in the
conversation first.

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
/plugin install aspen@aspen
```

The skills route themselves as you work; you can also invoke one directly by its namespaced name,
e.g. `/aspen:read-metadata`. (The plugin is named `aspen` regardless of the repo name.)

### Local development

```
claude --plugin-dir /path/to/aspen-tools/plugins/aspen
```

### Tests

```
cd plugins/aspen && node --test "test/*.test.mjs"
```

The fixture is synthesized rather than copied from a real instance — structurally
faithful, so it carries the shapes the assertions need without publishing anyone's
metadata.

## Layout

```
.claude-plugin/plugin.json          # plugin manifest (name: aspen)
agents/aspen-component-mapper.md    # one type's mapper; no Bash, no network
hooks/hooks.json                    # SessionStart + PreToolUse + PostToolUse wiring
hooks/model-digest.mjs              # the digest: detect, build, verify, hooks
hooks/guard-destructive.mjs         # PreToolUse: ask before shared-state and record writes
skills/using-aspen/SKILL.md         # entry point and router
skills/read-metadata/SKILL.md       # read the model as the source of truth
skills/map-model/SKILL.md           # the fan-out
skills/verify-change/SKILL.md       # prove it worked; the approval gate on writes
skills/diagnose/SKILL.md            # reproduce and localize before fixing
test/                               # node:test suite + synthesized fixture
```
