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

### Then update `builder-latest`

`builder-latest` is a release that exists so the download links never change.
Its assets are the SAME installers under version-less names, replaced on every
Builder release, so these URLs are permanent:

```
https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-arm64.dmg
https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder.dmg
https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-Setup-arm64.exe
https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-Setup-x64.exe
https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-Setup.exe
```

Rename a copy of each installer to drop the version, then overwrite in place:

```bash
V=0.11.0
SRC=../aspen-builder/release
for pair in \
  "Aspen Builder-$V-arm64.dmg:Aspen-Builder-arm64.dmg" \
  "Aspen Builder-$V.dmg:Aspen-Builder.dmg" \
  "Aspen Builder-$V-Setup-arm64.exe:Aspen-Builder-Setup-arm64.exe" \
  "Aspen Builder-$V-Setup-x64.exe:Aspen-Builder-Setup-x64.exe" \
  "Aspen Builder-$V-Setup.exe:Aspen-Builder-Setup.exe"; do
  cp "$SRC/${pair%%:*}" "/tmp/${pair##*:}"
done
gh release upload builder-latest /tmp/Aspen-Builder-*.dmg /tmp/Aspen-Builder-*.exe --clobber
```

`--clobber` is what makes it an update rather than a failure: without it the
upload is rejected because the asset name already exists.

Say which version `builder-latest` currently holds in its release notes. It is
the only thing distinguishing it, since the filenames deliberately do not.

**Do not use GitHub's own `/releases/latest/download/...`.** That resolves to
whatever release is most recent ACROSS THIS WHOLE REPOSITORY, so publishing a
`plugin-` release would silently repoint every Builder download link at a
release that has no installers in it. The links would 404 with nothing to say
why. `builder-latest` is a fixed tag and cannot be moved by another tool's
release.

The version-less names are also why the versioned `builder-vX.Y.Z` release
still matters: it is the archive, and the only place to get a specific older
build.

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
