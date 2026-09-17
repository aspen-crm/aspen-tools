# Aspen Cowork — Claude Code plugin

The **agent-knowledge layer for the Aspen runtime lane** — the skills and read-only explorer
that pair with the `aspen-runtime-mcp` server (the `.mcpb`). The server carries the raw
Data + Describe tools and its own orientation; a server has no skills, subagents, or hooks,
so this plugin adds the *procedures*: how to explore the model, run the read/write evidence
loop, and route the runtime error codes.

Runtime lane only — **no CLI, no metadata authoring, no deploy/promote**. For the `_c`
pro-code loop (author → validate → deploy → verify), that is the sibling
[aspen-code](../code) plugin.

## Install

Two pieces: the runtime MCP (the tools) and this plugin (the knowledge). Neither works
alone — the plugin teaches tools it does not carry. How the server gets there depends on
the host.

### Claude Code

The plugin carries the server's wiring — `.mcp.json` runs `bin/aspen-runtime-mcp.sh` as
the server — but not the server itself. Claude Code cannot install an `.mcpb`, so a
one-line installer unpacks the same bundle to a fixed place instead.

1. **This plugin.**

   ```
   /plugin marketplace add aspen-crm/aspen-tools
   /plugin install aspen-cowork@aspen
   ```

2. **The server** (macOS and Linux):

   ```
   curl -fsSL https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/plugins/aspen/cowork/bin/install-runtime-mcp.sh | sh -s -- --instance https://<host>/<domain>/<instance>
   ```

   It downloads the current bundle for the machine, puts the server at
   `~/.config/aspen/mcp/aspen-runtime-mcp` — honouring `ASPEN_CONFIG_DIR` and
   `XDG_CONFIG_HOME` the way the `aspen` CLI does — and records the instance URL beside it
   in `env`, mode 600. `--version X.Y.Z` pins a release; `--file some.mcpb` installs a
   bundle already downloaded. Run it again to upgrade.

3. **The token.** The installer never asks for it. One of:

   - `aspen login --instance <URL>`, once. The server reuses the CLI's stored login, and
     then `--instance` above was optional too.
   - `export ASPEN_API_TOKEN=…` (and `ASPEN_INSTANCE`) in the shell you start Claude Code
     from.
   - A line `ASPEN_API_TOKEN='secret-token:aspen_…'` in `~/.config/aspen/mcp/env`.

   Shell values win over the file, and an empty value counts as unset — a stray
   `export ASPEN_API_TOKEN=` does not block the CLI-login fallback.

Then start a new session. `/mcp` lists the server as **`aspen-runtime-mcp`** under this
plugin; if it shows as failed, the server is not installed, and the launcher's message
names the installer. A build of your own can stand in for the installed one:
`export ASPEN_RUNTIME_MCP=/path/to/aspen-runtime-mcp`.

Registered the server by hand before this plugin carried it (`claude mcp add …`)? Remove
that entry, or every tool appears twice.

**Windows.** The launcher is a shell script, so the plugin's server entry fails there.
Take `server\aspen-runtime-mcp.exe` out of the
[Windows bundle](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-windows.mcpb)
(it is a zip) and register it directly:
`claude mcp add --scope user aspen-runtime-mcp -- C:\path\to\aspen-runtime-mcp.exe --stdio`.

**Without this plugin** the installed server registers the same way:
`claude mcp add --scope user aspen-runtime-mcp -- ~/.config/aspen/mcp/aspen-runtime-mcp --stdio`,
plus `-e ASPEN_INSTANCE=…` unless the CLI is logged in. Only the launcher reads the `env`
file.

### Claude Desktop and Cowork

1. **The server.** Download the bundle for your machine and open it — double-click, or
   Settings → Extensions. It asks for the instance base URL and the API token; the token
   goes into Desktop's secret store and is typed nowhere else. These links always give you
   the current version:

   | Platform | Download |
   | --- | --- |
   | macOS | [aspen-runtime-mcp-macos.mcpb](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-macos.mcpb) |
   | Windows | [aspen-runtime-mcp-windows.mcpb](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-windows.mcpb) |

   Cowork on the desktop bridges to whatever Desktop has installed, so this is the Cowork
   route too.

2. **This plugin.** Cowork takes it as a zip rather than from the marketplace —
   [docs/installing-for-cowork.md](../../../docs/installing-for-cowork.md) is the
   end-to-end guide. That zip leaves out `.mcp.json` and `bin/`: there the server is
   Desktop's extension, and a second, launcher-driven copy would fail to start or double
   every tool.

The server registers under the name **`aspen-runtime-mcp`** everywhere; the host puts its
own prefix in front of the tools (`mcp__aspen-runtime-mcp__aspen_*` in Claude Desktop,
`mcp__plugin_aspen-cowork_aspen-runtime-mcp__aspen_*` in Claude Code).

## What's inside

**Skills** (procedures, routed by `using-aspen-cowork`):

