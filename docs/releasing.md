# Releasing

Every tool in this repository is released independently. There is no
repo-wide version, and no release ever covers two tools at once.

## Tags are prefixed by tool

A release tag names the tool, then its version:

```
builder-v0.11.0
stdio-mcp-v0.1.14
aspen-code--v1.4.0
aspen-cowork--v0.1.8
```

The prefix is what keeps the tools independent: GitHub keys a release to a
tag, so `builder-v0.12.0` and `aspen-code--v1.5.0` are unrelated events that
can happen in either order, or a month apart. A bare `v1.2.3` tag would force
one version onto everything here, which is exactly what this layout avoids.

**The two plugins get a prefix each**, not a shared `plugin-` one. They are
versioned separately and change for unrelated reasons, so a single prefix
would make every `aspen-code` release look like it said something about
`aspen-cowork`.

The plugins use `--v` rather than Builder's `-v` because that is what
`claude plugin tag` produces, and cutting the tag with that command is worth
more than a consistent separator -- it refuses to tag unless `plugin.json`
and the marketplace entry agree on the name and version, which is exactly the
mistake nobody catches by eye. Builder and the runtime MCP keep `-v`: their
tags are cut by hand or by `scripts/publish-builder.sh`, and several are
already public.

No plugin tag has been cut yet, so nothing is carrying an older spelling.

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

### Most versions never become public

Builder is released privately as often as it needs to be. Publishing is the
exception, and the script is built around that asymmetry: every guard below
exists to make a public release something you can only do on purpose.

**It refuses to:**

- publish a version that is not a release in `aspen-builder`. A local build, a
  typo'd version or an abandoned tag cannot reach the public repo, because the
  public set is only ever a subset of the private one;
- re-stage a release that is already public. `gh release edit --draft` on a
  live release HIDES it, so re-running phase 1 would have taken a published
  release down and put it back with a gap in between;
- publish a version whose installers are not on disk -- it names the build
  command instead of creating an empty release, which is what happened by hand
  on v0.11.0;
- publish notes that are still the template, or empty;
- go live without a staged draft, or without the version typed back;
- move `builder-latest` BACKWARDS. Re-publishing an older version is a normal
  thing to want; silently making it what everyone downloads is not, and
  nothing about the download link would look wrong afterwards. The versioned
  release still publishes; only the pointer is left alone.

**It tells you, without blocking:**

- which versions were released privately since the last public one and are
  therefore staying private. That list is the whole point: it makes "not
  publishing" a thing you see rather than a thing you forget;
- when the notes run past ~1200 characters, where private detail has usually
  leaked in.

### `builder-latest`

`builder-latest` is a fixed tag whose assets are the same two installers under
version-less names, overwritten on each publish. That is what keeps the
README's download links permanent.

It is deliberately **not** GitHub's own `/releases/latest/`, which resolves to
the most recent release ACROSS THIS WHOLE REPOSITORY.

**This is no longer hypothetical.** `/releases/latest/` currently resolves to
`stdio-mcp-v0.1.14`, which holds no installers -- so a Builder link written
against it would 404 today, with nothing on the page to say why. Every download
link in the README points at a FIXED tag (`builder-latest`, `stdio-mcp-latest`)
for exactly this reason. Keep it that way: a link that names a release by
recency belongs to whichever tool shipped last.

The versioned `builder-vX.Y.Z` release remains the archive, and the only way to
get a specific older build.

The macOS build is unsigned unless a signing identity is configured, so a first
open needs right-click then Open. Worth saying wherever the link is handed out.

## Runtime MCP

The source is private and lives elsewhere; the `.mcpb` bundles are built there
by `release-runtime-mcp.yml` and published HERE, so a download link can be
handed to someone who has no access to the source. Anyone who needs the source
already knows where it is -- this page is read by people who do not.

**Two files are published: macOS and Windows.** Claude Desktop, which is what
installs an `.mcpb`, runs on those two only. The workflow also builds
`linux-x86_64` and `linux-aarch64` for other hosts that launch a local MCP
server; those stay on the build and are available on request.

The macOS bundle is universal, so unlike Builder there is no second mac file.

