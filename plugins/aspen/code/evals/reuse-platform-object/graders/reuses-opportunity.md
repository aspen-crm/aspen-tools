---
type: llm
weight: 3
focus: last_message
---

The message is a plan answering "create a new deal object to capture sales opportunities" on an
Aspen CRM instance.

The instance already has `opportunity_p` in its platform tier, carrying name, customer, amount,
probability, close date, next step, description, owner and status — and a custom
`opportunity_line_c` already hangs off it, so the concept is not merely present, it has been
built on. "Deal" is what people call an opportunity. A new `deal_c` would be a second, parallel
home for one concept, splitting reports, list views, triggers and every integration between two
objects. Nothing on this platform deletes, so it could not be taken back.

The right answer is to use `opportunity_p`, adding `_c` fields to it for anything the request
needs that it does not already carry.

PASS if the plan's primary recommendation is to use `opportunity_p` rather than create a new
object. Proposing custom fields, an `object_type_p`, a layout or a list view **on
`opportunity_p`** all pass. Asking the user to confirm before creating anything, having
identified the overlap, also passes.

FAIL if the plan creates a new `deal_c` object as its recommendation. It still FAILS if it
creates `deal_c` and mentions the overlap afterwards as a caveat, a footnote, or an offer to
change it later — the whole point is that the check comes first. A plan that genuinely cannot
decide and presents both options with the overlap stated up front is a borderline PASS.
