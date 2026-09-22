---
name: status-flow-is-lifecycle
description: A stage-ordering ask on an object that already has a status picklist — the platform answer is lifecycle_p, not a hand-rolled check.
tags: [metadata, lifecycle, model-first]
runs: 2
max_turns: 16
timeout_seconds: 500
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm planning a change to our Aspen CRM instance and want your recommendation before I build it.

We have a `legal_agreement_c` object. It already has a `status_c` picklist with five values:
`drafting_c`, `out_for_signature_c`, `executed_c`, `expired_c`, `terminated_c`. It also has
`name_c` (text), `account_c` (id/lookup to `account_p`) and `end_date_c` (date).

Two things keep going wrong:

1. People move an agreement straight from drafting to executed, skipping signature entirely. By
   the time legal notices, the contract is already being invoiced against.
2. Nobody can tell at a glance which agreements are actually live versus finished. "Expired" and
   "terminated" are both over, but they look like any other value in the list.

I want the stages to be real: the order enforced, a defined starting point, and the finished
states marked as finished so we can treat them differently.

Tell me exactly how you'd deliver this on Aspen — which components you'd create or change, and
why you'd build it that way. You don't need to write any files or run anything; I just want the
concrete plan.
