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

These links always give you the current version:

| Platform | Download |
| --- | --- |
| macOS (Apple silicon) | [Aspen-Builder-arm64.dmg](https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-arm64.dmg) |
| Windows (x64) | [Aspen-Builder-Setup-x64.exe](https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-Setup-x64.exe) |

Two builds are published, which covers everyone we hand a link to. If you need
an Intel mac, an Arm Windows machine, or the universal Windows installer, ask
-- they are built, just not published here.

The macOS build is not code-signed, so the first open needs right-click then
**Open** rather than a double-click.

The `builder-latest` release says which version it currently holds. For a
specific version, or an older one, use the
[`builder-` releases](https://github.com/aspen-crm/aspen-tools/releases?q=builder&expanded=true)
directly.

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

## Example customer repository

`example-customer-repo/` is the smallest project that exercises every part of
an Aspen customer repo: one global picklist, one Rust record trigger, one
TypeScript page. Nothing in it changes how an instance behaves -- the page is a
hello world, the trigger only logs, and the picklist is referenced by no field
-- so it is safe to build, validate and deploy from while learning the
commands.

It is not released; copy the directory, or clone this repository and work in
it. `example-customer-repo/AGENTS.md` holds the build, validate and deploy
commands and the rules that go with them, and its `CLAUDE.md` points at the
same file so a coding agent reads one copy.

Point the Rust crate's `aspen-crm` path dependency at your own `x-platform`
checkout before the first Rust build -- the committed value assumes a sibling
checkout and is a guess. `AGENTS.md` says where to look.

## Adding a tool

`docs/releasing.md` covers the layout and the tag convention. In short: a
Claude plugin goes under `plugins/<name>/` and gets listed in
`.claude-plugin/marketplace.json`; anything distributed as a binary needs only
a tag prefix and a release.
