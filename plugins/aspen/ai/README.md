# Aspen CRM AI

The **agent-knowledge layer for an Aspen instance's hosted MCP server**: the skills that
teach Claude (and Codex) to work a live CRM well through it. The server carries three
generic tools over the instance's REST API — `summarize_api`, `search_api_operations`,
`execute_api_request` — and sends no orientation of its own. This plugin adds the rest: the
namespace grammar, AQL, the describe-before-write and read-back loop, layout visibility,
bulk and delete procedures, files and contact merges.

Records lane only — **no metadata authoring, no deploy**. Changing the model is the sibling
[aspen-code](../code) plugin.

It replaces `aspen-cowork` and the runtime MCP (`.mcpb`), both retired.

## Install

Two pieces: the **connector** (the instance's hosted MCP server, signed in as you) and **this
plugin** (the know-how). The plugin carries no server wiring — the server's address is
different for every instance — so each host adds the connector once, by URL:

```
https://<host>/<domain>/<instance>/mcp
```

That is the instance URL you use day to day, with `/mcp` on the end. Signing in is the
instance's own OAuth; there is no API key to create or paste.

| Host | Connector | Plugin |
|---|---|---|
| Claude and Cowork (desktop or web) | **Settings → Connectors → Add custom connector**, paste the URL, **Connect**, sign in to Aspen | Cowork: **Customize → Plugins → Upload**, the [plugin zip](https://github.com/aspen-crm/aspen-tools/releases/download/aspencrm-ai-latest/aspencrm-ai-plugin.zip) |
| Claude Code | `claude mcp add --transport http aspen <URL>`, then `/mcp` to sign in — or nothing, if the connector is already on the claude.ai account you sign in with | `/plugin marketplace add aspen-crm/aspen-tools`, then `/plugin install aspencrm-ai@aspen` |
| Codex | `codex mcp add aspen --url <URL>`, then `codex mcp login aspen` | `codex plugin marketplace add aspen-crm/aspen-tools`, then `codex plugin add aspencrm-ai@aspen` |

[docs/installing-for-cowork.md](../../../docs/installing-for-cowork.md) is the end-to-end
guide for Claude and Cowork users; [docs/installing-for-codex.md](../../../docs/installing-for-codex.md)
for Codex.

Start a new conversation after adding either piece: a conversation's tools and skills are
fixed when it starts.

**What the client must support.** The server speaks MCP protocol revision 2026-07-28 and
refuses older handshakes, and it collects approval for every write through an MCP
elicitation. A client without elicitation can read but not write; the skills say so when it
happens.

## What's inside

| Skill | What it does |
|---|---|
| `using-aspencrm-ai` | The router, plus what the server doesn't send: how to call and read `execute_api_request`, the namespace grammar, string values, how approvals work, identity. |
| `explore` | The Describe API: the object catalog, an object's fields and constraints, record types, layouts (which fields the page shows), list views, tabs, picklists, `describe/me`. |
| `records` | Reads as AQL (list, get, search, related, activity, history) and writes through `/data/{object}` — create, update, bulk update up to 100 rows, delete — with the describe → show → write → read-back loop and the layout-visibility check. |
| `query-report` | AQL by hand: filters, joins, `ROWCOUNT`, `GROUP BY`/`HAVING` aggregates, paging. |
| `files` | Upload a small file (`/data/files`), set a record's file field, read a file back; `attachment_p` for records with no file field. |
| `contact-merge` | Find duplicates and merge or unmerge `contact_p` pairs through the platform's endpoints. |
| `bulk-data` | Jobs past one request: more than 100 rows, creates at scale, deletes across a set, file-driven loads — in approved chunks, verified. |
| `schema-explorer` | A read-only sweep across many objects that returns a compact map. Also shipped as a subagent for Claude hosts. |

## Design notes

- **The server is the gate.** Every operation the server marks unsafe is approved by the
  user in the host before it runs, bound to that exact request. The skills add a
  conversational yes for anything a 2 KB approval preview can't show — a batch, a delete, a
  merge — and never a way around a declined approval.
- **Bulk updates and deletes are in.** One request takes up to 100 rows with one approval;
  `bulk-data` chunks larger jobs. Deletes are permanent and always confirmed in words first.
- **No links.** The hosted server returns no deep links into the app, and a hand-built URL
  lands on an in-app 404, so the skills name records (label, display value, `id_p`) instead.
- **No hooks, no scripts, no server wiring.** Approval lives in the server, credentials live
  in the host's connector, and every operation goes through the one tool — there is nothing
  for a hook or a helper to guard or carry.
- **The server's version is the instance's.** The operations come from the platform build each
  instance runs, not from a release here. The skills read `summarize_api` and
  `search_api_operations` when a path or body is in doubt, rather than trusting a copy.

## Layout

```
.claude-plugin/plugin.json        # Claude manifest (name: aspencrm-ai)
.codex-plugin/plugin.json         # Codex manifest — skills only
agents/schema-explorer.md         # subagent wrapper for Claude hosts
skills/<name>/SKILL.md            # the eight skills above
test/                             # manifest limits, packaging, and the skills' API paths
```
