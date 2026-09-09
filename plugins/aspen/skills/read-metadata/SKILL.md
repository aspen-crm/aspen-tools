---
name: read-metadata
description: Use before authoring or changing anything, or to answer "what does our model look like" — read the instance's metadata (platform _p, app, and custom _c tiers) as the source of truth instead of guessing object, field, picklist, or layout shapes.
---

# Read the instance's metadata

The **instance is the source of truth** for the model. Read it before you extend a `_p` component
or author a `_c` one — never guess an object, field, picklist, or layout shape from memory.

## Start at the digest

The plugin keeps a Markdown index of the downloaded metadata at `.aspen/model/`, rebuilt on session
start and after every download. Three levels, smallest first:

1. `.aspen/model/index.md` — the map: tiers, counts, when it was built, whether it is stale.
2. `.aspen/model/<tier>.md` — every component in that tier. **Grep these, do not read them whole**;
   a real platform tier runs to thousands of rows.
3. `.aspen/model/<tier>/<component>.md` — one component's attributes, and the path to its source file.

Where a mapper has been through a component type, `.aspen/model/maps/<tier>__<type>.md` says what
that type *means* — conventions, relationships, extension points. `index.md` marks which maps exist
and which have gone stale. Missing or stale, and the question needs understanding rather than a
name? Invoke `map-model`.

```
grep -i "account" .aspen/model/platform.md    # find it, get its detail path
cat .aspen/model/platform/<detail>.md         # attributes + source path
```

The digest is an **index into the downloaded metadata, not a copy of it**, and its parsing is
best-effort. Before you author against a component, open the source file its detail page names and
copy the shape from there.

If `.aspen/model/` is missing, pull the metadata (below) — it builds itself on the next download.

## Pull it with the CLI

Find the exact command with `aspen --help` and `aspen move --help` before you run anything — do not
assume the flags. As of today the relevant commands are:

- `aspen init` — creates the local instance directory, including its metadata, for the instance you
  are logged in to.
- `aspen move download-active-set` — downloads the active set's platform, app, and custom metadata
  into local per-tier directory trees.

Confirm their current flags from `--help`; if these names have changed, the help output wins.

## Read it by tier

The metadata is split by tier, in the local tree and in the digest alike:

- **platform** — the `_p` components Aspen delivers. This is what you extend. Whether a given
  component or attribute is customer-extendable is part of the component's own definition and is
  enforced by the instance on checkin, so read the component and let validation be the authority —
  this skill does not carry extendability rules that would go stale.
- **app** — components delivered by installed apps.
- **custom** — the `_c` components you have authored.

## Trust the freshness stamp

`index.md` says when it was built and flags itself stale when you check in or deploy — the instance
moved, your local copy did not. **A stale digest is not a model you can author against.** Re-pull
with `aspen move download-active-set`; the digest rebuilds itself from the download.

Re-pull too before touching something you have not looked at recently, so you are working against
the instance's current state and not a stale local copy.

## Use what you read

- When you extend a `_p` component or author a `_c` one, copy the shape of a real component you
  just read rather than inventing it.
- The digest tells you what exists and where it lives. A map tells you how the type behaves. The
  source file tells you what it looks like — and it is the only one of the three you author against.