| Skill | What it does |
| --- | --- |
| `using-aspen-cowork` | The router: maps each moment of the runtime loop to a skill; carries the namespace grammar and the non-negotiables. |
| `explore` | `aspen_describe` (object catalog + tab collections → per-object fields plus the object's list views/tabs/layouts) and `aspen_get_picklist`; the "never guess a name" read path. |
| `records` | Reads (`list`/`get`/`search`/`related`) and confirm-gated writes (`create`/`update`) with the read-back evidence loop, the record/list `app_url` handoff, and error-code routing. No delete. |
| `query-report` | `aspen_query` (natural-language → plan, server-side) and `aspen_report` (group-by count/sum), under the read caps. |
| `files` | Upload a file from the computer running the server and attach it to a record's file field (`type: id`, `subtype: file`) with `aspen_files_upload` — the confirm → upload → read-back loop, and the one host difference: in Cowork the path is the file's path on the user's computer, not the sandbox's. Never the app's upload form. |
| `contact-merge` | Merge a duplicate `contact_p` into a survivor, or unmerge one, through the platform's merge/unmerge endpoints — which the runtime MCP does not wrap and the records tools cannot reach (`merged_into_p` and `contact_merge_p` reject direct writes). A bundled Node helper makes the call and resolves the login the way the launcher does, so Claude never holds the token. One pair per call, contacts only. Claude Code only: it needs a shell. |

The router is `using-aspen-cowork`, not `using-aspen`, because the sibling
[aspen-code](../code) plugin ships a router by that name for the CLI lane. The two route to
opposite answers -- one to `aspen` CLI verbs, one to `aspen_*` MCP tools -- so with both
plugins installed, one name for both would be a coin flip on which lane you land in.

**Subagent** (fan-out / read-only):

| Agent | What it does |
| --- | --- |
| `schema-explorer` | A read-only sweep over the Describe/query tools → a compact map, not dumps. |

It deliberately carries **no `tools:` allowlist**. The host-assigned `mcp__…` prefix is not
predictable (`mcp__aspen-runtime-mcp__*` on one host, `mcp__remote-devices__Aspen_Runtime_MCP__*`
on another) and the field matches exact names only, so a hardcoded grant would silently drop
every CRM tool. Read-only is held by the subagent's prose and the server's confirm-gate.

## Hookless by design

The sibling `aspen-code` plugin uses `PreToolUse` hooks to make confirm-before-write a
property of the system. The runtime lane does not need them, and shipping one would be worse
than shipping none:

- **Writes are confirm-gated in the server.** `aspen_records_create/update` and
  `aspen_files_upload` reject a call without `confirmed=true`, checked before any network
  call — the gate belongs to the server, not to the host remembering to ask.
- **Tools are annotated.** Reads are `readOnlyHint:true`, the three writes `readOnlyHint:false`
  (update also `destructiveHint:true`), so a host that honors hints auto-approves reads and
  prompts on writes on its own.
- **There is no CLI, no credential handling and no destructive recovery verb here** — the
  surfaces `aspen-code`'s hooks guard do not exist in this lane.

A hook would duplicate the server's gate and fail closed on hosts that do not run plugin
hooks. If a real gap appears, guard it in the server.

## The tool surface it teaches

Eleven tools, namespaced `aspen_*` — reads: `describe`, `get_picklist`, `list`, `get`, `search`,
`related`, `report`, `query`; writes: `records_create`, `records_update`, `files_upload`
(confirm-gated, no delete; `files_upload` needs runtime MCP 0.1.17 or later). The object is
always a parameter, resolved against Describe, so a customer's `_c` objects work exactly like
the standard `_p` ones.

The server is the authority on both the tool names and the error codes. A skill may only name
a tool that exists and route on a code that exists; when the server changes, the skills follow
it, never the other way round.

## Layout

```
.claude-plugin/plugin.json           # plugin manifest (name: aspen-cowork)
.mcp.json                            # Claude Code only: runs bin/aspen-runtime-mcp.sh as the server
bin/aspen-runtime-mcp.sh             # launcher: finds the installed server, settles identity, execs it
bin/install-runtime-mcp.sh           # unpacks the .mcpb into ~/.config/aspen/mcp for Claude Code
skills/using-aspen-cowork/SKILL.md   # the router: namespace grammar, non-negotiables, routes
skills/explore/SKILL.md              # describe the model; never guess a name
skills/records/SKILL.md              # reads + confirm-gated writes + the evidence loop
skills/query-report/SKILL.md         # natural-language query and group-by report
skills/files/SKILL.md                # upload a file and attach it to a record's file field
skills/contact-merge/SKILL.md        # merge / unmerge duplicate contacts via the platform endpoints
skills/contact-merge/scripts/contact-merge.mjs  # the helper: resolves the login, posts one pair, prints JSON
agents/schema-explorer.md            # read-only sweep -> a compact map
test/runtime-mcp.test.mjs            # launcher + installer, end to end on a fake bundle
test/contact-merge.test.mjs          # the merge helper, against a scratch config and a stub instance
```

No `hooks/` directory, on purpose — see above. `.mcp.json` and `bin/` are not in the
Cowork zip — see Install.
