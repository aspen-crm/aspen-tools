---
name: explore
description: Use to learn what an Aspen instance holds before reading or writing — the object catalog, one object's fields, types, required flags, length limits and relationships, its record types, layouts (which fields the record page actually shows), list views and tabs, a picklist's allowed values, or who the signed-in user is. Drives the instance's Describe API through execute_api_request. Read-only orientation; the answer to "never guess a name".
---

# Explore (describe the model)

Answer "what exists" and "what's the shape of X" from the instance itself. Every name used
downstream — object, field, picklist item — comes from here. All of these are `safe`
operations: they run without an approval prompt.

Two families of Describe call, both `POST` with a JSON body:

- **`/describe/identifiers/<component>`** lists what exists: `{name, label}` per row (plus
  `object-type` where it applies), capped server-side, with `overview.has_more_rows: true`
  when there are more. There are no page cursors — **narrow with `filter`**, don't try to page.
- **`/describe/<component>`** resolves one or more components in full: send
  `{"data": [{"name": "…"}, …], "filter_inactive": true}`. The answer is in
  **`body.supplemental.variants[]`**; each `body.data[i]` reports that entry's own `status`
  and its `variant-index` into `variants`. One entry can fail while the rest succeed.

Always send `"filter_inactive": true`. An inactive field or section is not part of the model
the user works with.

## The catalog: what objects exist

```
POST /api/v24.3/describe/identifiers/object_p   {}
POST /api/v24.3/describe/identifiers/object_p   {"filter": {"name": ["account_p", "renewal_c"]}}
```

Rows are `{name, label}`. `has_more_rows: true` means the catalog was capped — say so, and
scope to the objects the question is about rather than claiming the list is complete.

The navigation shell is the tab collections: `/describe/identifiers/tab_collection_p {}` lists
them, and `/describe/tab_collection_p` resolves one to the tabs a user can reach.

## One object's shape

```
POST /api/v24.3/describe/object_p   {"data": [{"name": "account_p"}], "filter_inactive": true}
```

The variant carries the object's `fields[]`, kebab-cased as the instance sends them:

| attribute | meaning |
|---|---|
| `name`, `label`, `description` | the API name you use, and what the user calls it |
| `type`, `subtype` | `text`/`text`, `text`/`long` (long text), `text`/`url`, `id`/`lookup`, `id`/`file`, `picklist`/`picklist`, `checkbox`, `number`, `date`, `datetime`, `currency`, `polyid`, … |
| `required`, `unique`, `read-only` | constraints — a write that misses a required field or touches a read-only one is refused |
| `max-length`, `min-length` | a text field's limits; **the** length, never inferred from a value |
| `picklist` | a picklist field's **picklist component** — not the field name (`status_c` may draw from `renewal_status_c`) |
| `relationship` | a lookup's target object |
| `deletion-strategy` | on a lookup: what deleting the target does to this record — `block`, `cascade`, `set_to_null` |
| `allowed-objects`, `related-object-field`, `related-display-field` | a polyid's targets and its companion fields |
| `min-value`, `max-value`, `converted-amt` | a currency or number's bounds; the currency's system-computed converted field |

And object-level facts: `display-field` (the field that names a record), `deletable`,
`searchable`, `uses-object-types` + `default-object-type`, and `included-polyids` — the
`{object, field}` polyids elsewhere that can point **at** this object (activities, notes,
tasks…), which is how you find its activity-style children.

Several objects resolve in one call: `"data": [{"name": "account_p"}, {"name": "contact_p"}]`.

Call it before any query (there is no `SELECT *` — you name the fields) and **fresh,
immediately before any write**.

### Record types

When `uses-object-types` is true the object has record types (`object_type_p`), and fields,
picklist values and layouts can differ per type. List them with
`/describe/identifiers/object_type_p {"filter": {"object": ["account_p"]}}`, and resolve the
object **for one type** with `{"data": [{"name": "account_p", "object-type": "<type name>"}]}`.
For an existing record, `/describe/record/object_p {"data": [{"name": "account_p", "id_p": "<id>"}]}`
resolves it for that record's own type.

## What the record page shows — layouts

