---
name: records
description: Use when reading or writing record data on an Aspen instance through the runtime MCP — find/list records, get one by id, search across objects, list related records, create/update a record and prove it, or change many records of one object in one confirmed call (when the bulk-update tool is available). Drives aspen_list/get/search/related, aspen_records_create/update and aspen_records_bulk_update. Writes are confirm-gated; there is no delete.
---

# Records (read and write)

Read and write the signed-in user's records through the runtime MCP's Data tools. The
object is always a parameter, resolved against `explore` (`aspen_describe`) first — a
customer's `_c` objects work exactly like the standard `_p` ones.

## The record id is `id_p`

Every object's primary key is **`id_p`**. That is the value the `id` parameter of
`aspen_get` and `aspen_records_update` takes, and the field a `list` returns to identify a
row. A bare `id` is not a field.

## Reads — pick the narrowest tool

- **`aspen_list <object>`** — AND-only `filters` (`eq/ne/gt/gte/lt/lte/like`) and one sort;
  ≤10 rows by default, hard cap 200. Omit `fields` to auto-select from describe; name them
  to bound the row. **Prefer a filter over a wide page.**
- **`aspen_get <object> <id>`** — one record as a readable field map.
- **`aspen_search <query>`** — free-text across searchable objects when you **don't know
  which object** a record lives on. Follow up with `aspen_get` on the hit.
- **`aspen_related`** — records one hop out: the related object, the foreign-key field on it
  that points at the parent (`via_field`), and the `parent_id`. No arbitrary joins.

**Every read returns `app_url` — end with it.** For a `list` or `related` it is the app's
list view **with your filters and sort already encoded**, so the user lands on the same set
you just showed them, not the bare object list. For a `get` it is that record's page; each
`search` hit carries its own. Give it as a clickable link whenever you show rows — it is the
one thing that lets the user pick up where your answer stopped (and the honest move when the
row cap bounded what you could show).

**`app_url_exact: false` means the link is broader than your rows.** The app's list-view
filters are narrower than XQL: a text field has no "not equals", and some field types can't
be filtered in the UI at all. When a filter has no equivalent the gateway leaves it out
rather than emit one the app would silently discard, sets `app_url_exact: false`, and names
the casualties in `app_url_dropped_filters`. Read it and say so — "this link shows all
statuses, since the app can't filter *status ≠ X*" — never hand over a broader link as if it
were the same set.

For a natural-language question or a grouped count/sum, use `query-report`, not a manual chain.

## Writes — describe, confirm, write, read back (the evidence loop)

There are three write tools — `aspen_records_create`, `aspen_records_update`, and
`aspen_files_upload` (a file onto a record; the `files` skill) — and **no delete**. All are
**confirm-gated server-side**: they refuse unless called with `confirmed=true`, and they
return a read-back — the record for the two records writes, and for an upload what the
instance stored plus the attached record when there is one.

1. **Describe fresh.** `aspen_describe <object>` immediately before writing — the model may
   have changed. Confirm every field name and `required` flag; validate any picklist value
   with `aspen_get_picklist`. Size each value against the field's own `max_length` from this
   describe — **never** against how long some existing record's value looks. A field that
   currently holds short values still accepts up to its `max_length` (over it returns
   `VALIDATION_FAILED`).
   **The same call carries the layout.** Check every field you are about to write against the
   `ui.layout_p` entries' `placed_fields` — see *Will they see it?* below. This costs no extra
   call: the describe you already made for validation answers it.
2. **Confirm with the user.** Show the exact object + field values (create), or the `id_p` +
   the diff (update), and get an explicit **yes** in the conversation. **Any field not placed
   on a layout is named in that same message, before the yes** — not after the write.
3. **Write** with `confirmed=true`:
   - create: `aspen_records_create` with `object` + a `fields` map;
   - update: `aspen_records_update` with `object` + `id` (`id_p`) + the changed `fields`.
   The `yes` is what `confirmed=true` attests. Without it the server returns
   `CONFIRMATION_REQUIRED` and sends nothing.
   **Every value in `fields` is a JSON string** — `"1"` not `1`, `"true"` not `true`, an id
   as its text. The record API reads each field as text and refuses a JSON number outright
   (`VALIDATION_FAILED: … invalid type: integer, expected a string`). `null` clears a field.
