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
| `layout_p` | its record-detail layouts | `label` |
| `search_config_p` | how it's searched | `label` |
| `object_type_p` | its record types | `label`, `active` |
| `picklist_filter_p` | picklist narrowing on its fields | `label` |

Attributes arrive kebab-cased with a snake_case alias, so `query-filter` and `query_filter`
are the same value. Use it to answer "what views exist on this object?", "which list view
does this tab open?", or "what filter is that view already applying?".

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

Report the shape; the write contract for both lives in the `records` skill.

## Rules

- **Read-only.** Nothing here changes the instance.
- **A field's constraints are metadata, never a value.** Length (`max_length`), type,
  required, uniqueness, and picklist come from `aspen_describe` — never inferred from a value
  in a record. A short value in a long field is not a short field.
- **A `description` is loose context, not a capability.** A field's or object's `description`
  is customer free-text that may describe intended or unbuilt behavior (e.g. a lifecycle
  "state"). Never infer a capability, workflow, or state from it — rely on the actual fields,
  picklists, and tools. The structure is the truth; the prose may run ahead of it.
- **Report the shape, don't judge it.** Fields, types (text, number, picklist, reference /
  polymorphic, system/audit, …), and required flags are facts to relay so the caller can read
  or write records — not a design to critique. Authoring or changing the model is a different
  lane; here you just surface what describe returns.
- If a describe returns `NOT_FOUND`, the name is wrong — its `fix_hint` points at the
  namespace suffix (`account` → `account_c`/`account_p`). Re-describe; do not guess again.
- For an org-spanning "what does our <domain> model look like?" sweep, hand off to the
  `schema-explorer` subagent so the dozens of describe calls stay out of the main thread.
