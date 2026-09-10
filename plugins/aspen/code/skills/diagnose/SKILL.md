---
name: diagnose
description: Use when a compile, checkin, or deploy fails, or the instance behaves unexpectedly — reproduce the failure and find which phase actually broke before changing anything. No fix without a reproduction.
---

# Diagnose

For a failed compile or checkin, or an instance doing something you did not expect.
**No fix without a reproduction and a root cause first.** A change made from a guess
either does nothing or hides the problem under a second one.

## The rule

Reproduce it, localize it to a phase, understand it, *then* fix it. If you cannot
reproduce it, you do not yet know what to fix — say so rather than changing files
hopefully.

## 1. Reproduce

Re-run the failing command with `--debug`, which the CLI documents as verbose
diagnostics, and `--agent yes` so the output is structured rather than shaped for a
human. Capture what it printed. That text is the evidence; everything below reads it.

If the second run succeeds, you have a different and more interesting problem — an
ordering or shared-state issue. Do not move on because it passed.

## 2. Localize: which phase broke?

Checking in is not one step. `.aspen/bin/aspen move --help` lists the chain, and it runs in order:

| Phase | What failing there means |
|--------|--------------------------|
| `save-package` | The instance would not take the package at all — shape, auth, or reachability, before any rule ran. |
| `checkin-prep` | The package landed, and validation rejected it. This is the metadata's own problem: a bad reference, a member that cannot be authored, a name that does not match. |
| `checkin-index` | Index creation out of the package failed — usually a field the index needs, or a conflict with what the instance already has. |
| `checkin-deploy` | The final check-in. The set validated and something still refused it. |

**Which phase you got to is most of the diagnosis.** A failure in `checkin-prep` is a
file you wrote; a failure in `save-package` usually is not. Find where the chain stopped
before you form any theory about why.

Two things widen the blast radius and are worth ruling out early:

- **The dev set is shared.** Validation runs over everything staged on the instance, so
  the component that broke the chain may be someone else's. Read the name the CLI
  reported before assuming it is yours.
- **Your local model may be stale.** If the digest carries a stale stamp, you may be
  authoring against a model the instance no longer has. Re-pull and re-read with
  `read-metadata` before debugging the file.

## 3. Understand before you touch anything

- Read the component the CLI named, in its **source** file — not in the digest, not in a
  map. Both are reading aids, and a parse can be wrong where the source is not.
- Compare it against a component of the same type that already checks in cleanly. The
  instance is the authority on what a valid one looks like; copy a real one rather than
  reasoning about what the rule ought to be.
- **Never probe by trial and error.** Guessing an attribute name or an enum value and
  re-running the chain to see if it sticks burns the shared dev set and teaches you
  nothing. Read a working component instead — the answer is in one file.

## 4. Fix, then prove

Change one thing, re-run the chain, and check the phase you were failing at now passes.
Changing several things at once means a pass tells you nothing about which one mattered.

Then close the loop: a checkin that succeeded proves the metadata compiled, not that the
change works. Go to `verify-change`.

## Recovery — the shared-state escape hatches

When a checkin is wedged, `.aspen/bin/aspen move --help` documents two commands that clear instance
state. Both reach **every builder on the instance**, not just your package:

- `clear-package` — clears this package's contents from the instance's dev set.
- `checkin-clear` — halts an active checkin and erases the dev *and* dev-checkin sets.

These are legitimate recovery, not forbidden. But they are the human's call: say plainly
what will be erased and who else could be mid-checkin, and wait for a clear yes. The
plugin's `guard-destructive` hook will also stop and ask — that is a backstop, not the
approval. The approval happens in the conversation.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "I'll change this and see if it works" | That is probing, not diagnosis. Reproduce and localize first. |
| "The error mentions this field, so that's the bug" | The named component may be someone else's, staged in the shared dev set. |
| "I'll just clear the checkin to get unstuck" | That erases other builders' staged work. Ask the human first. |
| "The digest says the field exists" | The digest may be stale, and it is a reading aid. Open the source file. |
| "It passed the second time, so it's fixed" | An intermittent failure is a real failure. Find out why it varied. |
