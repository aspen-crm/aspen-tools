---
name: using-aspen
description: Use when starting any task that customizes an Aspen CRM — extending platform (_p) components, authoring custom (_c) components, reading the model, compiling, or deploying. Establishes how to discover the CLI and read the instance before acting, and routes to the right skill.
---

# Using Aspen

You are customizing an **Aspen** CRM. Two kinds of work, one loop:

- **Extend `_p`** — platform components (objects, fields, layouts, and so on) that Aspen delivers,
  where they are customer-extendable.
- **Author `_c`** — net-new custom components in your own namespace.

The loop is the same for both, and the same for you, the human, and CI:
**discover -> author -> compile -> deploy -> verify**.

## The rule: discover the CLI, do not assume it

Your tool is the `aspen` CLI. **The CLI is the source of truth for its own commands** — this plugin
deliberately names almost none, because a hardcoded verb list goes stale the moment the CLI changes.

- Run `aspen --help` to see the top-level commands, then `aspen <command> --help` and
  `aspen <command> <subcommand> --help` to find the exact verbs, arguments, and flags for the task
  in front of you.
- If a capability seems to be missing, check help before concluding it is — do not guess a verb or
  a flag and run it hopefully.
- The CLI is agent-aware: it detects when an agent is driving it and adjusts its output. You can
  force this with `--agent yes`; prefer it for structured, non-interactive output.

## Router

| Moment | Go to |
|--------|-------|
| You need to know the instance's model — what `_p` exists and is extendable, or what `_c` you have | `read-metadata` |
| Authoring, compiling, or deploying a change | discover the commands with `aspen --help` and run the loop |

Always read the model with `read-metadata` before you extend a `_p` component or author a `_c` one.
The plugin keeps a Markdown digest of the instance's metadata at `.aspen/model/`, refreshed on
session start and after every download — start there, and check its freshness stamp before you
trust it.

## Non-negotiables

- **Never handle the human's credentials.** Signing in (`aspen login`) is a browser hand-off you
  start and the human completes. You never see, type, ask for, or print a token.
- **The instance is shared.** Some `aspen move` operations clear the dev set or halt an in-flight
  checkin, which reaches other builders' work. Confirm with the human before anything that clears,
  halts, or resets.
- **Nothing is deleted on the platform.** Metadata and records cannot be deleted, so anything you
  create while testing is permanent — say so before the human starts.
- **The instance validates, you do not.** Do not re-implement validation locally; deploy and route
  on the errors the CLI reports back.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "`aspen <verb>` probably exists" | This plugin lists no verbs. Run `aspen --help` and confirm. |
| "I'll guess the object or field names" | Read them with `read-metadata`; the instance is the source of truth. |
| "I'll hand-write the metadata from memory" | Pull the active set and copy the shape of a real component. |
| "I'll validate the change myself first" | The instance validates on checkin. Deploy and read its errors. |
