---
type: llm
weight: 2
focus: last_message
---

The message is the run's final explanation of how it made a new custom object (`deal_c`) usable:
listable, openable/editable, and reachable from the nav.

The correct Aspen answer is metadata, not code: an object becomes usable once it has a `layout_p`
(so a record opens and its fields are editable), a `list_view_p` (so records can be listed), and a
`tab_p` placed in a `tab_collection_p` (so it's reachable from the nav). A custom object cannot be
added to the platform's stock nav collection, so the tab goes in a new custom `tab_collection_p`.

PASS if the explanation delivers the need through those metadata components (layout + list view +
tab in a tab collection) and does not resort to a custom-built page.

FAIL if it proposes building a custom UI page for this, or omits the metadata pieces an object needs
to be usable (a layout, a list view, and a tab in a collection).
