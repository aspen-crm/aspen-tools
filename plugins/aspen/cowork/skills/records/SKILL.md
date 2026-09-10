---
name: records
description: Use when reading or writing record data on an Aspen instance through the runtime MCP — find/list records, get one by id, search across objects, list related records, or create/update a record and prove it. Drives aspen_list/get/search/related and aspen_records_create/update. Writes are confirm-gated; there is no delete.
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

There are two write tools — `aspen_records_create` and `aspen_records_update` — and **no
delete**. Both are **confirm-gated server-side**: they refuse unless called with
`confirmed=true`, and they read the record back and return it.

1. **Describe fresh.** `aspen_describe <object>` immediately before writing — the model may
   have changed. Confirm every field name and `required` flag; validate any picklist value
   with `aspen_get_picklist`. Size each value against the field's own `max_length` from this
   describe — **never** against how long some existing record's value looks. A field that
   currently holds short values still accepts up to its `max_length` (over it returns
   `VALIDATION_FAILED`).
2. **Confirm with the user.** Show the exact object + field values (create), or the `id_p` +
   the diff (update), and get an explicit **yes** in the conversation.
3. **Write** with `confirmed=true`:
   - create: `aspen_records_create` with `object` + a `fields` map;
   - update: `aspen_records_update` with `object` + `id` (`id_p`) + the changed `fields`.
   The `yes` is what `confirmed=true` attests. Without it the server returns
   `CONFIRMATION_REQUIRED` and sends nothing.
4. **Read it back.** The tool returns the re-read record — assert the values landed. Only
   then report the write done. Numeric fields come back as JSON **strings** (`"50000.00"`);
   parse before comparing.
5. **Give them the link.** The write result's **`app_url`** is the new (or updated) record's
   page in the app. End the report with it as a clickable link — "Created Acme Renewal
   (`id_p` `abc-123`) — <app_url>". A create the user can't open is half done: they asked for
   a record, and the next thing they want is to look at it. Take the URL from the result;
   never assemble one from the instance host (a hand-made path renders an in-app 404).

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

## Errors — route on the `code`, read the `fix_hint`

| code | what it means / do |
|------|--------------------|
| `NOT_FOUND` | wrong object or id (or not visible). Re-`describe`/`search`; the `fix_hint` names the namespace fix. |
| `PICKLIST_UNKNOWN_VALUE` | value not in the picklist. `aspen_get_picklist` for the allowed set, or ask the user. |
| `VALIDATION_FAILED` | instance rejected a field/type/required-miss. Read the message, fix the one field, re-describe, retry. |
| `CONFIRMATION_REQUIRED` | you called a write without `confirmed=true`. Show the diff, get a yes, retry with it. |
| `AUTH_REQUIRED` / `INSTANCE_UNREACHABLE` | token/instance config on the `.mcpb`, not your problem to fix — ask the user to re-check the connector. |
| `RATE_LIMITED` | back off, retry after a short delay. |
| `USAGE` | your tool arguments don't match the schema. Fix and retry. |
| `BAD_RESPONSE` / `UNEXPECTED` | surface it; retry once, then hand off via the deep link. Do not guess. |
