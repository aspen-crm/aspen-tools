---
name: using-aspen
description: Use when starting any task that reads or writes a customer's Aspen CRM through the runtime MCP (the .mcpb) — viewing, searching, listing, reporting on, creating, or updating records — routes each moment to the right skill before acting. This is the Data + Describe runtime lane; there is no CLI and no metadata authoring here.
---

# Using Aspen (runtime lane)

You are working a customer's live **Aspen** CRM through the **runtime MCP** — the tools the
`aspen-runtime-mcp` server exposes, namespaced `aspen_*` (the host shows them as
`mcp__aspen-runtime-mcp__aspen_*`). There is **no CLI, no file authoring, no deploy or
promote here** — only reading and editing the signed-in user's records. Everything you can
see is already permission-scoped to that user.

## The rule

Route each moment through the right skill below **before** acting. Announce it: "Using
[skill] to [purpose]." The **instance is the single source of truth** — resolve every object
and field against `aspen_describe`, never a guessed name.

The server already orients you: read the **`aspen://objects` resource** (or call
`aspen_describe` with **no** object) for the object catalog, and the server's `initialize`
`instructions` for the namespace grammar. This plugin adds the *procedures* a server can't
carry — it has no skills or hooks of its own.

## Namespace grammar (never guess a name)

Every object and field name carries a suffix: **`_p`** platform (standard; a record id is
always **`id_p`**), **`_a`** application (installed package), **`_c`** customer (this
instance's own). So an object is `account_c` or `account_p`, never `account`; a field is
`amount_c`, never `amount`. A bare name returns `NOT_FOUND`, whose `fix_hint` self-corrects.

## Router

| Moment | Skill |
|--------|-------|
| "What objects exist? What are this object's fields / a picklist's values?" | `explore` |
| Reading records (list, get one, search, related) or writing one (create/update) + proving it | `records` |
| A natural-language question, or a group-by count/sum ("pipeline by stage") | `query-report` |

## Fan-out (subagent — parallel, read-only)

| Moment | Subagent |
|--------|----------|
| "What does our <domain> model look like?" — a read-only sweep across objects | `schema-explorer` |

## Non-negotiables

- **Describe before you read or write.** Field names come from `aspen_describe`, picklist
  values from `aspen_get_picklist`. The model is customer-authored and changes under you, so
  re-describe **fresh immediately before a write** — a cached schema is orientation, not
  validation.
- **Take the model as given — don't critique it.** A describe's fields and types (references,
  polymorphic links, picklists, system/audit fields, and all) are the customer's model; read
  them to work with their records and surface them plainly. Don't editorialize on the schema
  or flag it as odd. Judging or authoring the model is the pro-code `_c` lane, not this one.
- **Writes are confirm-gated by the server.** Show the user the exact values (create) or the
  diff (update), get an explicit **yes**, then call with `confirmed=true`. Without it the
  server refuses (`CONFIRMATION_REQUIRED`). **There is no delete tool** — records cannot be
  removed through this lane; say so rather than implying one.
- **A write is not done until you read it back.** The write tools return the re-read record;
  confirm the values landed (the evidence loop, in `records`).
- **Every result carries `app_url` — hand it over.** The server returns a deep link on every
  read and every write: the record's own page (`get`, `create`, `update`, each `search` hit)
  or the app's list view with your filters and sort already applied (`list`, `related`,
  `query`, `report`, and each report group). **End the answer with it, as a link the user can
  click.** A created record the user can't open, or a count they can't go see behind, is half
  an answer — you have the URL in the tool result, so there is never a reason to withhold it.
  It is `app_url` at the top level of every result; never invent or hand-assemble one.
- **Check `app_url_exact` before you call a link "these results".** The app's list view can't
  express every filter its own query language can. When `app_url_exact` is `false`, the link
  opens a **broader** set than the rows you just showed, and `app_url_dropped_filters` names
  the filters it couldn't carry — say so ("the link drops the *X* filter, so it shows more
  than this"). Presenting a broader link as the same result is the one way a correct answer
  still misleads.
- **Route on the error `code`, not the message.** Every error is
  `{code, message, component, fix_hint}`; read `fix_hint` — it names the fix. Codes:
  `AUTH_REQUIRED`, `INSTANCE_UNREACHABLE`, `VALIDATION_FAILED`, `PICKLIST_UNKNOWN_VALUE`,
  `CONFIRMATION_REQUIRED`, `NOT_FOUND`, `RATE_LIMITED`, `USAGE`, `BAD_RESPONSE`, `UNEXPECTED`.
- **Never handle the user's token.** The `.mcpb` holds the instance URL + API token in its
  own config; you never read, print, or set it. If a call returns `AUTH_REQUIRED`, ask the
  user to re-check the connector config — do not try to supply a credential yourself.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "I'll guess the field / object name" | It carries a namespace suffix. `aspen_describe` returns the real names in one call; a bare name is `NOT_FOUND`. |
| "I'll write straight away" | Re-describe fresh, show the values, get a yes, then `confirmed=true`. The server refuses otherwise. |
| "The write returned, so it worked" | Read it back — the write tool returns the re-read record. Confirm the values. |
| "I told them the record was created" | Without `app_url` they can't go look at it. Every result carries the link — end with it. |
| "I'll build the record's URL from the instance host" | Don't assemble a link. `app_url` is in the result; a hand-made one lands on an in-app 404. |
| "I'll delete that test record" | There is no delete tool in this lane. Neutralize by updating, or tell the user. |
| "I'll parse the error text" | Route on the `code`; read `fix_hint`. |
| "That number is 50000" | Numeric fields come back as JSON **strings** (`"50000.00"`). Parse before doing math. |
| "I'll page through all objects" | `aspen_describe` with no object caps at ~100 (`truncated` flag). Scope to the object you need. |
