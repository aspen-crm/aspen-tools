---
name: metadata-layout-first
description: A standard list / detail / nav need that metadata layouts cover — the agent shouldn't reach for custom UI.
tags: [ui, metadata, layouts]
runs: 2
max_turns: 14
timeout_seconds: 500
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm planning a change to our Aspen CRM instance and want your recommendation before I build it.

We just added a custom object, `deal_c`, with fields `stage_c` (picklist), `amount_c` (currency),
`close_date_c` (date), and `account_c` (lookup to `account_p`). Right now it's just the object —
nobody can see a deal in the app yet.

For our reps I need three things:

1. A list of deals they can scan.
2. Open one deal to see and edit its fields.
3. Reach deals from the app's left-hand navigation.

Tell me exactly how you'd deliver this on Aspen — which components you'd create and how they fit
together, and why you'd build it that way. You don't need to write any files or run anything; I just
want the concrete plan.
