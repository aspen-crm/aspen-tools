# Aspen — Claude Code plugin

Developer workflow skills for building applications on the [Aspen Platform](https://github.com/aspen-crm).
Pair it with the [`aspen-template`](https://github.com/aspen-crm/aspen-template) starter repo.

## Skills

| Skill           | Invoke              | What it does                                                              |
| --------------- | ------------------- | ------------------------------------------------------------------------ |
| `init`          | `/aspen:init`       | One-time onboarding for a fresh template clone: derives the org from the folder name, prompts for the instance URL + API key, rebrands the `company` placeholder, writes `.env`, and installs the toolchain (`x-cli`, `x-sdk`, `mover`). |
| `using-aspen`   | routes on any task  | The entry point for customizing an instance with the `aspen` CLI: discover the CLI from `aspen --help` (nothing hardcoded), extend `_p` / author `_c`, and the safety rails. |
| `read-metadata` | routes on any task  | Read the instance's metadata (platform `_p`, app, custom `_c` tiers) with the CLI as the source of truth, before authoring or changing anything. |

More skills (and agents) will be added here over time.

## Install

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen@aspen
```

Then invoke a skill by its namespaced name, e.g. `/aspen:init`. (The plugin and command are named
`aspen` regardless of the repo name.)

The `aspen-template` repo also pre-declares this plugin in its `.claude/settings.json`
(`extraKnownMarketplaces` + `enabledPlugins`), so a clone of the template offers to install it
automatically on first launch — no manual step needed there.

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
  init/SKILL.md            # the /aspen:init onboarding skill
  using-aspen/SKILL.md     # entry point for customizing with the aspen CLI
  read-metadata/SKILL.md   # read the instance's model as the source of truth
```
