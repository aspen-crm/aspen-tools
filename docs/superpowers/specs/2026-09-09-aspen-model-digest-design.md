# Aspen model digest — design

**Date:** 2026-09-09
**Status:** approved, ready for implementation planning
**Supersedes:** PR #1 (closed unmerged)

## Problem

Reading an Aspen instance's model means paging through a tree of per-component JSON
files. An agent that guesses instead gets object and field shapes wrong, and the
instance only says so at checkin.

PR #1 tried to solve this and failed on contact with real data. It assumed a
`platform/` / `app/` / `custom/` directory convention taken from the CLI's help text.
That convention does not exist on disk: `aspen move download-active-set` takes
`--platform-dir` / `--app-dir` / `--custom-dir` and writes `<ctype>/<name>.json` under
whatever roots the caller passes. Tested against four real instances
(`veeva.com-treehouse`, `vx`, `mithra`, `lynx`), the digest found nothing in all four,
and its SessionStart hook was silent — indistinguishable from a non-Aspen project.

The deeper error was the data model. PR #1 partitioned files into tiers, but tier is
not a property of a file.

## The four layers

An Aspen `metacode/` tree holds four layers of the same component. Using `contact_p`
in `veeva.com-treehouse`:

| Layer | Path | `contact_p` | Role |
| --- | --- | --- | --- |
| baseline | `platform/` | 22 fields, no `extends` | delivered, platform-owned members only |
| live overlay | `active/` | 1 field, `extends: contact_p` | the customer overlay live on the instance |
| authored overlay | `metadata/` | — (empty here) | local custom source; what gets packaged and checked in |
| resolved | `compiled/` | **31 fields** | both namespaces merged, platform defaults filled in |

`active/` and `metadata/` are different layers, not the same one under two names:
`active/` is the overlay live on the instance, `metadata/` is the overlay authored
locally. Where they differ is exactly what has not been checked in yet.

The platform uses this vocabulary itself — `.aspen/state.json` stores `baselineSource`
and `baselineOverlaySource` per component, keyed `ctype:name`.

Consequences that constrain any design:

- Every component-type directory is `_p`-suffixed (`object_p`, `layout_p`) because
  component *types* are platform-defined. Directory suffix cannot carry tier.
- Filename suffix cannot carry tier either. `active/object_p/contact_p.json` is
  customer content, so reading tier from the name files a customer extension as
  delivered platform metadata — exactly backwards.
- The real signal is `extends` (present means overlay) plus `_c` on the members added
  inside it.
- `_a` (app) is no longer a tier. Treehouse: 328 components, all `_p`, zero `_a`. Only
  older projects such as `vx` still carry `_a` files.
- `.aspen/` is Builder's private, gitignored cache. Its README says the files there are
  never authored source and must not be hand-edited. Nothing generated goes there.

## Data model

Index keyed `(ctype, name)` — one entry per component, never one per file. PR #1 keyed
by path, which reported `contact_p` twice (22 attributes and 1 attribute) with nothing
saying which was authoritative. An agent opening the wrong page concluded `contact_p`
was a one-field object.

Each entry carries the layers that exist for it and states which one answered:

- **`compiled/` is the merge.** Where present, read it rather than recomputing.
- **Where absent** (48 of 187 components in treehouse, because `compiled/` is populated
  lazily), fall back to baseline + overlay and label the entry `unresolved`.
- "22 fields" and "31 fields" are different claims. Every entry says which it is making.
- The live/authored gap is derivable and worth surfacing: it is what has not been
  checked in.

## Derived fields

Some members appear in no authored file. On every object, `compiled/` carries
`id_p, cb_p, mb_p, ct_p, mt_p, smb_p, smt_p, extid_p` — present in 48/48 compiled
objects and 0/48 baseline files. A currency field adds companions; a polyid field adds
`on`/`dn` companions; `included-polyids` on the *target* object is the opt-in.

An agent that reads only baseline + overlay is therefore missing fields the instance
has. An agent authoring `total_c` must not also author `totalcc_c`, because the
platform adds it.

Rules are **inferred from the instance's own files on rebuild**, never hardcoded, so a
platform change arrives with the next download rather than a plugin release. A spike
recovered the standard 8 and the full polyid rule from treehouse alone.

Output has two tiers:

- **Per-component observations — always.** Which members exist in `compiled/` that no
  authored file contains. This is fact, not inference.
- **General rules — only at ≥3 distinct objects**, each carrying its evidence count.

The threshold is empirical, not chosen. Rules the spike found:

| Rule | Evidence | Verdict |
| --- | --- | --- |
| standard fields | 48 objects | real |
| polyid `on`/`dn` | 22 examples | real |
| `ccode_p`/`ccdate_p` ← currency | 1 object | true, but unprovable from this data |
| `_set_at` ← number | 2 objects | **noise** — `rel_strength_set_at_p` is an ordinary authored platform field |
| `_role_chk` ← id/parent | 2 objects | **noise** — `contact_role_chk_p` is an authored uniqueness key; matched on a shared name stem |