The version is whatever the bundle says about itself. Read it before tagging,
and make the tag match -- a user who checks their installed version has to be
able to find the matching release:

```bash
unzip -p aspen-runtime-mcp-macos.mcpb manifest.json | grep -o '"version":"[^"]*"'
```

### Publishing

There is no script yet; Builder's guards are about a public subset of a private
release line, which does not apply here. By hand:

```bash
VERSION=0.1.14
TAG="stdio-mcp-v$VERSION"

# versioned release: the archive, with versioned filenames
cp aspen-runtime-mcp-macos.mcpb   "aspen-runtime-mcp-$VERSION-macos.mcpb"
cp aspen-runtime-mcp-windows.mcpb "aspen-runtime-mcp-$VERSION-windows.mcpb"
gh release create "$TAG" \
  "aspen-runtime-mcp-$VERSION-macos.mcpb" \
  "aspen-runtime-mcp-$VERSION-windows.mcpb" \
  --repo aspen-crm/aspen-tools \
  --title "Aspen Runtime MCP $VERSION" --notes-file notes.md

# stdio-mcp-latest: version-less filenames, overwritten each time
gh release upload stdio-mcp-latest \
  aspen-runtime-mcp-macos.mcpb aspen-runtime-mcp-windows.mcpb \
  --repo aspen-crm/aspen-tools --clobber
gh release edit stdio-mcp-latest --repo aspen-crm/aspen-tools \
  --notes "Always the current Aspen Runtime MCP. Currently $VERSION."
```

`stdio-mcp-latest` is a fixed tag created with `--latest=false`, for the same
reason `builder-latest` is: GitHub's own "Latest" resolves across the whole
repository, so a `builder-` release would silently repoint every MCP download
link at a release holding no bundles.

Do not move `stdio-mcp-latest` backwards. The versioned release is the archive
and can be published for any version; the pointer everyone downloads should
only go forward.

It is paired with the `aspen-cowork` plugin, and the pairing runs one way: the
plugin teaches tools the server owns. **The server is the authority on both the
tool names and the error codes.** A server release that renames a tool or drops
an error code breaks the plugin's guidance without changing a file in
`plugins/aspen/cowork/`, and nothing here will fail to build. When the server
moves, re-read the cowork skills against it and cut a plugin release too.

### The notes are public

Same rule as Builder: written by hand, in the words of someone who does not
have the source. Say what a person will notice, not what changed in the code.

## The Claude plugins

Two plugins ship from `plugins/aspen/`, and they are separate products:

| Plugin | Directory | Lane | Tag |
| --- | --- | --- | --- |
| `aspen-code` | `plugins/aspen/code/` | Author metadata with the `aspen` CLI | `aspen-code--vX.Y.Z` |
| `aspen-cowork` | `plugins/aspen/cowork/` | Work live records over the runtime MCP | `aspen-cowork--vX.Y.Z` |

**In Claude Code, neither is installed from a release.** Claude Code reads
`.claude-plugin/marketplace.json` at the root of this repository, so what a
user installs is the repository's CONTENTS at the ref they add:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen-code@aspen
/plugin install aspen-cowork@aspen
```

The marketplace is named `aspen`; that is what `@aspen` refers to, and it does
not change when a plugin is added or renamed.

That means a change to `plugins/aspen/code/` is live for anyone adding or
updating the marketplace as soon as it lands on the default branch. For
`aspen-code`, an `aspen-code--vX.Y.Z` tag and release is therefore a MARKER and
a changelog, not the delivery mechanism -- useful for saying what changed and
for pinning, not for getting the code to people.

### `aspen-cowork` also ships as a zip, and that one IS the delivery

Cowork installs a plugin by **uploading a zip** in Customize -> Plugins. It has
no `/plugin` command, and pointing it at the marketplace has not worked in
practice. So `aspen-cowork` is published as a release asset as well, and for a
Cowork user that asset -- not the default branch -- is what they run.

Build it from the plugin directory; never assemble one by hand:

```bash
./scripts/package-plugin.sh plugins/aspen/cowork    # -> dist/aspen-cowork-<version>.zip
```

The script stages the plugin, generates a one-plugin `marketplace.json` into the
zip (the repository has no nested one to copy -- here the plugin is an entry in
the root marketplace, in the zip there is no root marketplace to belong to),
validates what is about to ship rather than the source tree, and pins every
mtime to the plugin's last commit so two builds of one commit are byte-identical.
Build from a clean tree: a dirty one reuses the previous commit's timestamp.

**Why it is built and not hand-made.** The zip previously lived in a GCS bucket,
maintained by hand. It drifted to five versions behind the repository and still
carried the router under its pre-rename name, which collided with `aspen-code`'s
router of the same name -- a bug that could not be seen from this repository,
because nothing here referenced that file. Generated at tag time, that cannot
recur. The bucket is gone; do not resurrect it.

Publishing follows the runtime MCP's shape -- a versioned archive plus a fixed
pointer tag, so the download link in `docs/installing-for-cowork.md` is
permanent:

```bash
VERSION=0.1.8
./scripts/package-plugin.sh plugins/aspen/cowork

