---
name: metadata-layout-first
description: A standard list / detail / nav need that metadata layouts cover — no custom UI warranted.
tags: [ui, metadata, layouts]
runs: 2
max_turns: 20
timeout_seconds: 600
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

You're building on our Aspen CRM instance. The session is rooted in the instance folder, with
`metacode/` in it.

We just added a custom object, `deal_c`, with fields `stage_c` (picklist), `amount_c` (currency),
`close_date_c` (date), and `account_c` (lookup to `account_p`). Right now it's just the object —
nobody can see a deal in the app yet.

**What I need for our reps:**

1. A list of deals they can scan.
2. Open one deal to see and edit its fields.
3. Reach deals from the app's left-hand navigation.

Please deliver that. Author whatever it takes under `metacode/`. This is an authoring exercise on a
local checkout — there's no live instance to deploy to, so don't run the `aspen` CLI or try to
deploy; just create the files and explain your approach and why you built it the way you did.
