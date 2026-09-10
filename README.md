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

## Aspen Runtime MCP

A local MCP server that lets Claude work an instance's records: view, search,
report, create and update, over the instance's own API. It is the runtime
counterpart to Builder -- it changes records, not the model.

It ships as an `.mcpb` bundle, which Claude Desktop installs in one click.
Cowork on the desktop bridges to whatever is installed in Claude Desktop, so
this is also how a Cowork user gets it.

These links always give you the current version:

| Platform | Download |
| --- | --- |
| macOS (universal) | [aspen-runtime-mcp-macos.mcpb](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-macos.mcpb) |
| Windows (x64) | [aspen-runtime-mcp-windows.mcpb](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-windows.mcpb) |

Two builds are published, for the same reason as Builder: Claude Desktop runs
on macOS and Windows only. The macOS bundle is universal, so one file covers
Apple silicon and Intel. Linux bundles are built and available on request, for
other hosts that launch a local MCP server.

The binary carries only an ad-hoc signature -- it is not signed with a
Developer ID and not notarized -- so macOS will warn on first run.

Open the `.mcpb` in **Claude Desktop -> Settings -> Extensions**. It asks for
two things: the full instance URL, `https://<host>/<domain>/<instance>`, and a
personal API key created in the instance's **API Keys** screen. Leave the API
base path at its default. The key is held in Desktop's secret store, and the
model never sees it.

The server carries the tools; the `aspen-cowork` plugin below carries the
procedures for using them well. Take both -- neither is much use alone.

The `stdio-mcp-latest` release says which version it currently holds. For a
specific version, or an older one, use the
[`stdio-mcp-` releases](https://github.com/aspen-crm/aspen-tools/releases?q=stdio-mcp&expanded=true)
directly.

## Claude Code plugins

Two plugins, split by the lane you are working in. **aspen-code** is the
pro-code loop, driven by the `aspen` CLI: author metadata, compile, deploy,
verify. **aspen-cowork** is the runtime loop, driven by the Aspen runtime MCP:
read, search, report on and update live records, with no CLI at all. They
install independently, so you can take one without the other. Both come from
this repository directly rather than from a release:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen-code@aspen
/plugin install aspen-cowork@aspen
```

| Plugin | Lane | Needs |
| --- | --- | --- |
| [aspen-code](plugins/aspen/code) | Customize an instance: read the model, author `_c` components, compile, deploy, verify. | The `aspen` CLI, which comes with Aspen Builder. |
| [aspen-cowork](plugins/aspen/cowork) | Work a live instance's records: view, search, report, create and update. | The Aspen Runtime MCP `.mcpb`, above. |

`aspen-cowork` teaches tools it does not carry, so it does nothing on its own —
install the runtime MCP alongside it.

**Working in Cowork rather than Claude Code?** Cowork installs a plugin by
uploading a zip, so take `aspen-cowork` from the release instead —
[aspen-cowork-plugin.zip](https://github.com/aspen-crm/aspen-tools/releases/download/aspen-cowork-latest/aspen-cowork-plugin.zip),
always the current build. Same plugin, same version; only the delivery differs.
[docs/installing-for-cowork.md](docs/installing-for-cowork.md) is the end-to-end
guide, covering the runtime MCP too.

The marketplace they come from is named `aspen`, which is what the `@aspen`
suffix refers to. Updating the marketplace picks up whatever is on the default
branch, so you do not wait for a release to get a fix.

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
Claude plugin goes under `plugins/aspen/<name>/` and gets listed in
`.claude-plugin/marketplace.json`; anything distributed as a binary needs only
a tag prefix and a release.
