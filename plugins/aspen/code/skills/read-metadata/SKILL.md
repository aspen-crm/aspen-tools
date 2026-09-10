---
name: read-metadata
description: Use before authoring or changing anything, or to answer "what does our model look like" — read the instance's metadata as the source of truth instead of guessing object, field, picklist, or layout shapes, and check the digest's freshness before trusting it.
---

# Read the instance's metadata

The **instance is the source of truth** for the model. Read it before you extend a
delivered component or author a custom one — never guess an object, field, picklist, or
layout shape from memory.

## Ask the reader

The plugin keeps a Markdown digest of the downloaded metadata at `.aspen-model/`, built
on session start and after every download. Do not walk it yourself: spawn
`aspen-model-reader` with the question or the task, and it comes back with the
components involved, their layers and paths, a real component's source to copy, the
derived members to leave alone, and the digest's freshness. One reader per question;
several questions, several readers in one message.

A single name lookup is the exception — `grep -i "account" .aspen-model/types/*.md` is
faster than an agent. Anything that needs a second file is the reader's.

Where a mapper has been through a type, `.aspen-model/maps/<ctype>.md` says what that
type *means*. Missing or `(stale)`, and the question needs understanding rather than a
name? Invoke `map-model`.

If `.aspen-model/` is missing: in a Builder instance folder the session-start hook builds
it, so the session is not rooted there — ask the human to reopen Claude Code in it.
Anywhere else, run the plugin's `detect` to write `aspen-model.json`, then `build`.

## Four layers, one component

A component exists in up to four layers, and its page lists the ones it has:

- **baseline** — what Aspen delivers. Platform-owned members only.
- **liveOverlay** — the customer overlay live on the instance, `extends`-keyed, carrying
  only what was added.
- **authored** — the overlay authored locally, not yet checked in.
- **resolved** — the real merge, with platform defaults filled in.

**No single layer is the truth.** A delivered object and its overlay are one component,
and reading either alone gets you a wrong answer — the overlay looks like a one-field
object, and the baseline is missing everything the customer added.

A page marked **unresolved** has no resolved layer, so its member list is what was
authored, not what the instance has. Treat that count as a floor, not a fact.

## Never author a derived member

Some members exist on the instance that appear in no authored file — audit and identity
fields on every object, currency companions, polyid companions. A component page marks
these **derived — do not author**, and `index.md` lists the rules the digest inferred
from this instance's own files.

Authoring one of these alongside your own field is a checkin error. If you add a
currency field, the platform adds its companion; you do not.

## Trust the freshness stamp

`index.md` flags itself stale when you check in or deploy — the instance moved, your
local copy did not. **A stale digest is not a model you can author against.** Re-pull,
and the digest rebuilds itself from the download.

Re-pull too before touching something you have not looked at recently.

## Use what you read

- When you extend a delivered component or author a custom one, copy the shape of a real
  component you just read rather than inventing it.
- The digest tells you what exists and where it lives. A map tells you how the type
  behaves. The source file tells you what it looks like — and it is the only one of the
  three you author against. The reader brings it back verbatim; design against that.
- Find the exact CLI command with `.aspen/bin/aspen --help` and `.aspen/bin/aspen move --help`
  before you run anything. Do not assume the flags; the help output wins.
