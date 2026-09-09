# Aspen — Claude Code plugin

Developer workflow skills for customizing an [Aspen Platform](https://github.com/aspen-crm) instance
with the `aspen` CLI.

## Skills

| Skill           | Invoke              | What it does                                                              |
| --------------- | ------------------- | ------------------------------------------------------------------------ |
| `using-aspen`   | routes on any task  | The entry point for customizing an instance with the `aspen` CLI: discover the CLI from `aspen --help` (nothing hardcoded), extend `_p` / author `_c`, and the safety rails. |
| `read-metadata` | routes on any task  | Read the instance's metadata (platform `_p`, app, custom `_c` tiers) with the CLI as the source of truth, before authoring or changing anything. |
| `map-model`     | after a download    | Fans out one subagent per component type to read the metadata in parallel and write what each type *means* — conventions, relationships, extension points. |

More skills (and agents) will be added here over time.

## The model digest

The plugin keeps a Markdown index of your instance's metadata at `.aspen/model/`, so the model is
one grep away instead of a download away.

| Level | File | Read it how |
| --- | --- | --- |
| Map | `.aspen/model/index.md` | Whole — it's tiny |
| Inventory | `.aspen/model/<tier>.md` | Grep it; a platform tier runs to thousands of rows |
| Component | `.aspen/model/<tier>/<component>.md` | Attributes, plus the path to the real source file |
| Slice | `.aspen/model/types/<tier>__<type>.md` | One component type — a mapper's unit of work |
| Map | `.aspen/model/maps/<tier>__<type>.md` | What that type means, written by a mapper |

Two hooks keep it honest, and neither one touches the network — the digest is a pure function of the
metadata already on disk, so it costs milliseconds and works offline:

- **SessionStart** — rebuilds if the metadata changed since the last build, and tells the agent
  where the digest is. Silent in projects that aren't Aspen.
- **PostToolUse** — rebuilds after a download, and marks the digest stale after a checkin or deploy,
  because the instance just moved and your local copy didn't.

The digest indexes the download; it doesn't replace it. Every component page names its source file,
and `read-metadata` says to open that file before authoring.

### Maps

Indexing is mechanical, so a script does it. Understanding isn't, so agents do — `map-model` splits
the model by component type and spawns one `aspen-component-mapper` per slice, in parallel. Each
reads its own source files and writes `.aspen/model/maps/<tier>__<type>.md`: shape, conventions,
relationships, extension points, outliers, and what it couldn't read.

Mappers get `Read`, `Grep`, `Glob`, and `Write` — no Bash, so a mapper can't run the CLI or reach
the network. It reads what's already on disk.

Each map records the signature of the files it was built from. A rebuild recomputes signatures, so
`index.md` and `manifest.json` show which maps are current, which are stale, and which types have
never been read. Re-mapping only redoes what moved.

A rebuild stages into `.aspen/model.building` and swaps at the end, so a build that dies partway
leaves the previous digest — and its maps — untouched. In a hook, a failure prints one line and
exits 0; run by hand, it exits non-zero.

Build it by hand any time with:

```
node <plugin>/hooks/model-digest.mjs build
```

### Configuration

The metadata tree is found by looking for a directory holding `platform/`, `app/`, and `custom/`.
Override it, or the output location, in `.aspen/model.config.json`:

```json
{ "metadataRoot": "../my-instance", "outDir": ".aspen/model", "maxComponents": 20000 }
```

`ASPEN_METADATA_ROOT` overrides `metadataRoot`. The generated files ignore themselves via
`.aspen/model/.gitignore` — they're per-instance state, not source.

## Install

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen@aspen
```

The skills route themselves as you work; you can also invoke one directly by its namespaced name,
e.g. `/aspen:read-metadata`. (The plugin is named `aspen` regardless of the repo name.)

### Local development

To load the plugin from a local checkout without installing it:

```
claude --plugin-dir /path/to/aspen-tools/plugins/aspen
```

## Layout

```
.claude-plugin/
  plugin.json         # plugin manifest (name: aspen)
  marketplace.json    # self-referential catalog so the repo is installable as a marketplace
skills/
  using-aspen/SKILL.md     # entry point for customizing with the aspen CLI
  read-metadata/SKILL.md   # read the instance's model as the source of truth
  map-model/SKILL.md       # fan out one mapper per component type
agents/
  aspen-component-mapper.md  # reads one tier's worth of one component type
hooks/
  hooks.json               # SessionStart + PostToolUse wiring
  model-digest.mjs         # builds .aspen/model/ from the local metadata (Node, no deps)
```
