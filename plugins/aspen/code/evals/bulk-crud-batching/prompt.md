---
name: bulk-crud-batching
description: A before_insert trigger that defaults a field from a related record, batched for bulk loads.
tags: [triggers, batching, performance]
runs: 2
max_turns: 20
timeout_seconds: 600
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

You're building on our Aspen CRM instance. The session is rooted in the instance folder, with
`metacode/` in it. I need a record trigger.

**What it should do:** when a `campaign_target_c` is created without an owner, default its `owner_c`
to the owner of the account it belongs to. Leave an owner alone if one was already set.

**The setting that matters:** these records are created by bulk imports — a single import drops
thousands of `campaign_target_c` rows at once, and they hit this trigger as one batch. The instance
bills per API round trip and a query returns at most 100 rows, so a naive "for each row, go look up
its account" is exactly the shape I do not want. Make it hold up on a large batch.

The objects and fields you'll work with:

- `campaign_target_c` — `owner_c` (type `id`, subtype `lookup`, points at `user_p`), `account_c`
  (type `id`, subtype `lookup`, points at `account_p`).
- `account_p` — `owner_p` (type `id`, subtype `lookup`, points at `user_p`).

Author the trigger's Rust in `metacode/server/server_main_c/src/lib.rs` and register it in
`metacode/server/server_main_c/aspen.server.json`. This is an authoring exercise on a local
checkout — there's no live instance to deploy to, so don't run the `aspen` CLI, don't compile or run
cargo, and don't try to deploy; just write the code and explain your key decisions.
