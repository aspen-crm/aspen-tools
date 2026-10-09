# Releasing

Every tool in this repository is released independently. There is no
repo-wide version, and no release ever covers two tools at once.

## Codex plugin archives

Keep the plugin's `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` versions
in sync. The shared skills and hooks have one source. Build a Codex archive with:

```sh
./scripts/package-plugin.sh plugins/aspen/ai dist codex
```

The resulting `*-codex.zip` carries the Codex manifest and leaves out Claude's. The default
packaging target remains `cowork`, which carries Claude's manifest and leaves out Codex's.
The CI Codex job validates the archive and reads the plugin through the native loader.
Builds do not publish, install plugins, configure credentials, or trust hooks.

## Tags are prefixed by tool

A release tag names the tool, then its version:

```
stdio-mcp-v0.1.14
aspencrm-ai--v0.1.0
```

The prefix is what keeps the tools independent: GitHub keys a release to a
tag, so each tool's releases are unrelated events that can happen in either
order, or a month apart. A bare `v1.2.3` tag would force one version onto
everything here, which is exactly what this layout avoids.

Retired tools keep their prefixes and their releases: `stdio-mcp-` (the
runtime MCP) and `aspen-cowork--` are never reused.

A plugin uses `--v` rather than the retired runtime MCP's `-v` because that is
what `claude plugin tag` produces, and cutting the tag with that command is
worth more than a consistent separator -- it refuses to tag unless
`plugin.json` and the marketplace entry agree on the name and version, which is
exactly the mistake nobody catches by eye.

No plugin tag has been cut yet, so nothing is carrying an older spelling.

Adding a tool later means picking a new prefix. Nothing else changes.

## Runtime MCP (retired)

The Aspen Runtime MCP — the local `.mcpb` server — is **retired**. Each instance now serves
its own MCP at `https://<host>/<domain>/<instance>/mcp`, built and deployed with the platform,
so there is nothing to publish here for it.

- **Don't delete the `stdio-mcp-` releases or `stdio-mcp-latest`.** Their links are in
  people's hands; a 404 says nothing about where to go. `stdio-mcp-latest`'s notes point at
  the hosted server instead.
- **Don't publish another `stdio-mcp-` release.** Nothing in this repository installs one any
  more; the plugin that did (`aspen-cowork`) is retired with it.
- The source repository still builds the server; that is its business. Its releases are no
  longer public.

## The Claude plugin

One plugin ships from `plugins/aspen/`:

| Plugin | Directory | Lane | Tag |
| --- | --- | --- | --- |
| `aspencrm-ai` | `plugins/aspen/ai/` | Work live records over the instance's hosted MCP | `aspencrm-ai--vX.Y.Z` |

**In Claude Code it is not installed from a release.** Claude Code reads
`.claude-plugin/marketplace.json` at the root of this repository, so what a
user installs is the repository's CONTENTS at the ref they add:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspencrm-ai@aspen
```

The marketplace is named `aspen`; that is what `@aspen` refers to, and it does
not change when a plugin is added or renamed.

That means a change to `plugins/aspen/ai/` is live for anyone adding or
updating the marketplace as soon as it lands on the default branch.

### `aspencrm-ai` also ships as a zip, and that one IS the delivery

Cowork installs a plugin by **uploading a zip** in Customize -> Plugins. It has
no `/plugin` command, and pointing it at the marketplace has not worked in
practice. So `aspencrm-ai` is published as a release asset as well, and for a
Cowork user that asset -- not the default branch -- is what they run.

Build it from the plugin directory; never assemble one by hand:

```bash
./scripts/package-plugin.sh plugins/aspen/ai    # -> dist/aspencrm-ai-<version>.zip
```

The script stages the plugin, generates a one-plugin `marketplace.json` into the
zip (the repository has no nested one to copy -- here the plugin is an entry in
the root marketplace, in the zip there is no root marketplace to belong to),
validates what is about to ship rather than the source tree, and pins every
mtime to the plugin's last commit so two builds of one commit are byte-identical.
Build from a clean tree: a dirty one reuses the previous commit's timestamp.

The zip and the marketplace carry the same files. The plugin has no server
wiring at all -- the hosted MCP's URL is different for every instance, so each
host adds it as a connector -- which is what lets one zip serve every Cowork
user.

**Why it is built and not hand-made.** A zip once lived in a GCS bucket,
maintained by hand. It drifted to five versions behind the repository and still
carried a router under its pre-rename name, which collided with another
plugin's router of the same name -- a bug that could not be seen from this
repository, because nothing here referenced that file. Generated at tag time, that cannot
recur. The bucket is gone; do not resurrect it.

Publishing is a versioned archive plus a fixed pointer tag, so the download link
in `docs/installing-for-cowork.md` is permanent:

```bash
VERSION=0.1.0
./scripts/package-plugin.sh plugins/aspen/ai