# versioned release: the archive
gh release create "aspen-cowork--v$VERSION" "dist/aspen-cowork-$VERSION.zip" \
  --repo aspen-crm/aspen-tools \
  --title "Aspen Cowork $VERSION" --notes-file notes.md

# aspen-cowork-latest: version-less filename, overwritten each time
cp "dist/aspen-cowork-$VERSION.zip" dist/aspen-cowork-plugin.zip
gh release upload aspen-cowork-latest dist/aspen-cowork-plugin.zip \
  --repo aspen-crm/aspen-tools --clobber
gh release edit aspen-cowork-latest --repo aspen-crm/aspen-tools \
  --notes "Always the current Aspen Cowork plugin. Currently $VERSION."
```

`aspen-cowork-latest` is a fixed tag created with `--latest=false`, for the same
reason `builder-latest` and `stdio-mcp-latest` are: GitHub's own "Latest"
resolves across the whole repository. Do not move it backwards.

**The zip and the marketplace must not diverge.** They are the same plugin
delivered two ways, and a Cowork user and a Claude Code user comparing notes
should be on the same version. Cut the zip from the same commit you tag, in the
same pass -- not later, from whatever the tree looks like then.

### Cutting a plugin tag

Bump the `version` in that plugin's `.claude-plugin/plugin.json`, commit, then
let the CLI cut the tag -- it reads the version rather than taking one from
you, and refuses if the manifest and the marketplace entry disagree:

```bash
claude plugin tag --dry-run plugins/aspen/code   # prints the tag, creates nothing
claude plugin tag --push plugins/aspen/code
```

The two plugins' versions are unrelated and are expected to drift apart. A
user reading an installed plugin's version should be able to find the matching
release notes, which is the whole reason the manifest version and the tag have
to agree.

`aspen-cowork` has a second dependency Builder does not: it teaches the ten
`aspen_*` tools of the `aspen-runtime-mcp` server but ships none of them. A
release of the server that renames a tool or an error code breaks the plugin's
guidance without changing a file here, so cut a `aspen-cowork` release when the
server moves under it, not only when a skill is edited.

### Renaming or adding a plugin is a breaking change for installers

A user has `aspen-code@aspen` installed by NAME. Changing the `name` in
`plugin.json` does not migrate them -- their existing install keeps pointing
at a plugin the marketplace no longer offers, and they have to install the new
name themselves. Say so in the release notes when it happens, and treat it as
a major version bump.

## Adding another tool

1. Put it under `plugins/aspen/<name>/` if it is a Claude plugin, and add it
   to the `plugins` array in `.claude-plugin/marketplace.json` with
   `"source": "./plugins/aspen/<name>"`. Its `plugin.json` `name` is what
   users type, so prefix it: `aspen-<name>`. If it is a binary, it needs no
   directory here at all -- only releases. Builder and the runtime MCP are
   both that second shape: nothing of either is committed.
2. Give it a tag prefix -- `claude plugin tag` derives one from the plugin
   name, so for a plugin this is already decided.
3. Add a section to the README saying how to get it.
