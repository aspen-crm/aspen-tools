---
name: bulk-data
description: Use for a data job on an Aspen instance bigger than one request — more than 100 rows, creating many records, deleting many, a mass update or backfill, clearing or re-pointing a field across a set, removing test or seed data, or a load/import driven from a CSV, spreadsheet or JSON file. Plans the job, sends it through execute_api_request in approved chunks of up to 100 rows, and verifies it. Also the reference for paging and the type quirks that silently break a load.
---

# Bulk data

For jobs one request cannot carry. Up to 100 rows of one object is a single request — use
`records`. Come here when the job is bigger, creates at scale, deletes across a set, or is
driven from a file.

Every write goes through `execute_api_request` — create `POST`, update `PATCH`, delete
`DELETE` on `/api/v24.3/data/<object>` with `{"data": [ … ]}` — in **chunks of at most 100
rows**. The platform accepts 500 a request, but 100 keeps each request under the 256 KB cap
and small enough to review. **Each chunk is one approval in the host.**

## Say the cost up front

Every row you write passes through your own tool calls, and every chunk waits for the user to
approve it. A 300-row update is 3 requests and 3 approvals; 5,000 rows is 50. Tell the user
the row count, the number of chunks and approvals, and roughly what it involves **before**
starting — and for a very large load, ask whether they would rather use the app's own tools.

## The loop

1. **Describe first** (`explore`) — field names, types, required and read-only flags,
   `max-length`, picklist item names, and the layout. A field no layout places stores fine and
   is invisible on every record page in the load: say so **once**, in the plan.
2. **Count, then read.** `ROWCOUNT FROM <object> WHERE …` on `/data/count` sizes the job
   before anything is fetched. Read the rows you need with `SELECT … ORDER BY id_p LIMIT 100
   OFFSET n`, page by page; a response never holds more than 100 rows.
3. **Build the rows.** Updates and deletes need `id_p` on every row; deletes carry **only**
   `id_p`. For a file-driven load, read and transform the file with code where your host has
   a shell or sandbox — map its columns to API names from describe, turn picklist labels into
   item **names**, and turn every value into a **string**. Keep the mapping where the user can
   see it.
4. **Plan, show, confirm once.** Counts, the mapping, a sample of rows, the number of chunks,
   and anything surprising the filter caught. For a delete: that it is permanent, and what goes
   with the records (children with `deletion-strategy: cascade`, refusals from `block`). Get
   an explicit **yes** for the job.
5. **Send chunk by chunk.** After each, read `body.data[i].status` for every row and keep a
   tally of successes and failures with their `detail`. A partial chunk is normal — rows are
   independent. **Stop on a request-level failure** (no `data`), an auth error, or a declined
   approval, and report where you are: which chunks landed and which didn't.
6. **Verify.** Re-query what you wrote (`WHERE id_p IN (…)` in chunks of 100, or a `ROWCOUNT`
   of the target state) and check the values landed. A `SUCCESS` status is not proof.
7. **Report:** rows written, rows refused with reasons, and what is left. Retry only refused
   rows, after fixing them, with a fresh confirmation.

## Ordering, when one job has several steps

Do the step that triggers platform recalculation **first**, then re-read, then fix what is
left. Triggers maintain derived rows — setting `contact_p.owner_p` maintains
`contact_owner_p`/`contact_rel_p`, and an address write repoints `account_p.location_p` — so a
batch built from a snapshot taken before the first step will fight them.

Delete **children before parents**, and break reference cycles first (clear the lookup on one
side). `deletion-strategy` on the child's lookup decides: `block` refuses the parent's delete,
`cascade` takes the child with it, `set_to_null` clears the reference.

## The quirks that silently break a load

| Symptom | Cause |
|---|---|
| `invalid type: boolean/integer, expected a string` | **Body values are strings**: `"true"`, `"1"`. In an AQL `WHERE` it's the opposite — checkbox and number unquoted. |
| A query "finds nothing" that plainly exists | A bad field name is a **`FAILURE` under HTTP 200**. Read `body.status`. `user_p`, for one, has no `name_p` — it has `username_p`, `first_name_p`, `last_name_p`. |
| Only 100 rows came back | 100 per response whatever `LIMIT` says. Page with `OFFSET` over an `ORDER BY … id_p`. |
| Totals are off | Numbers and checkboxes are strings (`"50000.00"`, `"true"`). Parse first. |
| A create is refused for `otype_p` | The object uses record types. Set `otype_p` to a type's name — `/describe/identifiers/object_type_p`, or read one off an existing record. |
| A `LIKE` filter is refused | Trailing wildcard only. |
| A polyid or currency write doesn't stick | Both are sets: polyid id **and** its object-type field; currency amount **and** its code — never the converted amount. |
| A picklist value is refused | The body takes the item **name** (`closed_won_c`), not the label the spreadsheet shows. |
| The request is refused as too large | Fewer rows per chunk. Long text and wide rows reach 256 KB before 100 rows do. |

## Non-negotiables

- **Delete is a hard delete with no undo.** No recycle bin. Prefer neutralising a record with
  an update where that serves; when a delete is wanted, say it is permanent, get an explicit
  yes, and on a shared instance say that too.
- **Scope every filter to what you mean.** A bulk write is only as good as its `WHERE`. Filter
  on the owner or the exact key, and show anything the filter caught that you didn't intend.
- **Never re-send rows that landed.** A retry is only the refused rows.
- **A declined approval stops the job.** Report how far it got; don't route around it.
- **Never handle a credential.** The connector holds the session; on an auth failure the user
  reconnects it.
