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

1. Cut the release in `aspen-builder` as usual (version bump, `vX.Y.Z` tag).
2. Build both platforms there: `npm run package:mac` and `npm run package:win`.
3. From this repository:

```bash
./scripts/publish-builder.sh 0.11.0 --dry-run   # names the files it will send
./scripts/publish-builder.sh 0.11.0
```

The script does both halves of a publish and is the only thing that needs
running:

- creates `builder-vX.Y.Z` carrying the two installers under their real,
  versioned names, so a downloaded file is self-describing once it is sitting
  in someone's Downloads folder;
- overwrites `builder-latest` with the same two files under version-less
  names, which is what keeps the README's download links permanent.

It refuses to publish a version whose installers are not on disk, rather than
creating an empty release -- which is exactly what happened by hand once.

`--clobber` on the `builder-latest` upload is what makes it an update: without
it the upload is rejected because an asset of that name already exists.

**`builder-latest` is a fixed tag, and deliberately not GitHub's own
`/releases/latest/`.** That resolves to the most recent release ACROSS THIS
WHOLE REPOSITORY, so publishing a `plugin-` release would silently repoint
every Builder download link at a release holding no installers. The links would
404 with nothing to say why.

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
