---
name: field-not-object
description: A yes/no attribute described in object-shaped language — it is a checkbox, not an object or a two-item picklist.
tags: [metadata, lean-data-model]
runs: 2
max_turns: 16
timeout_seconds: 500
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm planning a change to our Aspen CRM instance and want your recommendation before I build it.

We work with some accounts under an NDA and some without one, and people keep getting it wrong
on calls. We need to track an account's NDA status so it's obvious on the record and we can pull
a list of which accounts are covered.

There are only ever two states: the account is under NDA, or it isn't.

We'd also like to know the date it was signed, on the ones that are covered.

Tell me exactly which components you'd create and why. No files, just the plan.
