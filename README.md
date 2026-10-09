# Aspen Tools

Connecting Claude and Cowork to an [Aspen](https://github.com/aspen-crm) CRM: the instance's
hosted MCP connector, and the plugin that teaches Claude to use it well. Published here so it
can be handed to anyone.

Building on the platform with the `aspen` CLI — authoring metadata, compiling, deploying — is
a separate lane and lives in [aspen-crm/aspen-code](https://github.com/aspen-crm/aspen-code).
Nothing here needs the CLI.

## Aspen CRM AI — the hosted MCP

Every Aspen instance serves its own MCP server, so Claude can work the instance's records —
view, search, report, create, update in bulk, delete, attach files, merge duplicate contacts
— over the instance's own API, signed in as the user. There is nothing to download for it:
add the instance's URL with `/mcp` on the end as a connector, and sign in.

```
https://<host>/<domain>/<instance>/mcp
```

It works in Claude and Cowork on the desktop and on the web, and in Claude Code. The server
carries the tools; the `aspencrm-ai` plugin below carries the procedures for using them well.
Take both.

**Setting someone up?** Have them paste this into a Claude or Cowork conversation:

```text
Read https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/docs/installing-for-cowork.md in full and help me install it, one step at a time. My Aspen instance URL is <your instance URL>.
```

Claude works the steps with them, one at a time.
**[docs/mcp-quickstart.md](docs/mcp-quickstart.md) is the page to hand a customer** who would
rather read it themselves — the connector URL, each client, the plugin, and a check that it
worked.

**The Aspen Runtime MCP (`.mcpb`) is retired**, and so is the `aspen-cowork` plugin that
taught it. The hosted server replaces both: no bundle to install, no API key to create, and
Cowork on the web works too. The old
[`stdio-mcp-` releases](https://github.com/aspen-crm/aspen-tools/releases?q=stdio-mcp&expanded=true)
stay up for anyone still on them, but nothing new ships there. Moving over: remove the
**Aspen Runtime MCP** extension (Claude Desktop -> Settings -> Extensions) and the
`aspen-cowork` plugin, then follow
[docs/installing-for-cowork.md](docs/installing-for-cowork.md).

## The plugin

`aspencrm-ai` teaches the tools it does not carry, so it does nothing on its own — add the
connector alongside it.

| Host | How |
|---|---|
| Claude Code | `/plugin marketplace add aspen-crm/aspen-tools` then `/plugin install aspencrm-ai@aspen` |
| Cowork | **Customize -> Plugins**, upload [aspencrm-ai-plugin.zip](https://github.com/aspen-crm/aspen-tools/releases/download/aspencrm-ai-latest/aspencrm-ai-plugin.zip) |

Cowork installs a plugin by uploading a zip, which is the only difference — same plugin, same
version. The marketplace is named `aspen`, which is what the `@aspen` suffix refers to.
Updating it picks up whatever is on the default branch, so you do not wait for a release to
get a fix.

## Releasing

`docs/releasing.md` covers the layout and the tag convention.
