---
type: llm
weight: 3
focus: last_message
---

The message is a plan for making the stages of `legal_agreement_c` real on an Aspen CRM: order
enforced, a defined starting state, and finished states marked as finished.

Aspen has a declarative component for exactly this: `lifecycle_p`. A lifecycle names an object,
lists its `states`, and lists the `transitions` between them as `from-state` / `to-state` pairs,
so the allowed moves ARE the metadata. Each state can carry a `state-type` of `initial_p` (the
starting state) or `complete_p` (a terminal state) — which is precisely the "defined starting
point" and "finished states marked as finished" the request asks for.

The alternative a model reaches for when it does not know the component exists is a picklist plus
hand-written code: a Rust trigger comparing the old and new value against a table of allowed
pairs, or a page that greys out the wrong options. That encodes the same rules imperatively,
gives the platform no declarative transition set, and does not mark initial or terminal states at
all.

PASS if the plan's primary answer is a `lifecycle_p` component with states and transitions, and
it uses the state types (initial and terminal/complete) to satisfy the starting-point and
finished-state parts of the request. Mentioning a trigger ALONGSIDE the lifecycle, for something
the lifecycle cannot do (side effects on transition, for instance), still passes.

FAIL if the plan's answer to enforcing the order is a hand-written trigger check, a validation
rule in code, or UI that restricts the dropdown — with no lifecycle component. Also FAIL if it
only proposes adding more picklist values or a second status field.
