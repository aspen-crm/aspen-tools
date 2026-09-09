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

1. Cut the release in `aspen-builder` as usual (version bump, `vX.Y.Z` tag).
2. Build both platforms: `npm run package:mac` and `npm run package:win`.
   Artifacts land in that repo's `release/`.
3. Publish here under `builder-vX.Y.Z`, attaching the installers.

Attach the `.dmg` and `.exe` files. The `.blockmap` files serve
electron-updater's delta downloads and are only worth attaching if something
here is actually auto-updating from these releases.

Note the mac builds are unsigned unless a signing identity is configured, so
a first open needs right-click then Open. That is worth saying on any page
that hands the link to someone outside the team.

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
