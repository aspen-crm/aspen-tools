# Set up Claude Code to build on Aspen

You are setting up this machine to customize an **Aspen** CRM — extending platform (`_p`) components
and authoring custom (`_c`) components with the `aspen` CLI. This document is agent-executable: do
the steps in order, run the verify step in each, and stop for the human only where it says to.

`<instance>` below is your Aspen instance URL, which your console provides; use it exactly as given.

## Step 1 — Make sure the aspen CLI is installed

The `aspen` CLI comes with **Aspen Builder**. When the human opens an instance in Builder, it
creates that instance's folder at `~/Aspen/<domain>-<instance>` and installs the CLI inside it, at
`.aspen/bin/aspen`, already signed in for them. The CLI is not on `PATH`, and you do not put it
there: run it by that path from the instance folder. Everywhere this document or the plugin's
skills say `aspen`, that means `.aspen/bin/aspen`.

Find it and check its version in one command — don't split this into two:

```
a=$(find ~/Aspen -path '*/.aspen/bin/aspen' 2>/dev/null | head -1); [ -n "$a" ] && "$a" --version || echo "no aspen CLI yet"
```

If it prints a version, the CLI is installed — go to Step 2. (There is no `whoami`; whether the
human has signed in shows itself the first time you run a command that talks to the instance, which
fails with `No instance is logged in.` — handle that if and when it happens, not now.)

If it prints `no aspen CLI yet`, this is the human's step — installing a desktop app, signing in
and opening the instance is not something you do for them. Hand them the Builder download for their
machine and wait:

- macOS (Apple Silicon): https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-arm64.dmg
- Windows (x64): https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-Setup-x64.exe

If macOS refuses to open Builder — it may call the app damaged, or say the developer cannot be
verified — that is the quarantine flag macOS puts on every download, not a bad file. Clear it,
then ask them to open Builder again:

```
xattr -dr com.apple.quarantine "/Applications/Aspen Builder.app"
```

When they say Builder is installed, they have signed in and the instance is open, run the same
one-liner again to confirm a version prints. If a later command
reports `No instance is logged in.`, ask them to sign in in Builder — or, as a fallback, run
`.aspen/bin/aspen login --instance <instance>` from the instance folder and let them approve it in
the browser. You never see, type, ask for, or print a token.

## Step 2 — Install the Aspen Code plugin

The plugin installs from this repo's Claude Code marketplace — there is nothing to download. You
cannot run a slash command yourself, so hand these two to the human and wait for them to run both
in Claude Code:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen-code@aspen
```

If the install asks which scope, they should pick **User**: that turns the plugin on in every
instance folder they open, not only this one, and its hooks stay silent outside an Aspen folder.

`aspen-code` is the one this document needs. The same marketplace also carries `aspen-cowork`, the
collaboration half — it is not part of this setup, so do not install it here unless asked.

When the plugin is installed, its skills become available and route themselves as you work:

| Skill | For |
| --- | --- |
| `using-aspen` | the entry point — discovers the CLI, routes everything else |
| `read-metadata` | read the instance's model before authoring |
| `map-model` | understand what the model *means*, not just what exists |
| `complete-object-ui` | a new object needs a layout, list view and tab |
| `verify-change` | prove a change works; a green checkin is not proof |
| `diagnose` | a compile or checkin failed — reproduce before fixing |

## Step 3 — Open Claude Code in the instance folder

Builder gives each instance its own folder at `~/Aspen/<domain>-<instance>` — for example
`~/Aspen/veeva.com-treehouse`. That folder is where all Aspen work happens: it holds the metadata
under `metacode/`, the exported record data, and the CLI itself with its state under `.aspen/`.
The plugin's hooks and its `.aspen-model/` digest follow the session's directory, the CLI defaults
its path arguments to this folder, and `.aspen/bin/aspen` only resolves from here — so a session
rooted anywhere else lines up with nothing.

Run `ls ~/Aspen` and read the entries, then hand the human the reopen — even if this session is
already rooted in the right folder. A plugin installed into a running session has no hooks yet;
they attach when a session starts. Reopening Claude Code is their step, and `cd` is not a
substitute for it:

```
Please reopen Claude Code in ~/Aspen/<domain>-<instance>, then tell me when you're back.
```

If `~/Aspen` is empty or missing, the human has not opened this instance in Builder yet. Ask them
to, and wait. Do not run `aspen init` to make the folder yourself — it scaffolds a Rust crate, a
TypeScript project and its own `CLAUDE.md`, none of which this setup wants.

**Verify:** the directory the session is rooted in contains `metacode/`, and
`.aspen/bin/aspen --version` prints a version.

## Step 4 — Build

Invoke the `using-aspen` skill and follow where it routes you. It discovers the CLI's commands from
`.aspen/bin/aspen --help` (nothing hardcoded), reads the instance's model with `read-metadata`
before you author, and drives the loop: **discover -> author -> compile -> deploy -> verify**.

The last step is a real one. A checkin that goes green proves the metadata compiled, not that the
change works — `verify-change` is what closes it.

## Safety

- Installing Builder and signing in are the human's steps — hand them the link and wait.
- Never see, type, ask for, or print an API token.
- Metadata and records on the platform cannot be deleted, so anything you create while testing is
  permanent — say so before the human starts.
- The instance is shared with other builders. Some `aspen move` commands clear the dev set or halt
  an in-flight checkin, which reaches their work — confirm with the human first. `aspen-code`'s
  `guard-destructive` hook will stop and ask as well, but that is a backstop, not the approval.