# versioned release: the archive
gh release create "aspencrm-ai--v$VERSION" "dist/aspencrm-ai-$VERSION.zip" \
  --repo aspen-crm/aspen-tools \
  --title "Aspen CRM AI $VERSION" --notes-file notes.md

# aspencrm-ai-latest: version-less filename, overwritten each time
cp "dist/aspencrm-ai-$VERSION.zip" dist/aspencrm-ai-plugin.zip
gh release upload aspencrm-ai-latest dist/aspencrm-ai-plugin.zip \
  --repo aspen-crm/aspen-tools --clobber
gh release edit aspencrm-ai-latest --repo aspen-crm/aspen-tools \
  --notes "Always the current Aspen CRM AI plugin. Currently $VERSION."
```

`aspencrm-ai-latest` is a fixed tag created with `--latest=false` (the first
publish: `gh release create aspencrm-ai-latest dist/aspencrm-ai-plugin.zip
--latest=false ...`), because GitHub's own "Latest" resolves across the whole
repository. Do not move it backwards.

**The zip and the marketplace must not diverge.** They are the same plugin
delivered two ways, and a Cowork user and a Claude Code user comparing notes
should be on the same version. Cut the zip from the same commit you tag, in the
same pass -- not later, from whatever the tree looks like then.

`aspen-cowork-latest` stays up for the links already handed out, with notes
pointing at `aspencrm-ai-latest`. Nothing new is published to it.

### Cutting a plugin tag

Bump the `version` in that plugin's `.claude-plugin/plugin.json`, commit, then
let the CLI cut the tag -- it reads the version rather than taking one from
you, and refuses if the manifest and the marketplace entry disagree:

```bash
claude plugin tag --dry-run plugins/aspen/ai   # prints the tag, creates nothing
claude plugin tag --push plugins/aspen/ai
```

A user reading an installed plugin's version should be able to find the
matching release notes, which is the whole reason the manifest version and the
tag have to agree.

`aspencrm-ai` has a dependency its own releases do not cover: it teaches the REST
operations an instance's hosted MCP runs, and ships none of them. Those come
from the platform build each instance is on, not from a release here, so two
customers can be on different operation sets at once. The skills lean on
`summarize_api` and `search_api_operations` when a path or body is in doubt,
and `plugins/aspen/ai/test/skills.test.mjs` checks every path a skill names
against a snapshot of the catalog. When the platform renames or drops an
operation, refresh that snapshot, fix the skills, and cut a release -- not only
when a skill is edited.

### Renaming or adding a plugin is a breaking change for installers

A user has `aspencrm-ai@aspen` installed by NAME. Changing the `name` in
`plugin.json` does not migrate them -- their existing install keeps pointing
at a plugin the marketplace no longer offers, and they have to install the new
name themselves. Say so in the release notes when it happens, and treat it as
a major version bump.

## Adding another tool

1. Put it under `plugins/aspen/<name>/` if it is a Claude plugin, and add it
   to the `plugins` array in `.claude-plugin/marketplace.json` with
   `"source": "./plugins/aspen/<name>"`. Its `plugin.json` `name` is what
   users type, so prefix it (`aspencrm-ai`). If it is a binary, it needs no
   directory here at all -- only releases, as the retired runtime MCP had:
   nothing of it is committed.
2. Give it a tag prefix -- `claude plugin tag` derives one from the plugin
   name, so for a plugin this is already decided.
3. Add a section to the README saying how to get it.
