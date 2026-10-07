---
name: records
description: Use when reading or writing record data on an Aspen instance through the hosted MCP — list records, get one by id, search across objects, list related records or a record's activity, create or update a record and prove it, change up to 100 records of one object in one approved request, or delete records. Drives AQL queries and the data API (POST/PATCH/DELETE /data/{object}) through execute_api_request. Writes are approved in the host; deletes are permanent.
---

# Records (read and write)

Read and write the signed-in user's records through the instance's data API. The object is
always a path segment or a `FROM` target resolved against `explore` first — a customer's `_c`
objects work exactly like the standard `_p` ones. Every record's primary key is **`id_p`**.

## Reads — AQL through `/data/query`

There is no "get record" endpoint: **every read is an AQL `SELECT`**, a `safe` operation.
The grammar is in `query-report`; the essentials:

```
POST /api/v24.3/data/query
{"query": "SELECT id_p, name_p, owner_p.username_p AS owner FROM account_p WHERE location_p LIKE 'Boston%' ORDER BY name_p, id_p LIMIT 25"}
```

- **Name the fields** from describe — there is no `SELECT *`. `LIMIT` is required, and a
  response carries **at most 100 rows** whatever the `LIMIT` says; page with `OFFSET` and an
  `ORDER BY` that ends in `id_p`.
- **One record:** `SELECT <fields> FROM <object> WHERE id_p = '<id>' LIMIT 1`.
- **Long text is cut** when selected bare. `LONGTEXT(description_p) AS description_p` returns
  it whole.
- **Labels, not names, for people:** `LABEL(stage_c) AS stage_label` gives a picklist item's
  or a lookup's display label in the same row.
- **Through a lookup:** dot-walk up to two hops — `primary_account_p.name_p AS account_name`.
  Alias every joined field; output names must be unique. A **polyid** needs the arrow form:
  `what_p->account_p.name_p AS what_name` (or just select its display field, `whatdn_p`).
- `body.data` holds the rows; `body.status: FAILURE` with an `INVALID_QUERY` failure means
  the query, not the data, was wrong — its `detail` names the bad token.

**Search** when you don't know which object a record lives on:

```
POST /api/v24.3/data/search   {"query": "Acme", "limit": 10}
```

Each hit is `{id, object, display_field}` — follow up with a `SELECT` on that object. The
`Data` tag also has per-object searches (`/data/search/account_p`, `contact_p`, `lead_p`,
`opportunity_p`, `case_p`, `team_p`); `search_api_operations` gives their bodies.

**Related records** — query the child, filtered on its field pointing at the parent:

- through a lookup: `SELECT id_p, name_p FROM opportunity_p WHERE customer_p = '<account id>' LIMIT 100`
  (the layout's related lists name the child and its field: `related-object`, `related-field`);
- through a polyid: `… FROM task_p WHERE what_p = '<id>' …` — the parent's `included-polyids`
  lists which objects can point at it this way;
- a record's **contacts**, ranked: `POST /api/v24.3/crm/contact/roles/for-record {"record_id": "<id>", "limit": 50}`;
- a record's **activity** (emails, meetings, activities, tasks), newest first:
  `POST /api/v24.3/data/activity-feed {"relationship": "what_p", "record_id": "<id>", "limit": 20}` —
  `who_p` for a person, `what_p` for a business record. The next page's `cursor` is built from
  the page you got (`search_api_operations` "activity feed" has the rule; get it right or it
  re-serves rows).
- **field history** — `POST /api/v24.3/data/audit/query {"store": "hot", "filters": {"object": "<object>", "record_id": "<id>"}}`
  — answers only for a system administrator; anyone else gets a `FAILURE`.

A parent cannot dot-walk down to its children. Query the child (or the join object) and walk up.

For counts and group-by questions use `query-report`, not a loop of reads.

## Writes — describe, show, write, read back

| Operation | Request | Body |
|---|---|---|
| create | `POST /api/v24.3/data/<object>` | `{"data": [{"name_p": "Acme", "owner_p": "<user id>"}]}` |
| update | `PATCH /api/v24.3/data/<object>` | `{"data": [{"id_p": "<id>", "stage_c": "negotiation_c"}]}` |
| delete | `DELETE /api/v24.3/data/<object>` | `{"data": [{"id_p": "<id>"}]}` |

All three are batch operations answering per row, and all are approved in the host.

1. **Describe fresh** (`explore`) immediately before writing. Confirm every field name, its
   `required` and `read-only` flags, and its `max-length`; check a picklist value against the
   picklist's item **names**. Check the layout too — *Will they see it?* below.
2. **Show the change.** Create: the object and every value. Update: the record (display value
   + `id_p`) and a diff against its current values, which you read first. Name any field the
   layout doesn't place, before the call.
3. **Write.** Every value is a JSON **string** — `"1"`, `"true"`, an id as text; `null`
   clears. Send only the fields you change on an update. When `uses-object-types` is true and
   a create is refused for `otype_p`, set it to the record type's name (from
   `/describe/identifiers/object_type_p`, or read one off an existing record).
4. **Read the result.** `body.data[0].status` is `SUCCESS`, `WARNING` (written, with
   `warnings[]` to relay), or `FAILURE` (with `failures[]`). A create returns the new `id`.
5. **Read it back.** `SELECT` the fields you wrote `WHERE id_p = '<id>'` and compare. Only
   then report it done. Numbers come back as strings (`"50000.00"`); compare parsed values.
