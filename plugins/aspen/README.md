# Aspen — Claude Code plugin

Developer workflow skills for customizing an [Aspen Platform](https://github.com/aspen-crm) instance
with the `aspen` CLI.

## Skills

| Skill           | Invoke              | What it does                                                              |
| --------------- | ------------------- | ------------------------------------------------------------------------ |
| `using-aspen`   | routes on any task  | The entry point for customizing an instance with the `aspen` CLI: discover the CLI from `aspen --help` (nothing hardcoded), extend `_p` / author `_c`, and the safety rails. |
| `read-metadata` | routes on any task  | Read the instance's metadata (platform `_p`, app, custom `_c` tiers) with the CLI as the source of truth, before authoring or changing anything. |

More skills (and agents) will be added here over time.

## The model digest

The plugin keeps a Markdown index of your instance's metadata at `.aspen/model/`, so the model is
one grep away instead of a download away.

| Level | File | Read it how |
| --- | --- | --- |
| Map | `.aspen/model/index.md` | Whole — it's tiny |
| Inventory | `.aspen/model/<tier>.md` | Grep it; a platform tier runs to thousands of rows |
| Component | `.aspen/model/<tier>/<component>.md` | Attributes, plus the path to the real source file |

Two hooks keep it honest, and neither one touches the network — the digest is a pure function of the
metadata already on disk, so it costs milliseconds and works offline:

- **SessionStart** — rebuilds if the metadata changed since the last build, and tells the agent
  where the digest is. Silent in projects that aren't Aspen.
- **PostToolUse** — rebuilds after a download, and marks the digest stale after a checkin or deploy,
  because the instance just moved and your local copy didn't.

The digest indexes the download; it doesn't replace it. Every component page names its source file,
and `read-metadata` says to open that file before authoring.

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
hooks/
  hooks.json               # SessionStart + PostToolUse wiring
  model-digest.mjs         # builds .aspen/model/ from the local metadata (Node, no deps)
```
