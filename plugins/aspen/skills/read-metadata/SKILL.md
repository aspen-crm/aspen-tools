---
name: read-metadata
description: Use before authoring or changing anything, or to answer "what does our model look like" — read the instance's metadata (platform _p, app, and custom _c tiers) as the source of truth instead of guessing object, field, picklist, or layout shapes.
---

# Read the instance's metadata

The **instance is the source of truth** for the model. Read it before you extend a `_p` component
or author a `_c` one — never guess an object, field, picklist, or layout shape from memory.

## Pull it with the CLI

Find the exact command with `aspen --help` and `aspen move --help` before you run anything — do not
assume the flags. As of today the relevant commands are:

- `aspen init` — creates the local instance directory, including its metadata, for the instance you
  are logged in to.
- `aspen move download-active-set` — downloads the active set's platform, app, and custom metadata
  into local per-tier directory trees.

Confirm their current flags from `--help`; if these names have changed, the help output wins.

## Read it by tier

After pulling, read the local files, which are split by tier:

- **platform** — the `_p` components Aspen delivers. This is what you extend. Whether a given
  component or attribute is customer-extendable is part of the component's own definition and is
  enforced by the instance on checkin, so read the component and let validation be the authority —
  this skill does not carry extendability rules that would go stale.
- **app** — components delivered by installed apps.
- **custom** — the `_c` components you have authored.

## Use what you read

- When you extend a `_p` component or author a `_c` one, copy the shape of a real component you
  just read rather than inventing it.
- Re-pull after a deploy, or before touching something you have not looked at recently, so you are
  working against the instance's current state and not a stale local copy.
