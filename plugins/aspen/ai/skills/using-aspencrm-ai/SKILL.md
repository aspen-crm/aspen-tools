---
name: using-aspencrm-ai
description: Use when starting any task that reads or writes a customer's Aspen CRM through the instance's hosted MCP (tools summarize_api, search_api_operations, execute_api_request) — viewing, searching, reporting on, creating, updating, bulk-updating or deleting records, attaching files, merging contacts. Routes each moment to the right skill and carries the platform grammar the server does not send. No metadata authoring or deployment.
---

# Using Aspen CRM (hosted MCP)

You are working a customer's live **Aspen** CRM through the instance's **hosted MCP server**.
It exposes three tools; the host puts its own prefix in front of them:

| Tool | What it gives you |
|---|---|
| `summarize_api` | Every REST operation the server will run, by tag (`CRM`, `Data`, `Describe`), each with `safe: true/false`. Start here when you need a path. |
| `search_api_operations` | The operations matching plain words (`"update records"`), best first, plus one OpenAPI document defining exactly those — their request body schemas. `tag` narrows it. |
| `execute_api_request` | Runs **one** operation as the signed-in user. |

Everything you can see is already permission-scoped to that user. There is **no metadata
authoring, deploy or promote here** — changing the model is the `aspen-code` plugin's lane.

## The rule

Route each moment through the right skill below **before** acting, and announce it: "Using
[skill] to [purpose]." The **instance is the single source of truth**: every object, field and
picklist value comes from a describe call, never from a guess.

## Calling `execute_api_request`

```
execute_api_request  method="POST"  path="/api/v24.3/data/query"
                     body={"query": "SELECT id_p, name_p FROM account_p ORDER BY name_p LIMIT 10"}
```

- `path` is concrete and starts at the API root. `/api/v24.3` is the root these skills use;
  if the instance refuses a path, take the root from `summarize_api` and use that.
- `body` is a JSON value for a JSON operation, a string for `text/*`, and a base64 string for
  anything binary (the `files` skill). `content_type` defaults to JSON.
- `headers` carries only header parameters the operation declares (`Aspen-Filename` on an
  upload). `query` carries query-string parameters.
- **Unsure of a body?** `search_api_operations` and read its schema. Request bodies are
  `additionalProperties: false` throughout, so an invented key is a rejection, not a no-op.

**The result** is `{status, request_id, headers, body, truncated}`:

- `status` is the HTTP status. **A 200 can still be a failure** — the platform answers most
  rejections with HTTP 200 and `body.status: "FAILURE"`. Read `body.status` (`SUCCESS`,
  `WARNING`, `FAILURE`, `EXCEPTION`) every time; a query with a misspelled field "returns" a
  200 with no rows if you only look at `status`.
- A failure carries `body.failures[]`, each `{error_type, subtype, detail, display_detail,
  context}`. `detail` usually names the fix ("Select merge_source_p itself"); `context` names
  the clause and token for a query.
- A batch write (create, update, delete) answers **per row** in `body.data[]` — each
  `{id, status, failures?, warnings?}`. Rows are independent; see `records`.
- `truncated: true` means the body was cut at 64 KB. **Never treat a truncated body as the
  whole answer** — select fewer fields, lower the `LIMIT`, or describe one object at a time.
- `request_id` is the platform's trace id. Quote it when you report a platform-side error.

A request is capped at **256 KB** in all, body included. That bounds a batch and an upload.

## Platform grammar — the server sends none of this

- **Namespaces.** Every object and field name carries a suffix: `_p` platform (a record id is
  always **`id_p`**), `_c` this customer's own. `account_p`, never `account`; `amount_c`, never
  `amount`. A bare name fails as an unknown field.
- **Write values are JSON strings.** In a create/update body every field value is a string —
  `"1"` not `1`, `"true"` not `true`, an id as its text. A JSON number or boolean is refused
  ("invalid type: integer, expected a string"). `null` clears a field.
- **AQL literals are the other way round.** In a `WHERE` clause, checkbox, number, percentage
  and currency values are **unquoted** (`is_active_c = true`, `amount_c > 500`); everything
  else is quoted. The `query-report` skill has the grammar.
- **Reads come back as strings.** `"50000.00"`, `"true"`. Parse before you do arithmetic.
- **Picklist values are item names** (`usd_p`, `closed_won_c`); show the user the item's
  **label** from the picklist describe, never a name you prettified yourself.
- **Constraints are metadata, never a value.** A field's length (`max-length`), type,
  required flag, uniqueness and picklist come from its describe — a 4-character value in a
  128-character field is not a 4-character field.
