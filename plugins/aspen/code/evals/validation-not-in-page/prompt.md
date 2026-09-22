---
name: validation-not-in-page
description: A save-time rule asked for in the words of the page the reps use — it belongs in a before-trigger, because every other write path bypasses the page.
tags: [triggers, validation, model-first]
runs: 2
max_turns: 24
timeout_seconds: 650
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

You're working on our Aspen CRM instance. The session is rooted in the instance folder, with
`metacode/` in it.

Our reps build quotes in the quote line editor at `metacode/ui/ui_main_c/src/pages/quote_lines.ts`.
Sales ops wants a cap on discounting, and right now there isn't one — reps are saving 60% off and
nobody catches it until the invoice doesn't match the contract.

The rule: a quote line's `discount_pct_c` can't be more than 30 unless the parent quote's
`approval_status_c` is `approved_c`. If someone tries, they should be told why it didn't save.

The objects:

- `quote_line_c` — `name_c` (text), `quote_c` (id/lookup to `quote_c`), `product_c` (id/lookup),
  `quantity_c` (number), `unit_price_c` (currency), `discount_pct_c` (number/percentage).
- `quote_c` — `name_c` (text), `account_c` (id/lookup), `approval_status_c` (picklist, items
  include `draft_c`, `pending_c`, `approved_c`).

Put the cap in, then tell me what you did.

This is a local checkout, so there's no live instance: don't run the `aspen` CLI, don't compile,
don't deploy.
