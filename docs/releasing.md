# Releasing

Every tool in this repository is released independently. There is no
repo-wide version, and no release ever covers two tools at once.

## Tags are prefixed by tool

A release tag names the tool, then its version:

```
builder-v0.11.0
plugin-v1.0.0
```

The prefix is what keeps the tools independent: GitHub keys a release to a
tag, so `builder-v0.12.0` and `plugin-v1.1.0` are unrelated events that can
happen in either order, or a month apart. A bare `v1.2.3` tag would force one
version onto everything here, which is exactly what this layout avoids.

Adding a tool later means picking a new prefix. Nothing else changes.

## Builder

Source lives in the private `aspen-crm/aspen-builder`. The installers are
built there and published HERE, so a download link can be handed to someone
who has no access to the source.

**Two files are published: macOS on Apple silicon, and Windows on x64.** That
covers everyone we hand a link to. `npm run package:mac` and
`npm run package:win` also produce an Intel mac build, an Arm Windows build and
a universal Windows installer; those stay in `aspen-builder/release/` and are
available on request. They are not published because every extra file on a
download page is one more chance to pick the wrong one.

### The notes are public, and are written by hand

This page is read by people who do not have the source, do not know our ticket
numbers, and have no interest in which file changed. Keep it to a few lines,
in their words. The private release in `aspen-builder` is where the detail
belongs, and the two are not the same text.

Say what someone will notice:

> Sign-in works again on current instances.

Not what we did:

> Fixed `resolveInstanceUrl` to probe `/` and read the redirect (VX-4090).

Leave out file paths, function names, ticket numbers, internal repo names and
platform internals.

### Publishing

1. Cut the release in `aspen-builder` as usual (version bump, `vX.Y.Z` tag).
2. Build both platforms there: `npm run package:mac` and `npm run package:win`.
3. From this repository, stage a draft:

```bash
./scripts/publish-builder.sh 0.11.0
```

   The first run writes `release-notes/builder-v0.11.0.md` from a template and
   stops. Edit it into real notes, then run the same command again: it uploads
   the installers to a **draft** release, so nothing is downloadable and
   nothing is listed.

4. Read the draft on GitHub. The script prints its URL.
5. Publish:

```bash
./scripts/publish-builder.sh 0.11.0 --go-live
```

   It shows the notes once more and asks you to type the version to confirm.
   Only this step makes anything public, and it is also what updates
   `builder-latest`.

`--dry-run` at any point prints the files and the notes and uploads nothing.

### What the script refuses to do

- publish a version whose installers are not on disk -- it names the build
  command instead of creating an empty release, which is what happened by hand
  on v0.11.0;
- publish notes that are still the template, or empty;
- go live without a staged draft, or without the version typed back.

It warns, without blocking, when the notes run past ~1200 characters -- long
usually means private detail has leaked in.

### `builder-latest`

`builder-latest` is a fixed tag whose assets are the same two installers under
version-less names, overwritten on each publish. That is what keeps the
README's download links permanent.

It is deliberately **not** GitHub's own `/releases/latest/`, which resolves to
the most recent release ACROSS THIS WHOLE REPOSITORY -- so publishing a
`plugin-` release would silently repoint every Builder download link at a
release holding no installers, 404ing with nothing to say why.

The versioned `builder-vX.Y.Z` release remains the archive, and the only way to
get a specific older build.

The macOS build is unsigned unless a signing identity is configured, so a first
open needs right-click then Open. Worth saying wherever the link is handed out.

## The Claude plugin

The plugin is NOT installed from a release. Claude Code reads
`.claude-plugin/marketplace.json` at the root of this repository, so what a
user installs is the repository's CONTENTS at the ref they add:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen@aspen
```

That means a change to `plugins/aspen/` is live for anyone adding or updating
the marketplace as soon as it lands on the default branch. A `plugin-vX.Y.Z`
tag and release is therefore a MARKER and a changelog, not the delivery
mechanism -- useful for saying what changed and for pinning, not for getting
the code to people.

Keep `plugins/aspen/.claude-plugin/plugin.json`'s `version` in step with the
tag when you cut one, so a user reading the installed plugin's version can
find the matching release notes.

## Adding another tool

1. Put it under `plugins/<name>/` if it is a Claude plugin, and add it to the
   `plugins` array in `.claude-plugin/marketplace.json` with
   `"source": "./plugins/<name>"`. If it is a binary, it needs no directory
   here at all -- only releases.
2. Give it a tag prefix.
3. Add a section to the README saying how to get it.
