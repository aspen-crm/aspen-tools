---
name: reuse-platform-object
description: The verbatim ask that produced a duplicate deal_c on a real instance — the concept is already opportunity_p.
tags: [metadata, reuse, lean-data-model]
runs: 2
max_turns: 16
timeout_seconds: 500
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill]
---

You're working on our Aspen CRM instance. The session is rooted in the instance folder, with
`metacode/` in it.

Create a new deal object to capture sales opportunities.

Tell me what you'd create and why. Don't write any files yet — I want the plan first.
