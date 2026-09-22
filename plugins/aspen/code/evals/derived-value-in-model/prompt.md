---
name: derived-value-in-model
description: A "show me remaining budget" ask that reads like a screen request but needs a stored field and a trigger.
tags: [metadata, triggers, model-first]
runs: 2
max_turns: 26
timeout_seconds: 700
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

You're working on our Aspen CRM instance. The session is rooted in the instance folder, with
`metacode/` in it.

Our services team runs client engagements against a fixed contract value. Today nobody can tell
how much of an engagement's budget is left without exporting timesheets into a spreadsheet, and by
the time anyone notices, we've already overrun.

Two things I need:

- For any engagement, what was contracted, what's been consumed so far, and what's left.
- A way to find the engagements that are close to running out, so a delivery manager can go and
  look at them before it's a problem.

Consumed means hours booked times the bill rate on the timesheet.

The objects are already there:

- `engagement_c` — `name_c` (text), `account_c` (id/lookup to `account_p`), `status_c` (picklist),
  `owner_c` (id/lookup), `start_date_c` (date), `end_date_c` (date).
- `order_line_c` — `engagement_c` (id/lookup), `line_total_c` (currency), `product_c` (id/lookup).
  The contracted value of an engagement is the sum of its order lines' `line_total_c`.
- `timesheet_c` — `engagement_c` (id/lookup), `total_hours_c` (number), `bill_rate_c` (currency),
  `status_c` (picklist, items include `approved_c`). Only approved timesheets count.

This is a local checkout, so there's no live instance: don't run the `aspen` CLI, don't compile,
don't deploy. Author what's needed and tell me what you did and why.
