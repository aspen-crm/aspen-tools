---
name: trigger-notify-and-errors
description: A record trigger that notifies a user, and surfaces its own failures instead of swallowing them.
tags: [triggers, error-handling, notifications]
runs: 2
max_turns: 22
timeout_seconds: 600
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

You're building on our Aspen CRM instance. The session is rooted in the instance folder, with
`metacode/` in it. I need a record trigger.

**What it should do:** when an opportunity is set to closed-won, notify its owner to write the deal
brief — create a follow-up task assigned to that owner, linked back to the opportunity, due in three
days. Only when the opportunity actually transitions to closed-won.

**One hard requirement:** if the follow-up task can't be created for any reason, I need to know. A
sales rep who just closed a deal should not be left thinking a task exists when it doesn't. Don't let
a rejected write pass silently.

The objects and fields you'll work with:

- `opportunity_p` — `name_p` (text), `status_p` (picklist, items include `open_p`, `closed_won_p`,
  `closed_lost_p`), `owner_p` (type `id`, subtype `lookup`, points at `user_p`).
- `task_p` — `subject_p` (text), `description_p` (text/long), `status_p` (picklist: `open_p`, …),
  `priority_p` (picklist: `low_p`, `med_p`, `high_p`), `due_date_p` (date), `owner_p` (type `polyid`,
  subtype `parent`) with its discriminator companion `owneron_p` (picklist/object_ref), and `what_p`
  (type `polyid`, subtype `parent`) with its discriminator companion `whaton_p` (picklist/object_ref).

Author the trigger's Rust in `metacode/server/server_main_c/src/lib.rs` and register it in
`metacode/server/server_main_c/aspen.server.json`. This is an authoring exercise on a local
checkout — there's no live instance to deploy to, so don't run the `aspen` CLI or try to deploy;
just write the code and explain your key decisions.