- **Polyids and currency write as a set** — `records` has the rule.

## Writes are approved in the host

Every operation `summarize_api` marks `safe: false` — create, update, delete, upload, merge,
unmerge — is **approved by the user in the host** before the server runs it. The approval
prompt shows the method, the path and the first 2 KB of the body; it is bound to that exact
request and lapses after 10 minutes. A changed request is a new request and needs its own.

- **One record** (create or update): say plainly what will change — the values, or the diff
  against the current record, and any layout caveat (`records`) — then make the call. The
  approval prompt is the user's yes.
- **Several records in one request, any delete, a merge or an unmerge:** get an explicit
  **yes in the conversation first**, then send. The prompt previews only 2 KB, so it cannot
  show a batch, and a delete cannot be undone. Each request is still approved in the host.
- **A declined approval is a no.** Don't resend it, and don't reshape the request to get it
  through. Ask what they want changed.
- **"…needs the user's approval, which this client cannot collect"** means this host cannot
  show approval prompts. Reads still work; writes cannot happen from here. Say so plainly and
  stop — there is no flag that skips approval.
- **A write is not done until you read it back** with a query (`records`).

## There are no app links

The hosted server returns no deep links into the app. **Never build one from a host name** —
a hand-made path lands on an in-app 404. Name what you touched so the user can find it: the
object's label, the record's display value and its `id_p`.

## Identity — never handle a credential

The connector signs in as the user through the instance's own OAuth. You never see, ask for
or accept a token or API key; refuse one if offered. When the instance stops accepting the
session (HTTP 401, or `error_type` `INVALID_SESSION_ID` / `INVALID_CREDENTIALS`), the user
reconnects the connector — in Claude or Cowork, **Settings → Connectors**, the Aspen
connector, **Connect**; in Claude Code, `/mcp`; in Codex, `codex mcp login <server name>`.
`AUTHORIZATION_FAILURE` is different: they are signed in but not permitted to do that.

**No `execute_api_request` in your tool list** means the connector is not added or not
enabled in this host. The setup guide is
https://github.com/aspen-crm/aspen-tools/blob/main/docs/installing-for-cowork.md — and a new
conversation is needed after adding it, because a conversation's tools are fixed at its start.

## Router

| Moment | Skill |
|--------|-------|
| "What objects exist? What are this object's fields, layouts, list views? A picklist's values?" | `explore` |
| Reading records (list, get one, search, related, a record's activity) or writing one + proving it | `records` |
| The same change across up to 100 records, or deleting a few | `records` (bulk) |
| A question about records: a filtered list, a count, a group-by sum ("pipeline by stage") | `query-report` |
| Merging duplicate contacts, finding duplicates, or unmerging (contacts only) | `contact-merge` |
| Uploading or attaching a file to a record, or reading one back | `files` |
| More than 100 rows, creating many records, a delete across many, or a load from a file | `bulk-data` |
| "What does our <domain> model look like?" — a read-only sweep across objects | `schema-explorer` |

## Non-negotiables

- **Describe before you read or write**, and describe **fresh immediately before a write** —
  the model is customer-authored and changes under you.
- **Take the model as given — don't critique it.** Its fields, types and oddities are the
  customer's; relay them. Judging or changing the model is the `aspen-code` lane.
- **Route on `body.status` and `error_type`, not on prose.** Read `detail` for the fix.
- **A merge is not a records write.** `merged_into_p` and `contact_merge_p` reject direct
  writes; `contact-merge` uses the merge endpoints.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "I'll guess the field name" | It carries a suffix. Describe returns the real names in one call. |
| "HTTP 200, so it worked" | Read `body.status`. Most rejections are HTTP 200 with `FAILURE`. |
| "The query came back empty, so there are none" | Check `body.status` first — a bad field name is a `FAILURE`, not zero rows. |
| "I'll send `1` / `true` in the body" | Strings: `"1"`, `"true"`. And unquoted in a `WHERE` clause. |
| "The user declined, I'll try a smaller version" | A declined approval is a no. Ask. |
| "40 records — I'll call update 40 times" | One `PATCH` of up to 100 rows, one yes in the conversation, one approval. `records`. |
| "I'll delete it to clean up" | Hard delete, no undo. Explicit yes first; prefer an update that neutralises it. |
| "I'll link them to the record" | There are no links. Name the record and its `id_p`. |
| "Paste your API key and I'll fix the connection" | Never. The user reconnects the connector. |
| "`truncated: true`, but the rows I got look fine" | They're a fragment. Narrow and re-ask. |
