# Aspen Tools

Tools for building on the [Aspen Platform](https://github.com/aspen-crm),
published here so they can be handed to anyone. The tools' source lives
elsewhere and is not necessarily public; this repository is how they are
distributed.

Each tool is versioned and released on its own. See
[docs/releasing.md](docs/releasing.md).

## Aspen Builder

A desktop app for administering an Aspen instance: objects, fields, layouts,
picklists, tabs and check-in.

Download the installer for your platform from the
[latest `builder-` release](https://github.com/aspen-crm/aspen-tools/releases?q=builder&expanded=true).

| Platform | File |
| --- | --- |
| macOS (Apple silicon) | `Aspen.Builder-<version>-arm64.dmg` |
| macOS (Intel) | `Aspen.Builder-<version>.dmg` |
| Windows (Arm) | `Aspen.Builder-<version>-Setup-arm64.exe` |
| Windows (x64) | `Aspen.Builder-<version>-Setup-x64.exe` |
| Windows (either) | `Aspen.Builder-<version>-Setup.exe` |

The macOS builds are not code-signed, so the first open needs right-click then
**Open** rather than a double-click.

## Aspen — Claude Code plugin

Developer workflow skills for the Aspen Platform. Installed from this
repository directly rather than from a release:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen@aspen
```

Updating the marketplace picks up whatever is on the default branch, so you do
not wait for a release to get a fix. See [plugins/aspen](plugins/aspen) for
what it ships.

## Adding a tool

`docs/releasing.md` covers the layout and the tag convention. In short: a
Claude plugin goes under `plugins/<name>/` and gets listed in
`.claude-plugin/marketplace.json`; anything distributed as a binary needs only
a tag prefix and a release.
