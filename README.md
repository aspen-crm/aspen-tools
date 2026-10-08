# Aspen Tools

Tools for building on the [Aspen Platform](https://github.com/aspen-crm),
published here so they can be handed to anyone. The tools' source lives
elsewhere and is not necessarily public; this repository is how they are
distributed.

Each tool is versioned and released on its own. See
[docs/releasing.md](docs/releasing.md).

## Codex

Both Aspen plugins support Codex alongside Claude. See
[Installing for Codex](docs/installing-for-codex.md) for repository-marketplace installation,
connecting the hosted MCP, hook trust, and testing. `aspen-code` handles model authoring;
`aspencrm-ai` (displayed as Aspen CRM AI) handles live records.

**One-prompt customer setup:** start `codex` in the terminal, then paste:

```text
Run `curl -fsSL https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/docs/start-codex.md` (use curl.exe on Windows), read the full document, and follow its setup steps. Ask for my Aspen instance URL when needed.
```

The [setup guide](docs/start-codex.md) installs the selected plugins, connects the
instance's hosted MCP, and verifies the connection with read-only checks.
Sign-in, hook trust, and restarting Codex remain customer actions.

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

## Aspen CRM AI — the hosted MCP

Every Aspen instance serves its own MCP server, so Claude can work the instance's records —
view, search, report, create, update in bulk, delete, attach files, merge duplicate contacts
— over the instance's own API, signed in as the user. There is nothing to download for it:
add the instance's URL with `/mcp` on the end as a connector, and sign in.

```
https://<host>/<domain>/<instance>/mcp
```

It works in Claude and Cowork on the desktop and on the web, in Claude Code, and in Codex.
The server carries the tools; the `aspencrm-ai` plugin below carries the procedures for
using them well. Take both.

[docs/mcp-quickstart.md](docs/mcp-quickstart.md) is the page to hand a customer: the
connector URL, the three clients, the plugin, and a check that it worked.
[docs/installing-for-cowork.md](docs/installing-for-cowork.md) is the longer walk-through
Claude can work with them step by step.

**The Aspen Runtime MCP (`.mcpb`) is retired**, and so is the `aspen-cowork` plugin that
taught it. The hosted server replaces both: no bundle to install, no API key to create, and
Cowork on the web works too. The old
[`stdio-mcp-` releases](https://github.com/aspen-crm/aspen-tools/releases?q=stdio-mcp&expanded=true)
stay up for anyone still on them, but nothing new ships there. Moving over: remove the
**Aspen Runtime MCP** extension (Claude Desktop → Settings → Extensions) and the
`aspen-cowork` plugin, then follow
[docs/installing-for-cowork.md](docs/installing-for-cowork.md).

## Claude Code plugins

Two plugins, split by the lane you are working in. **aspen-code** is the
pro-code loop, driven by the `aspen` CLI: author metadata, compile, deploy,
verify. **aspencrm-ai** is the records loop, driven by the instance's hosted
MCP: read, search, report on, update and delete live records, with no CLI at
all. They install independently, so you can take one without the other. Both
come from this repository directly rather than from a release:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen-code@aspen
/plugin install aspencrm-ai@aspen
```

| Plugin | Lane | Needs |
| --- | --- | --- |
| [aspen-code](plugins/aspen/code) | Customize an instance: read the model, author `_c` components, compile, deploy, verify. | The `aspen` CLI, which comes with Aspen Builder. |
| [aspencrm-ai](plugins/aspen/ai) | Work a live instance's records: view, search, report, create, update and delete (in bulk too), attach files, and merge duplicate contacts. | The instance's hosted MCP, above, added as a connector. |

`aspencrm-ai` teaches tools it does not carry, so it does nothing on its own —
add the connector alongside it. On Claude Code:

```
claude mcp add --transport http aspen https://<host>/<domain>/<instance>/mcp
```

then `/mcp` to sign in. If the connector is already on the claude.ai account
you sign in to Claude Code with, it is there already — don't add it twice.

**Working in Cowork rather than Claude Code?** Cowork installs a plugin by
uploading a zip, so take `aspencrm-ai` from the release instead —
[aspencrm-ai-plugin.zip](https://github.com/aspen-crm/aspen-tools/releases/download/aspencrm-ai-latest/aspencrm-ai-plugin.zip),
always the current build. Same plugin, same version; only the delivery differs.
[docs/installing-for-cowork.md](docs/installing-for-cowork.md) is the end-to-end
guide, covering the connector too.

The marketplace they come from is named `aspen`, which is what the `@aspen`
suffix refers to. Updating the marketplace picks up whatever is on the default
branch, so you do not wait for a release to get a fix.

**Setting up a machine for `aspen-code`?** [docs/start.md](docs/start.md) is a
setup guide written for Claude Code to execute. Hand it over verbatim -- a
pasted GitHub URL gets summarized on the way in, and the summary drops the
steps that matter. Paste this into Claude Code:

```
Run `curl -fsSL https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/docs/start.md` and follow the document it prints, step by step.
```

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

## Adding a tool

`docs/releasing.md` covers the layout and the tag convention. In short: a
Claude plugin goes under `plugins/aspen/<name>/` and gets listed in
`.claude-plugin/marketplace.json`; anything distributed as a binary needs only
a tag prefix and a release.
