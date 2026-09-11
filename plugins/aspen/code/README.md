# Aspen Code — Claude Code plugin

Customizing an [Aspen Platform](https://github.com/aspen-crm) instance with the `aspen` CLI. This
is the build half of the Aspen tools; the collaboration half ships separately as
[aspen-cowork](../cowork).

Deliberately small. Its whole job is to remove decisions from the session — one skill that is the
entire procedure, a session-start hook that hands the model the CLI's own commands so it never
stops to discover them, and one safety guard. No metadata index, no subagents, nothing to route
between.

## The one skill

`using-aspen` is the whole loop, and it applies to any change — a picklist, a field, a Rust
trigger, a TS page:

1. **Find the shape** — `ls`/`cat` a real component of the type under `metacode/compiled/`.
2. **Author** — copy that shape into `metacode/metadata/<ctype>/<name>.json`, or write the Rust/TS
   codefile and its descriptor.
3. **Compile** — `aspen compile --rust ./metacode` (and `npm run build` for UI).
4. **Deploy** — `aspen move save-package ./metacode`, then `checkin-prep → checkin-index →
   checkin-deploy`.
5. **Verify** — read the compiled file back and exercise it; a green checkin is not proof.

It carries the folder map (which directories are authored versus generated, and where server and UI
code live) and the rules that are easy to get wrong: an object needs a layout, list view and tab in
a collection before it is usable; nothing on the platform deletes; never `aspen init` or `aspen
login` yourself.

The skill is kept aligned with [`example-customer-repo/AGENTS.md`](../../../example-customer-repo/AGENTS.md),
which is the same map and commands written for a git-checkout customer project.

## The session-start hook

`hooks/session-start.mjs` runs once when a session opens in an instance folder. It executes
`aspen --help` and `aspen move --help` (~0.1s) and injects their output, so the model has the CLI's
exact commands — including the ordered checkin chain — in context before the first task, and never
re-reads help mid-work. Outside an instance folder it points the human at the right one. It touches
no network, authors nothing, and fails quiet.

## Safety rail

`hooks/guard-destructive.mjs` (a `PreToolUse` hook) asks — never blocks — before `aspen move
checkin-clear` and `aspen move clear-package`, the two verbs that reach the dev set every builder on
the instance shares. It matches on what a command *means* (quotes, tabs, line continuations, case,
and an absolute path to the binary all resolve to the same verb) and returns
`permissionDecision: "ask"`, so a host that does not understand the field degrades to *allowed*,
never *blocked* — the hook cannot wedge a recovery path.

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
.claude-plugin/plugin.json     # plugin manifest (name: aspen-code)
hooks/hooks.json               # SessionStart + PreToolUse wiring
hooks/session-start.mjs        # inject the CLI's commands; point at the skill
hooks/guard-destructive.mjs    # PreToolUse: ask before clearing shared instance state
skills/using-aspen/SKILL.md    # the one skill — the whole loop
start.md                       # setup guide, bundled so a re-read after install is local
test/                          # node:test suite (session-start, guard)
```