Everything at n≥17 was real; both n=2 rules were coincidence. Requiring 3 distinct
objects drops the noise without hand-picking a cutoff.

Thin rules are dropped entirely rather than shipped with a warning label. The
per-component observations still expose the underlying facts — `ccode_p` and `ccdate_p`
are reported as derived on `opportunity_p` — so the pattern remains learnable by
reading the entry, without the digest asserting a rule it cannot support.

**Unconfirmed:** `total_c` → `totalcc_c`, and `ccode_p`/`ccdate_p` being added when
`total_c` is the first currency field on an object. Treehouse has no customer currency
field, so this could not be verified. Confirming it needs an instance that has one.

## Config and detect

`aspen-model.json` at project root, committed, naming the roots and the output
directory:

```json
{
  "roots": {
    "baseline":    "metacode/platform",
    "liveOverlay": "metacode/active",
    "authored":    "metacode/metadata",
    "resolved":    "metacode/compiled"
  },
  "out": ".aspen-model"
}
```

A `detect` command scans for `<ctype>/` directories of JSON, proposes the roots, and
writes the file for review. Detection runs once and leaves a reviewable diff, rather
than re-guessing every session.

Roots are classified by **sampling file content**, not by directory name, since names
vary by producer. Measured on treehouse:

| Signal in sampled files | Classified as | treehouse |
| --- | --- | --- |
| `_derived` block present | resolved | `compiled/` — 139/139 |
| `extends` present | an overlay | `active/` — 2/2 |
| neither | baseline | `platform/` — 187 files, 0 and 0 |

Two cases content cannot settle, and both are why `detect` writes a file for a human to
confirm instead of acting on its own:

- **An empty directory** has nothing to sample. `metadata/` is empty in treehouse.
  Fall back to the directory name, and mark the entry as low-confidence in the written
  file.
- **Two populated overlays** both carry `extends`, so live and authored cannot be told
  apart by content. Fall back to directory name and mark both for confirmation.

`detect` never overwrites an existing config; it writes a proposal and reports the diff.

When no config exists, the hook prints one line naming `detect`. It is never silent —
being silently inert is how PR #1 failed.

`detect` and a future `aspen init` write the same file, so the CLI can start emitting
it later with no change on the reading side.

## Output

`.aspen-model/` at project root — never `.aspen/`.

- **The index is gitignored.** Cheap to rebuild (under a second on 3,200 components)
  and it churns on every download.
- **`maps/` is committed.** Expensive LLM output, stable, and teammates should inherit
  it without paying to regenerate it.

The digest writes its own `.aspen-model/.gitignore` so the split needs no setup by the
project:

```gitignore
*
!.gitignore
!maps/
!maps/**
```

This ignores everything generated while keeping `maps/` tracked. Because the file is
inside the output directory, a rebuild that stages and swaps must re-emit it.

## Hooks and freshness

Kept from PR #1, which got this part right:

- **SessionStart** rebuilds only if the metadata changed; silent in non-Aspen projects.
- **PostToolUse** rebuilds after a download, and marks the digest stale after a checkin
  or deploy, because the instance moved and the local copy did not.
- Neither touches the network. The digest is a pure function of files on disk, so it
  works offline and cannot hang a session.
- Rebuilds stage into a temporary directory and swap at the end, so a crash mid-rebuild
  cannot destroy the maps — the one artifact that cannot be cheaply regenerated.
- In a hook an unexpected throw prints one line and exits 0; run by hand it exits
  non-zero.

## Mapper fan-out

Kept from PR #1. Indexing is mechanical, so a script does it — spawning an agent to
transcribe a file is the expensive way to run `cat`. Understanding is not mechanical,
so one `aspen-component-mapper` runs per component type, in parallel, each writing a
map of shape, conventions, relationships, extension points, and what it could not read.
Mappers get `Read`, `Grep`, `Glob`, `Write` and no `Bash`, so they cannot run the CLI
or reach the network.

Maps record the signature of the files they were built from, so a re-map only redoes
what moved.

## Testing

Treehouse is committed as a fixture — the thing PR #1 claimed 13 tests against and
shipped none of. Assertions that bite:

1. `contact_p` resolves to exactly one entry, not two.
2. Its resolved field count is 31, and the entry is labelled resolved-from-compiled.
3. A component with no compiled file is labelled unresolved and reports the
   baseline+overlay count.
4. The standard 8 are classified derived, and appear in 0 baseline files.
5. The polyid rule is inferred with its real evidence count.
6. Both n=2 noise rules are absent from the output.
7. `detect` proposes treehouse's four roots correctly.
8. With no config, the hook prints the detect line and exits 0.
9. A crash mid-rebuild leaves the previous index and maps intact.

## Non-goals

- Replacing the source files. The digest indexes the download; the source file is what
  you author against, and the instance validates on checkin and remains the only
  authority.
- Reaching the network, or running the `aspen` CLI, from the digest or the mappers.
- Supporting the `app` tier.
- Recomputing a merge that `compiled/` already provides.
