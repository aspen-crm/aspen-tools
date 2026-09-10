# Set up Claude Code to build on Aspen

You are setting up this machine to customize an **Aspen** CRM — extending platform (`_p`) components
and authoring custom (`_c`) components with the `aspen` CLI. This document is agent-executable: do
the steps in order, run the verify step in each, and stop for the human only where it says to.

`<instance>` below is your Aspen instance URL, which your console provides; use it exactly as given.

## Step 1 — Make sure the aspen CLI is installed

The `aspen` CLI comes with **Aspen Builder**: once Builder is installed and the human has signed in,
the CLI is installed and authenticated for them.

Run `aspen --version`. If it prints a version, the CLI is installed — go to Step 2. There is no
`whoami`: sign-in shows itself the first time you run a command that talks to the instance, which
fails with `No instance is logged in.` if the human has not signed in.

If `aspen --version` prints nothing, this is the human's step — installing a desktop app and
signing in is not something you do for them. Hand them the Builder download for their machine
and wait:

- macOS (Apple Silicon): https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-arm64.dmg
- Windows (x64): https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-Setup-x64.exe

When they say Builder is installed and they have signed in, verify `aspen --version`. If a later
command reports `No instance is logged in.`, ask them to sign in in Builder — or, as a fallback,
run `aspen login --instance <instance>` and let them approve it in the browser. You never see,
type, ask for, or print a token.

## Step 2 — Install the Aspen Code plugin

The plugin installs from this repo's Claude Code marketplace — there is nothing to download. You
cannot run a slash command yourself, so hand these two to the human and wait for them to run both
in Claude Code:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen-code@aspen
```

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
under `metacode/`, the exported record data, and the CLI's own state. The plugin's hooks and its
`.aspen-model/` digest follow the session's directory, and the CLI defaults its path arguments to
this folder, so a session rooted anywhere else lines up with nothing.

Run `ls ~/Aspen` and read the entries. If the session is not already rooted in the right one, hand
that to the human — reopening Claude Code is their step, and `cd` is not a substitute for it:

```
Please reopen Claude Code in ~/Aspen/<domain>-<instance>, then tell me when you're back.
```

If `~/Aspen` is empty or missing, the human has not opened this instance in Builder yet. Ask them
to, and wait. Do not run `aspen init` to make the folder yourself — it scaffolds a Rust crate, a
TypeScript project and its own `CLAUDE.md`, none of which this setup wants.

**Verify:** the directory the session is rooted in contains `metacode/` and `.aspen/`.

## Step 4 — Build

Invoke the `using-aspen` skill and follow where it routes you. It discovers the CLI's commands from
`aspen --help` (nothing hardcoded), reads the instance's model with `read-metadata` before you
author, and drives the loop: **discover -> author -> compile -> deploy -> verify**.

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
