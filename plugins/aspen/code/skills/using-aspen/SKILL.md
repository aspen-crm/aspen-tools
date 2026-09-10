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

## Step zero: know where you are

Every Aspen session is rooted in the **instance folder** — the one Aspen Builder creates at
`~/Aspen/<domain>-<instance>`, for example `~/Aspen/veeva.com-treehouse`. It holds
`metacode/{platform,active,compiled,metadata}`, the exported record data, and Builder's private
`.aspen/` cache. The CLI takes which instance you are working on from the login and defaults its
own path arguments to this folder; the plugin's hooks and the `.aspen-model/` digest key off the
session's directory. Nothing lines up if the session is rooted anywhere else.

Confirm you are in it before anything else — the directory should hold `metacode/` and `.aspen/`.
If it does not:

- List `~/Aspen`. Each entry is one instance folder.
- **Stop and ask the human to reopen Claude Code in the right one.** Do not `cd` there and work
  from a session rooted elsewhere: the hooks run against the session's directory, so the digest
  and the guards would be watching a tree you are not editing.
- If `~/Aspen` is empty or missing, the human has not opened this instance in Builder yet. That
  is their step, not yours.

## The rule: discover the CLI, do not assume it

Your tool is the `aspen` CLI. It lives inside the instance folder at `.aspen/bin/aspen` — Builder
puts it there and does not add it to `PATH`, and neither do you. Run it by that path from the
instance folder; everywhere these skills say `aspen`, that is the command they mean.

**The CLI is the source of truth for its own commands** — this plugin deliberately names almost
none, because a hardcoded verb list goes stale the moment the CLI changes.

- Run `.aspen/bin/aspen --help` to see the top-level commands, then `--help` on the one command
  you are about to run for its exact verbs, arguments, and flags. Read help for the task in front
  of you, not the whole tree.
- If a capability seems to be missing, check help before concluding it is — do not guess a verb or
  a flag and run it hopefully.
- The CLI is agent-aware: it detects when an agent is driving it and adjusts its output. You can
  force this with `--agent yes`; prefer it for structured, non-interactive output.

## Router

| Moment | Go to |
|--------|-------|
| You need to know the instance's model — what `_p` exists and is extendable, or what `_c` you have | `read-metadata` |
| You need to understand the model, not just list it — conventions, relationships, extension points | `map-model` |
| Authoring, compiling, or deploying a change | discover the commands with `.aspen/bin/aspen --help` and run the loop |
| You created or extended an object, or it cannot be seen in the UI | `complete-object-ui` |
| A checkin or deploy succeeded and you need to prove the change actually works | `verify-change` |
| A compile, checkin, or deploy failed, or the instance is behaving unexpectedly | `diagnose` |

Always read the model with `read-metadata` before you extend a `_p` component or author a `_c` one.
The plugin keeps a Markdown digest of the instance's metadata at `.aspen-model/`, refreshed on
session start and after every download — start there, and check its freshness stamp before you
trust it.

## Non-negotiables

- **Builder owns the instance folder — never run `aspen init`.** It scaffolds a Rust crate, a
  TypeScript project, and its own `AGENTS.md` and `CLAUDE.md` into the folder. None of that is
  needed to customize a CRM, and those last two compete with these skills. Builder creates the
  folder; when it is missing, the human opens the instance in Builder.
- **Never handle the human's credentials.** Signing in (`aspen login`) is a browser hand-off you
  start and the human completes. You never see, type, ask for, or print a token.
- **The instance is shared.** Some `aspen move` operations clear the dev set or halt an in-flight
  checkin, which reaches other builders' work. Confirm with the human before anything that clears,
  halts, or resets. The `guard-destructive` hook stops and asks on those commands too, but that is
  a backstop — the approval happens in the conversation, before you run anything.
- **Nothing is deleted on the platform.** Metadata and records cannot be deleted, so anything you
  create while testing is permanent — say so before the human starts.
- **The instance validates, you do not.** Do not re-implement validation locally; deploy and route
  on the errors the CLI reports back.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "I'll `cd` to the instance folder and work from here" | The hooks follow the session's directory, not your shell's. Have the human reopen Claude Code there. |
| "There is no instance folder, so I'll run `aspen init`" | Builder creates it. `init` adds a Rust crate, a TypeScript project and a rival `CLAUDE.md`. |
| "`aspen <verb>` probably exists" | This plugin lists no verbs. Run `.aspen/bin/aspen --help` and confirm. |
| "`aspen` is not found, so I'll find it or put it on `PATH`" | It is at `.aspen/bin/aspen` in the instance folder. Run it by that path. |
| "I'll guess the object or field names" | Read them with `read-metadata`; the instance is the source of truth. |
| "I'll hand-write the metadata from memory" | Pull the active set and copy the shape of a real component. |
| "I'll validate the change myself first" | The instance validates on checkin. Deploy and read its errors. |
| "I'll add the companion field too" | Derived members are added by the instance. Authoring one is a checkin error. |
| "The overlay file shows one field, so that's the object" | A component spans layers. Read the resolved view, not one file. |
| "The checkin was green, so the change works" | Green means it compiled. Prove it with `verify-change`. |
| "The object is created, so the model is done" | An object with no layout has records nobody can open. Run `complete-object-ui`. |
| "I'll change this and re-run to see if it sticks" | That is probing on a shared instance. Reproduce and localize with `diagnose`. |
