# Set up Claude Code to build on Aspen

You are setting up this machine to customize an **Aspen** CRM — extending platform (`_p`) components
and authoring custom (`_c`) components with the `aspen` CLI. This document is agent-executable: do
the steps in order, run the verify step in each, and stop for the human only where it says to.

`<instance>` below is your Aspen instance URL, which your console provides; use it exactly as given.

## Step 1 — Make sure the aspen CLI is installed

The `aspen` CLI comes with **Aspen Builder**: once Builder is installed and the human has signed in,
the CLI is installed and authenticated for them.

Run `aspen --version`. If it prints a version, run `aspen whoami` to confirm sign-in and go to
Step 2. Otherwise this is the human's step — installing a desktop app and signing in is not
something you do for them. Hand them the Builder download for their machine and wait:

- macOS (Apple Silicon): https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-arm64.dmg
- Windows (x64): https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-Setup-x64.exe

When they say Builder is installed and they have signed in, verify `aspen --version` and
`aspen whoami`. If `whoami` shows no sign-in, ask them to sign in in Builder — or, as a fallback,
run `aspen login --base-url <instance>` and let them approve it in the browser. You never see,
type, ask for, or print a token.

## Step 2 — Install the Aspen plugin

The plugin installs from this repo's Claude Code marketplace — there is nothing to download. You
cannot run a slash command yourself, so hand these two to the human and wait for them to run both
in Claude Code:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen@aspen
```

When the plugin is installed, the `using-aspen` and `read-metadata` skills become available.

## Step 3 — Build

Invoke the `using-aspen` skill and follow where it routes you. It discovers the CLI's commands from
`aspen --help` (nothing hardcoded), reads the instance's model with `read-metadata` before you
author, and drives the extend-`_p` / author-`_c` loop.

## Safety

- Installing Builder and signing in are the human's steps — hand them the link and wait.
- Never see, type, ask for, or print an API token.
- Metadata and records on the platform cannot be deleted, so anything you create while testing is
  permanent — say so before the human starts.