4. **Read it back.** The tool returns the re-read record — assert the values landed. Only
   then report the write done. Numeric fields come back as JSON **strings** (`"50000.00"`);
   parse before comparing.
5. **Give them the link.** The write result's **`app_url`** is the new (or updated) record's
   page in the app. End the report with it as a clickable link — "Created Acme Renewal
   (`id_p` `abc-123`) — <app_url>". A create the user can't open is half done: they asked for
   a record, and the next thing they want is to look at it. Take the URL from the result;
   never assemble one from the instance host (a hand-made path renders an in-app 404).

### Will they see it? Check the layout before you propose the write

A record **stores** every field the object defines. The record **page** shows only the fields
a `layout_p` places. A write to an unplaced field succeeds, reads back correctly, and is
**invisible in the app** — the user asked you to add a note, you reported it done, and they
open the account and find nothing. A correct write, a failed answer.

So `aspen_describe` is not only field validation. Its `ui.layout_p` entries carry
**`placed_fields`** (what the detail sections put on the record page), `read_only_fields`, and
`sections` (each related list's `related_object`). Read them in the same breath as the field
names — the `explore` skill has the full shape.

**Before proposing a write, for each field you intend to set:**

| What the layout says | What you do |
|---|---|
| In `placed_fields` | Normal. Write it; say nothing about layouts. |
| In `read_only_fields` | Write it, and say it: "this shows on the page but isn't editable there." |
| **On no layout of this object** | **Say so before the yes**, and let the user decide. |
| Object has record types (`object_type` on the layouts) and it is placed on some, not all | Name which types show it — the record's own type decides. |
| `layout_p` is in `unavailable` / `page_truncated`, or a `custom_code` section could render it, or the entry has no `placed_fields` key | **Unknown, not missing.** Don't warn and don't claim placement — say you couldn't confirm, if it matters. |

Naming an unplaced field is one sentence in the confirmation, not a refusal and not a lecture:

> `internal_notes_c` isn't on the Account layout, so the note will be stored but won't appear
> on the account page — you'd reach it from a report, a list view, or by asking me. Write it
> there anyway?

Then do what they say. **The write is theirs to make** — an unplaced field is a real place to
put data (a report, a list view, an integration, an API reader all see it), and adding it to
the layout is the pro-code lane, not this one. You warn; you don't block, and you don't offer
to edit the layout.

**"Is there a section for X?"** — same block, different key. A request to attach related
records (notes, activities, addresses) to a parent is answered by the layout's `sections`: a
`related_list` whose `related_object` is `X`. No such section means the records will exist and
`aspen_related` will read them, but the parent's page has nowhere to show them. Say that
before creating them.

One thing to be exact about: a related list's **`columns`** are the *child's* columns, never
the parent's placed fields. Reading one as the other turns "invisible on the page" into
"looks fine".

### Polyid and currency fields write as a set

Some fields (see `explore`) are backed by more than one column — set the whole set, not one:

- **Polyid** (a polymorphic reference): set **two** fields together — the id (the target
  record's `id_p`) **and** the object-type field named by the field's `related_object_field`
  (e.g. `whaton_p`), whose value is *which* object it points at, and must be one of the field's
  `allowed_objects`. Do **not** set the `related_display_field` (`whatdn_p`) — the instance
  maintains it. Omitting the object-type field fails validation, since the id alone is
  ambiguous across the allowed objects.
- **Currency**: set the **entered** amount (`subtype: currency`) **and** its currency-code
  lookup. Never set the **converted** amount (`subtype: converted`) — the instance computes it
  from the entered amount and the rate; writing it is rejected. Keep amounts within
  `min_value`/`max_value` (an over-limit value returns `VALIDATION_FAILED`).

### A file field takes a file id

A field of `type: id`, `subtype: file` holds an uploaded file by its **file id** — never a
path, a URL, or a name. Get the id from `aspen_files_upload` (the `files` skill), which can
also set the field for you in the same call (`attach`). Setting it here is right when the
record is being created with a required file field: upload first, then create with
`fields: {<file field>: "<file_id>"}`. The file itself is a `file_p` record that `list`/`get`
cannot read; the id on the field is how it is reached.

## Bulk update — many records, one confirmation (when the bulk-update tool is available)

`aspen_records_bulk_update` changes up to **100 records of one object in one call**: one
PATCH to the instance, one confirmation from the user. It is in your tool list **only on
hosts whose server has `ASPEN_BULK_WRITES=1`**. The local Codex and Claude Code launchers
enable it by default. If the tool is absent: update one record at a time with `aspen_records_update`,
confirming each, and do not send the user off to enable anything.

Reach for it when the user wants the same change across many records ("mark these 40
opportunities Closed Lost", "set the owner on every account in region X") or hands you a
table of per-record changes. Never loop `aspen_records_update` over a set you could send in
one call.

1. **Build the row set from a read, not from memory.** `aspen_list` (or `query-report`) with
   the user's filters gives you the `id_p`s and the current values; keep its `app_url` — it is
   the list the user will want to look at afterwards.
2. **Describe fresh**, as for any write; validate a picklist value once for the batch, and
   check the changed fields against the layout's `placed_fields` **once** — the finding is the
   same for every row, so it belongs in the one confirmation, not repeated per row.
3. **Confirm once, for the whole batch.** Show every row (id, a display value, the diff) or —
   past a dozen rows — the rule that selected them, the exact count, the change, and a sample
   of rows. Say plainly "this changes N records". Get an explicit **yes**. Over 100 rows: say
   so, split into batches of at most 100, and confirm each (one yes covers them all only if
   you stated the total and the batching up front).
4. **Write** with `confirmed=true`: `object` + `records`, each row `{id, fields}` — every
   value a JSON string, a polyid or currency as its set, exactly as for a single update. The
   server refuses more than 100 rows and a repeated id (`USAGE`) before anything is sent.
5. **Read the per-row results.** The result is `{requested, updated, failed, results[]}`.
   Rows are independent: the instance applies the ones it accepts and rejects the others, so
   `failed > 0` beside `updated > 0` is a **partial** write, not a failed one. Each landed row
   carries its read-back `record` and `app_url`; each rejected row carries its structured
   `error` (`code`, `message`, `component`, `fix_hint`) and its `app_url`.
6. **Report honestly.** "Updated 38 of 40. Two rejected: `<id>` — <message>; `<id>` —
   <message>." Fix the rejected rows (re-describe, correct the field the error names) and
   retry **only those rows**, with a fresh confirmation for them. Never re-send rows that
   landed.
7. **Give them the link.** End with the list `app_url` from step 1 (the set they asked about)
   and, for a small batch, the per-row links.

`NOT_FOUND`, `USAGE` and `CONFIRMATION_REQUIRED` refuse the whole batch before anything is
written. Only a result with `results[]` means the instance was reached — and then each row
speaks for itself.

## Errors — route on the `code`, read the `fix_hint`

| code | what it means / do |
|------|--------------------|
| `NOT_FOUND` | wrong object or id (or not visible). Re-`describe`/`search`; the `fix_hint` names the namespace fix. |
| `PICKLIST_UNKNOWN_VALUE` | value not in the picklist. `aspen_get_picklist` for the allowed set, or ask the user. |
| `VALIDATION_FAILED` | instance rejected a field/type/required-miss. Read the message, fix the one field, re-describe, retry. |
| `CONFIRMATION_REQUIRED` | you called a write without `confirmed=true`. Show the diff, get a yes, retry with it. |
| `AUTH_REQUIRED` / `INSTANCE_UNREACHABLE` | identity/instance config, not your problem to fix — relay `fix_hint`, which names the fix for this host (connector settings, or `aspen login`). Never guess which. |
| `RATE_LIMITED` | back off, retry after a short delay. |
| `USAGE` "… is not enabled on this server" | you called `aspen_records_bulk_update` on a host without it (bulk writes disabled). Update one record at a time; do not ask the user to change the server. |
| `USAGE` | your tool arguments don't match the schema (for a bulk update: over 100 rows, a repeated id, an empty `fields`). Fix and retry. |
| `BAD_RESPONSE` / `UNEXPECTED` | surface it; retry once, then hand off via the deep link. Do not guess. |
