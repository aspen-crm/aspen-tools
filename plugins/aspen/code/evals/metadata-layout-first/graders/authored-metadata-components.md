---
type: llm
weight: 2
focus: files
---

You are given the list of file paths the run created. The task was to make a new custom object
(`deal_c`) listable, openable/editable, and reachable from the nav.

On Aspen an object becomes usable through metadata components authored as JSON under
`metacode/metadata/`, one per subdirectory named for the component type:

- a **layout** — under `metacode/metadata/layout_p/` — so a record opens and its fields are editable,
- a **list view** — under `metacode/metadata/list_view_p/` — so records can be listed,
- a **tab** — under `metacode/metadata/tab_p/` — and a **tab collection** — under
  `metacode/metadata/tab_collection_p/` — so it's reachable from the nav (a custom object can't join
  the platform's stock collection, so a new custom tab collection carries the tab).

PASS if the created paths include a layout, a list view, a tab, and a tab collection under
`metacode/metadata/` (the four components that deliver list + detail/edit + nav).

FAIL if any of those four component types is missing from the created files, or if the run tried to
deliver the experience with a custom UI page under `metacode/ui/` instead.
