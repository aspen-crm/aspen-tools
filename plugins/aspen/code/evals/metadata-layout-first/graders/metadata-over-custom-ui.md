---
type: llm
weight: 2
focus: last_message
---

The message is a plan for making a new custom object (`deal_c`) listable, openable/editable, and
reachable from the nav on an Aspen CRM.

The correct Aspen answer is metadata, not custom code. An object becomes usable through metadata
components: a **layout** (so a record opens and its fields are editable), a **list view** (so
records can be listed), and a **tab** placed in a **tab collection** (so it's reachable from the
nav). The platform-specific catch is that a custom object can't be added to the stock platform
navigation collection, so the plan must put its tab in a new **custom tab collection**. None of this
needs a hand-built page.

PASS if the plan delivers all three needs through those metadata components — a layout, a list view,
and a tab in a tab collection — AND recognizes that the custom object's tab has to go in a new
custom tab collection rather than the platform's built-in navigation.

FAIL if the plan proposes building a custom UI page / coded screen to satisfy this (a standard
list + detail + nav need), OR if it misses that a custom object needs its own custom tab collection
for the nav (for example, by assuming the object can just be dropped into the existing platform
navigation).
