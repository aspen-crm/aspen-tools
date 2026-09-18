---
name: explore
description: Use to learn what an Aspen instance holds before reading or writing — the object catalog and its tab collections, one object's fields/types/required-flags/relationships plus its list views, tabs and layouts, or a picklist's allowed values. Drives aspen_describe and aspen_get_picklist. Read-only orientation; the answer to "never guess a name".
---

# Explore (describe the model)

Answer "what exists" and "what's the shape of X" from the instance itself. Every name you
use downstream — an object, a field, a picklist — comes from here, never a guess.

## The catalog: what objects exist

- **Preferred:** read the **`aspen://objects` resource** — the host that supports resources
  pulls it at connect time on its own.
- **Otherwise:** call `aspen_describe` with **no `object`** argument. Same payload: every
  visible object as `{name, label}`, the namespace legend, and a `truncated` flag.

It caps at ~100 objects (`truncated: true` when there are more). It is **name-only by
design** — do not try to page it wider; scope to the object you need instead.

The same call returns **`tab_collections`** — the instance's navigation shell. A tab
collection has no owning object (it's `{name | extends, tabs}`), so this is the only place it
appears. Read it to answer "what does the app's nav actually show?"; the tabs it lists are
the ones a user can reach.

## One object's shape

`aspen_describe <object>` → the object's fields with `name`, `label`, `type`, `subtype`,
`required`, `unique`, a text field's length limits (`max_length` / `min_length`), and, for a
picklist field, the **picklist's** component name; plus its relationships. Call this:

- before any `list`/`get`/`report`, to know the real field names (there is no `SELECT *`);
- **fresh, immediately before any write** — the model is customer-authored and changes under
  you, so a cached describe is orientation, not validation.

Those per-field properties are the field's **constraints**, and describe is the only place
they are true. A field's length is `max_length` from here — **never** the length of a value you
happened to see in a record. A record shows what one row holds; the field allows far more (a
4-character account name lives in a 128-character field). Same for type, required, and picklist:
read them from describe, not from a sampled value.

## What the instance *shows* for an object (the `ui` block)

`aspen_describe <object>` returns a **`ui`** block beside `describe` — the object's screen
surface, keyed by component type:

| key | what it is | attributes worth reading |
|---|---|---|
| `list_view_p` | the object's saved list views | `tab`, `query-filter` (an XQL string), `label` |
| `tab_p` | its tabs in the app nav | `tab-type`, `default-list-view`, `active` |
| `layout_p` | its record-detail layouts | `label`, `object_type`, **`placed_fields`**, `read_only_fields`, `sections` |
| `search_config_p` | how it's searched | `label` |
| `object_type_p` | its record types | `label`, `active` |
| `picklist_filter_p` | picklist narrowing on its fields | `label` |

Attributes arrive kebab-cased with a snake_case alias, so `query-filter` and `query_filter`
are the same value. Use it to answer "what views exist on this object?", "which list view
does this tab open?", or "what filter is that view already applying?".

### A layout says which fields the user actually sees

A record **stores** every field the object defines. A record **page** shows only what a
layout places. Those are different sets, and the gap is the one way a correct write still
fails the user: the value lands, reads back, and is nowhere on the screen.

Each `layout_p` entry answers it:

- **`placed_fields`** — the fields this layout's **detail** sections put on the record page.
  A field not in it is stored but not shown on that page.
- **`read_only_fields`** — the subset placed but **not editable in the app**. Still visible;
  the user just can't change it there. That is a caveat, not an absence.
- **`sections`** — each section with its `section_type` and what it surfaces:
  - `detail` → its `fields` (where a value would appear);
  - `related_list` → **`related_object`** (the child object) + **`related_field`** (the field
    on the child pointing back) + optional `query_filter`, and `columns` — the columns of the
    **child's** rows, *not* fields of this record. Never read `columns` as placed fields.
  - `people_role` → `rel_type`; `attachment_list` → attachments; `custom_code` →
    `section_ui_code`, a custom page whose contents describe cannot see.
- **`object_type`** — the record type this layout serves, when it serves one. An object with
  record types has a layout **per type**, so "is it placed?" is answered per layout, and
  which one a record uses depends on its object type.

Answering "is there a section for X on this object?" is the `sections` list: a related list
for `X` means `related_object == X`. No section naming `X` means the app has nowhere to show
`X` records from this page — even though the records exist and `aspen_related` can read them.

Four cases where the honest answer is **unknown**, not *no* — never report a field
"missing from the layout" from any of them:

- `layout_p` in **`unavailable`** — the route didn't serve; you did not see the layouts.
- `layout_p` in **`page_truncated`** — a layout of this object may be missing from the list.
- A `custom_code` section — a custom page can render anything, including a field no detail
  section places. Placement is then a floor, not a ceiling.
- An entry with **no `placed_fields` key at all** — the layout came back without sections, or
  the server predates 0.1.22 and carries no placement for any layout. Absent is not empty: say
  you couldn't tell, never that the layout places nothing.

The write-time rule built on this lives in `records` ("will they see it?").

Two limits to read honestly:

- **`unavailable`** names a component type the instance wouldn't serve. That is *unknown*,
  not *none* — don't report "this object has no list views" from it. A key that IS present
  with an empty array does mean none.
- **`page_truncated`** names a type whose describe page hit the ~100 cap, so one of this
  object's components may be missing from the list. Say the list may be partial.

The block is **read-only orientation**, like everything else here. A list view's
`query-filter` tells you what a view shows; **authoring** or changing one of these
components is the pro-code `_c` lane, not this one.

**A named list view has no URL of its own.** The app routes list views under the object
(`/ui/objects/<object>`), with filters carried as URL parameters — there is no per-view
route. So to put a user *in* a saved view, read its `query-filter`, run the equivalent
`aspen_list` filters, and hand over that result's `app_url`. Don't promise a link to a view
by name.

## A picklist's values

`aspen_get_picklist <picklist>` → the allowed values and labels. Use it to populate a choice
and to validate a picklist field value **before** a write (else the write returns
`PICKLIST_UNKNOWN_VALUE`).

Gotcha: a picklist's component name is **not** the field name — a `status_c` field may draw
from a `renewal_status_c` picklist. Take the picklist name from the field's describe output,
not from the field name.

## Polyids (polymorphic references) and currency come as a set of fields

Two field types are backed by more than one column — describe tells you which:

- **Polyid** (`type: polyid`) — a reference that may point at any one of its **`allowed_objects`**.
  It's three fields: the id itself; an **object-type** field named by **`related_object_field`**
  (e.g. `what_p` → `whaton_p`) that says *which* object it points at; and a **display** field
  named by **`related_display_field`** (e.g. `whatdn_p`) the instance maintains for showing it.
  Read all three: use the display for a label, the object-type field to know the target object.
- **Currency** (`type: currency`) — an **entered** amount (`subtype: currency`) paired with a
  currency-code lookup (a `_p`/lookup field to `currency_p`) and, when configured, a
  system-computed **converted** amount (`subtype: converted`, named by the entered field's
  **`converted_amt`**). `min_value`/`max_value` bound it. Amounts come back as JSON **strings**.

A third shape is one column but points outside the record tables:

- **File** (`type: id`, `subtype: file`) — a reference to an uploaded file (a `file_p`
  record) by its file id. Describe shows the field and whether it is `required`; the file
  itself is **not** listable or gettable (`file_p` is refused as an object), so a file is
  reached only through the field that holds it. Uploading and attaching is the `files` skill.

Report the shape; the write contract for all of them lives in the `records` and `files` skills.

## Rules

- **Read-only.** Nothing here changes the instance.
- **A field's constraints are metadata, never a value.** Length (`max_length`), type,
  required, uniqueness, and picklist come from `aspen_describe` — never inferred from a value
  in a record. A short value in a long field is not a short field.
- **A `description` is loose context, not a capability.** A field's or object's `description`
  is customer free-text that may describe intended or unbuilt behavior (e.g. a lifecycle
  "state"). Never infer a capability, workflow, or state from it — rely on the actual fields,
  picklists, and tools. The structure is the truth; the prose may run ahead of it.
- **Stored is not shown.** A field in `describe` is storable; a field in a layout's
  `placed_fields` is visible on the record page. When you report an object's fields to
  someone about to write, say which of the two you are reporting.
- **Report the shape, don't judge it.** Fields, types (text, number, picklist, reference /
  polymorphic, system/audit, …), and required flags are facts to relay so the caller can read
  or write records — not a design to critique. Authoring or changing the model is a different
  lane; here you just surface what describe returns.
- If a describe returns `NOT_FOUND`, the name is wrong — its `fix_hint` points at the
  namespace suffix (`account` → `account_c`/`account_p`). Re-describe; do not guess again.
- For an org-spanning "what does our <domain> model look like?" sweep, hand off to the
  `schema-explorer` subagent so the dozens of describe calls stay out of the main thread.
