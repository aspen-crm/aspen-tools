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

Two pieces: the runtime MCP `.mcpb` (the tools) and this plugin (the knowledge). Neither
works alone — the plugin teaches tools it does not carry.

1. **The server.** Download the bundle for your machine. These links always give you the
   current version:

   | Platform | Download |
   | --- | --- |
   | macOS | [aspen-runtime-mcp-macos.mcpb](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-macos.mcpb) |
   | Windows | [aspen-runtime-mcp-windows.mcpb](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-windows.mcpb) |

   Install it in your host — Claude Desktop / Cowork: double-click, or Settings →
   Extensions — then enter your instance base URL and API token when prompted. You never
   type the token anywhere else; the bundle holds it in its own config.

2. **This plugin.**

   ```
   /plugin marketplace add aspen-crm/aspen-tools
   /plugin install aspen-cowork@aspen
   ```

The server registers under the name **`aspen-runtime-mcp`**, so its tools appear to the host
as `mcp__aspen-runtime-mcp__aspen_*`.

## What's inside

**Skills** (procedures, routed by `using-aspen-cowork`):

| Skill | What it does |
| --- | --- |
| `using-aspen-cowork` | The router: maps each moment of the runtime loop to a skill; carries the namespace grammar and the non-negotiables. |
| `explore` | `aspen_describe` (object catalog + tab collections → per-object fields plus the object's list views/tabs/layouts) and `aspen_get_picklist`; the "never guess a name" read path. |
| `records` | Reads (`list`/`get`/`search`/`related`) and confirm-gated writes (`create`/`update`) with the read-back evidence loop, the record/list `app_url` handoff, and error-code routing. No delete. |
| `query-report` | `aspen_query` (natural-language → plan, server-side) and `aspen_report` (group-by count/sum), under the read caps. |

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

- **Writes are confirm-gated in the server.** `aspen_records_create/update` reject a call
  without `confirmed=true`, checked before any network call — the gate belongs to the server,
  not to the host remembering to ask.
- **Tools are annotated.** Reads are `readOnlyHint:true`, the two writes `readOnlyHint:false`
  (update also `destructiveHint:true`), so a host that honors hints auto-approves reads and
  prompts on writes on its own.
- **There is no CLI, no credential handling and no destructive recovery verb here** — the
  surfaces `aspen-code`'s hooks guard do not exist in this lane.

A hook would duplicate the server's gate and fail closed on hosts that do not run plugin
hooks. If a real gap appears, guard it in the server.

## The tool surface it teaches

Ten tools, namespaced `aspen_*` — reads: `describe`, `get_picklist`, `list`, `get`, `search`,
`related`, `report`, `query`; writes: `records_create`, `records_update` (confirm-gated, no
delete). The object is always a parameter, resolved against Describe, so a customer's `_c`
objects work exactly like the standard `_p` ones.

The server is the authority on both the tool names and the error codes. A skill may only name
a tool that exists and route on a code that exists; when the server changes, the skills follow
it, never the other way round.

## Layout

```
.claude-plugin/plugin.json           # plugin manifest (name: aspen-cowork)
skills/using-aspen-cowork/SKILL.md   # the router: namespace grammar, non-negotiables, routes
skills/explore/SKILL.md              # describe the model; never guess a name
skills/records/SKILL.md              # reads + confirm-gated writes + the evidence loop
skills/query-report/SKILL.md         # natural-language query and group-by report
agents/schema-explorer.md            # read-only sweep -> a compact map
```

No `hooks/` directory, on purpose — see above.
