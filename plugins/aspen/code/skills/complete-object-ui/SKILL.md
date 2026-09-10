---
name: complete-object-ui
description: Use after creating or extending an object, or when an object cannot be seen in the UI — checks whether it has a layout, list view and tab, offers to author the missing ones, and guides the sections, columns, sort and tab placement. An object with no layout has records that cannot be opened.
---

# Complete an object's UI

A new object exists only to an API caller until it has the components that surface it.
Three do that, and they are not independent:

| Component | What it does | Depends on |
|---|---|---|
| `layout_p` | Renders **one record**. Without it a row cannot be opened. | the object's fields |
| `list_view_p` | The **rows** — columns, sort, optional filter. | the object; names its tab |
| `tab_p` | Where the list view is **reached from**. | a default list view |
| `tab_collection_p` | Lists the tabs a person can actually see. | the tab |

## 1. See the gap

```
node "${CLAUDE_PLUGIN_ROOT}/hooks/ui-coverage.mjs" report <object>
```

Omit the object for the whole model. It reads the downloaded metadata directly and
groups on each component's `object` attribute, so it is right even for components whose
names say nothing about their object — the platform ships `currency_view_p` and
`user_view_p`.

**Offer; never author unasked.** Show the human what is missing and ask what they want.
An object with no UI is a normal, deliberate state — join objects, job records and
audit tables have none — so a gap is a question, not a defect.

## 2. Layout first, always

**Author the layout before the list view and tab, not after.** A list view or tab with no
layout gives someone a row they can click and nothing to open it with. That combination
appears **nowhere** in platform metadata; it is a state only a customer creates.

If the human wants a list view or tab on an object with no layout, say that plainly and
offer the layout in the same breath. If they decline, note it and carry on — it is their
call, not a veto.

### Proposing the layout

Spawn `aspen-ui-proposer` with the object name. It reads the object's fields and two or
three real layouts from this instance and returns a proposal; it writes nothing. Present
its proposal as **sections**, not as JSON:

> **Details** (2 columns) — name, owner, status, amount
> **Related** — the child objects that hang off this one
> **System** — created/modified, read-only

Real layouts use `detail` sections (a field grid, `columns` is the grid width) and
`related_list` sections (`related-object` + `related-field`, how children hang off a
parent). Those two cover almost everything; `people_role`, `custom_code` and
`attachment_list` are specialized and not yours to propose.

Iterate on the shape with the human. Then author the file.

## 2b. Object types

An object declares `uses-object-types` itself, so you never have to infer it. Where it is
true, a layout can name one type through `object-type`, and **a type with no layout of its
own renders with the object's**. That is normal: inheriting is the designed behaviour, not
a gap.

**When someone creates an object type, ask whether it wants its own layout.** Offer it as
an enhancement, never as a fix, and make the question concrete:

> `product_p.bundle_p` currently renders with `product_p.layout_p`. Should Bundle show
> something different — different fields, a different order, a section Product does not
> have? Inheriting is a perfectly good answer.

The object type carries its own `fields` list, with `required` and `picklist-filter` per
field. That is the best seed for the question: it already says how this type narrows the
object. Spawn `aspen-ui-proposer` with the type, and it will propose a **diff from the
inherited layout** rather than a fresh design.

**Naming:** the base type's layout drops the type from its name; every other type keeps
it. On a real instance that is `product_p.layout_p` for `product_p.base_p`, and
`product_p.bundle_p.layout_p` for `product_p.bundle_p`.

**Only layouts are per-type.** List views and tabs belong to the object — a real object
with two types still has one list view and one tab. Do not offer per-type versions of
those.

**The one real defect:** a type-using object with **no layout at all**. Then "inherit the
object layout" inherits nothing and every type is unrenderable. That is the same warning
as above, and object types raise its stakes rather than adding a new rule.

If you meet a type-using object that has a layout with **no** `object-type` on it, say so
and stop. That combination appears nowhere on a real instance, and guessing what the
platform does with it is worse than asking.

## 3. List view

Ask for, in this order:

1. **Columns** — which fields, in display order. Fewer than the layout: this is a
   scanning grid, not the record.
2. **Default sort** — one column and a direction.
3. **Query filter** — optional, and an **expression string**, not a structure. A real one
   reads `merged_into_p is null`. Ask whether the list should hide anything by default.

## 4. Tab — and place it

A tab names its `default-list-view`. **The reference runs both ways**: the tab points at
the list view and the list view points back at the tab, so author the two as a
cross-linked pair rather than one and then the other.

Then ask **which tab collection it joins**, and add it. A tab no collection lists is not
reachable — the object is finished and invisible. The coverage report names the
collections it searched. Note that the platform itself ships tabs it never places, so an
unplaced tab is not automatically wrong; ask rather than assume.

## Authoring the files

- **Copy the shape of a real component of the same type.** Never invent an attribute
  name or an enum value — `aspen-model-reader` brings back a working example verbatim in
  one step, and guessing costs a checkin round trip.
- **Name it `<object>.<ctype>`** — `deal_c.layout_p`, `deal_c.list_view_p`,
  `deal_c.tab_p`. That is what this instance does; the exceptions are platform-only.
- Every field you reference must exist on the object. Check against the resolved layer.
- Hand `aspen-executor` the files — full content, into the authored root, one file per
  component — and let the human review the diff rather than the JSON.

## Closing

Give `aspen-executor` the deploy commands `.aspen/bin/aspen --help` gives you, then go to
`verify-change`. Re-run the coverage report afterwards: it reads the tree, so it is the
cheapest confirmation that what you authored actually landed.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "The object is created, so I'm done" | It has no UI until it has a layout. Run the report. |
| "I'll add the list view now and the layout later" | That ships a row that cannot be opened. Layout first. |
| "I'll create the tab and move on" | A tab in no collection is invisible. Placement is part of the tab. |
| "The object has no layout, so it's broken" | Join, job and audit objects have none by design. Ask. |
| "I'll write the tab, then the list view" | They reference each other. Author them as a pair. |
| "I'll put every field on the layout" | Propose a shape and let the human cut it. A dump is not a design. |
| "This type has no layout, so it's broken" | It renders with the object's. Offer it one; do not flag it. |
| "I'll give the new type its own list view and tab too" | Only layouts are per-type. The object owns the list view and tab. |
| "I'll guess the section attribute names" | Read a real layout. Guessing costs a checkin round trip. |
