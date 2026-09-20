---
type: llm
weight: 2
focus: files
---

You are given the list of file paths the run created. The task was to give reps a list of a custom
object's records, a way to open one and edit its fields, and a nav entry to reach it.

On Aspen, all three are metadata-driven: a `list_view_p`, a `layout_p`, and a `tab_p` placed in a
`tab_collection_p`, authored as JSON under `metacode/metadata/`. A hand-built TypeScript page is the
wrong tool for a standard list / detail / edit / nav need — it re-implements what the platform gives
for free from metadata.

PASS if the created files are metadata components under `metacode/metadata/` (layout, list view,
tab, tab collection) and NO custom UI page was created under `metacode/ui/` (no `.ts`/`.tsx`/`.js`
page file) to satisfy this request.

FAIL if the run created a custom UI page under `metacode/ui/` (e.g. a `definePage` module) to
deliver the list/detail/nav experience.
