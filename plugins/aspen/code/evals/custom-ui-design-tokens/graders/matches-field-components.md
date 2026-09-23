---
type: llm
weight: 3
focus:
  source: trace
---

Judge the account selector and health filter in the authored code, including shared helpers
written or inspected in the trace. This is an offline exercise; evaluate implemented behavior,
not whether a browser was available. Describing a future control is insufficient.

PASS if the account selector is a searchable record lookup that keeps id and display text
separate, supports selecting a result and keyboard operation, and clears when optional. It
should reuse a verified existing helper when present. The health filter is a fixed-choice
select with the supplied metadata labels and technical values plus "All health". Its open menu
and focus/selection behavior must be implemented or delegated to a verified shared/native
component. Refresh belongs to the table's action header, aligned right.

FAIL an ordinary record `<select>`, a free-text record id, a nonfunctional lookup facade, or
labels fabricated from technical values (for example "Watch" instead of "Needs attention").
Fail a browser-owned picklist menu with only closed-field styling offered as matching Aspen,
or nonexistent SDK component imports. Do not require any particular framework or helper name.