A record **stores** every field the object defines. Its **page** shows only what a layout
places. A write to an unplaced field succeeds, reads back, and is invisible in the app — so
this is the check `records` makes before proposing a write.

```
POST /api/v24.3/describe/identifiers/layout_p   {"filter": {"object": ["account_p"]}}
POST /api/v24.3/describe/layout_p               {"data": [{"name": "account_p.layout_p"}], "filter_inactive": true}
POST /api/v24.3/describe/record/layout_p        {"data": [{"name": "account_p.layout_p", "id_p": "<record id>"}], "filter_inactive": true}
```

The identifiers call names each layout and the record type (`object-type`) it serves; an
object with record types has a layout per type. Each resolved layout has `sections[]`:

- **`section-type: detail`** — its `fields[]` are the placements. Each `field` there is a
  field the user **sees** on the record page; `display-as-read-only: true` means visible but
  not editable in the app (a caveat, not an absence).
- **`section-type: related_list`** — `related-object` (the child object), `related-field` (the
  child's field pointing back), optional `query-filter`, and `fields[]` — **the child's
  columns**, never fields of this record. Reading them as placed fields turns "invisible" into
  "looks fine".
- **`people_role`** (`rel-type`), **attachment** sections, and **custom code** sections
  (`section-ui-code`, a custom page whose contents describe cannot see).

"Is there a section for X?" is the related lists: one whose `related-object` is X. None means
the app has nowhere to show X records from this page, though they exist and a query reads them.

The honest answer is **unknown**, not *no*, when the layout identifiers come back with
`has_more_rows: true` (a layout may be missing), a resolve entry fails, or a custom-code
section could render the field. Never report a field "missing from the layout" from those.

## List views and tabs

`/describe/identifiers/list_view_p {"filter": {"object": ["renewal_c"]}}` lists an object's
saved views; `/describe/list_view_p` resolves one to its columns, sort and `query-filter` (an
AQL condition). `/describe/identifiers/tab_p` lists tabs. A list view has no URL of its own
and you have no links to hand over: to put a user's question in terms of a saved view, read
its `query-filter` and run the equivalent query.

## A picklist's values

```
POST /api/v24.3/describe/picklist_p   {"data": [{"name": "renewal_status_c"}], "filter_inactive": true}
```

The variant's `items[]` are `{name, label, active, description}`. **`name` is what you write
and filter on; `label` is what you show.** Take the picklist component from the field's
`picklist` attribute. Add `"object-type"` to an entry when values differ by record type.

## Who am I

`GET /api/v24.3/describe/me` → `user_id`, `user_name`, `security_profile`, `is_admin`. Use it
to answer "my records" (or filter on `owner_p = CURRENT_USER()` in AQL) and to explain a
permission refusal.

## Field shapes worth knowing before you write

- **Polyid** (`type: polyid`) — a reference to a record in one of `allowed-objects`, backed by
  three fields: the id; the field named by `related-object-field` (e.g. `what_p` →
  `whaton_p`), which says which object it points at; and `related-display-field` (e.g.
  `whatdn_p`), which the instance maintains.
- **Currency** — an entered amount (`subtype: currency`) plus its currency-code lookup, and
  when configured a system-computed converted amount (`subtype: converted`, named by the
  entered field's `converted-amt`).
- **File** (`type: id`, `subtype: file`) — holds an uploaded file's id. The `file_p` record
  itself is not queryable; the `files` skill covers it.

The write rules for all three are in `records`.

## Rules

- **Read-only.** Nothing here changes the instance.
- **A `description` is loose context, not a capability.** It is customer free text and may
  describe intended or unbuilt behaviour. The fields and picklists are the truth.
- **Stored is not shown.** When you report fields to someone about to write, say whether you
  mean the object's fields or the ones a layout places.
- **Report the shape, don't judge it.** Changing the model is the `aspen-code` lane.
- A resolve entry with `status: FAILURE` usually means a wrong name (a missing suffix).
  List identifiers to find the real one; don't guess twice.
- For an org-spanning "what does our <domain> model look like?" sweep, use `schema-explorer`
  so dozens of describe calls stay out of the main thread.