6. **Name it.** "Created *Acme Renewal* (`renewal_c`, `id_p` `…`)". There is no link to give.

### Will they see it? Check the layout before you propose the write

| What the layout says | What you do |
|---|---|
| The field is in a detail section's `fields` | Normal. Say nothing about layouts. |
| Placed with `display-as-read-only: true` | Write it, and say it shows on the page but isn't editable there. |
| **On no layout of this object** | **Say so before the write**, in one sentence, and let the user decide. |
| Record types: placed on some types' layouts, not others | Name which types show it — the record's own type decides. |
| Layout identifiers `has_more_rows`, a resolve failed, or a custom-code section could render it | **Unknown, not missing.** Don't warn and don't claim placement. |

> `internal_notes_c` isn't on the Account layout, so the note will be stored but won't appear
> on the account page — you'd reach it from a report, a list view, or by asking me. Write it
> there anyway?

You warn; you don't block, and you don't offer to change the layout — that is the
`aspen-code` lane. A request to add related records (notes, addresses) is answered by the
related lists: no section for that child means the page has nowhere to show them. Say that
before creating them.

### Polyid, currency and file fields

- **Polyid:** set the id **and** the object-type field named by `related-object-field` (e.g.
  `whaton_p`) to one of `allowed-objects`. Never set the `related-display-field` — the
  instance maintains it. The id alone is ambiguous and fails validation.
- **Currency:** set the entered amount (`subtype: currency`) **and** its currency-code lookup.
  Never set the converted amount (`subtype: converted`); the instance computes it. Stay within
  `min-value`/`max-value`.
- **File** (`type: id`, `subtype: file`): the value is a **file id** from an upload — never a
  path, URL or name. The `files` skill uploads and sets it.

## Bulk — up to 100 records in one request

One `PATCH` (or `DELETE`) carries many rows: **one yes in the conversation, one approval in
the host.** Never loop single updates over a set you can send at once. The platform accepts
up to 500 rows a request; send **at most 100**, which keeps the request well under the 256 KB
cap and the confirmation reviewable. Past 100 rows, or for creates at scale, use `bulk-data`.

1. **Build the row set from a query, not from memory** — the user's filter gives you the
   `id_p`s and current values. Report anything the filter caught that they didn't intend.
2. **Describe fresh and check once.** Picklist values, lengths, and the layout finding are the
   same for every row, so they go in the one confirmation.
3. **Confirm in the conversation.** Every row (display value, `id_p`, the change) or — past a
   dozen — the rule, the exact count, the change and a sample. Say "this changes N records".
   Get an explicit **yes**. Then send; the host asks once more for the request.
4. **Read every row.** `body.status` is the worst outcome of any row; each `body.data[i]` has
   its own `status`. `FAILURE` beside `SUCCESS` is a **partial write** — rows are independent,
   and the accepted ones are written.
5. **Read back** with `WHERE id_p IN ('…', '…')` (chunks of 100) and confirm the values.
6. **Report honestly:** "Updated 38 of 40. Two refused: `<id>` — <detail>; `<id>` — <detail>."
   Fix the refused rows and retry **only those**, with a fresh confirmation. Never resend rows
   that landed.

A request-level `body.failures` (no `data`) refused the whole batch before any row was
touched — read it, fix, resend.

## Delete — permanent, so confirm it in words

`DELETE /data/<object>` is a **hard delete: no undo, no recycle bin.** Before proposing one:

- **Check the object's `deletable`.** `false` means the instance refuses; say so.
- **Look for children.** A child lookup with `deletion-strategy: block` makes the parent
  refuse to go; `cascade` deletes the children with it; `set_to_null` clears their reference.
  The layout's related lists and the object's `included-polyids` name the likely children —
  `ROWCOUNT` them and tell the user what goes with the record.
- **Offer the alternative when it fits** — a status or "inactive" field the user could set
  instead keeps the history. The user decides.
- **Get an explicit yes** naming each record (display value + `id_p`), or for many the rule,
  count and sample, and that it **cannot be undone**. Then send; the host asks once more.
- **Prove it:** `ROWCOUNT FROM <object> WHERE id_p IN ('…')` is 0, and report any row refused.

Delete children before parents, and break a reference cycle first (clear the lookup on one
side). Contacts are never "merged" by deleting one — that is `contact-merge`.

## Errors — route on `error_type`, read `detail`

| What comes back | Meaning / do |
|---|---|
| `INVALID_QUERY` (`context.code` `UNKNOWN_FIELD`) | A field or object name is wrong — usually a missing suffix. Describe; don't guess again. |
| `INVALID_DATA` on a row | The value was refused: type, length, required, read-only, picklist, a bad id. `detail` and `context.field_name` name it. Fix that field, re-describe, retry that row. |
| "invalid type: integer/boolean, expected a string" | A value wasn't a string. Send `"1"`, `"true"`. |
| `TOO_MANY_RECORDS` | The batch is too big. Split it. |
| `AUTHORIZATION_FAILURE` | The user may not do that to this object, record or field. Say so; there is nothing to retry. |
| HTTP 401, `INVALID_SESSION_ID`, `INVALID_CREDENTIALS` | The session expired. The user reconnects the connector (`using-aspencrm-ai`). |
| An approval was declined | The user said no. Ask what to change; don't resend. |
| HTTP 429, a 5xx, `UNEXPECTED_ERROR`, `EXCEPTION` | Wait briefly, retry once, then report it with the `request_id`. |
| A tool error that the path is not served | Wrong path or method. Check `summarize_api`. |
