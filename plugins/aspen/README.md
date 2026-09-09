# Aspen — Claude Code plugin

Developer workflow skills for customizing an [Aspen Platform](https://github.com/aspen-crm) instance
with the `aspen` CLI.

## Skills

| Skill           | Invoke              | What it does                                                              |
| --------------- | ------------------- | ------------------------------------------------------------------------ |
| `using-aspen`   | routes on any task  | The entry point for customizing an instance with the `aspen` CLI: discover the CLI from `aspen --help` (nothing hardcoded), extend `_p` / author `_c`, and the safety rails. |
| `read-metadata` | routes on any task  | Read the instance's metadata (platform `_p`, app, custom `_c` tiers) with the CLI as the source of truth, before authoring or changing anything. |

More skills (and agents) will be added here over time.

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
```
