# Set up Claude Code to build on Aspen

You are setting up this machine to customize an **Aspen** CRM — extending platform (`_p`) components
and authoring custom (`_c`) components — driven by the `aspen` CLI. This document is
agent-executable: do the steps in order, run the verify step in each, and stop for the human only
where it says to.

You need one value: `<instance>` — the Aspen instance URL you are building against, which your
console provides. Use it exactly as given; it is used only for `aspen login`.

Everything comes from the public `aspen-crm/aspen-tools` repo — the CLI from its releases, the
plugin from its Claude Code marketplace — so no account or token is needed.

## Step 1 — Install the aspen CLI (if it is not already installed)

Run `aspen --version`. If it prints a version, skip to Step 2. Otherwise install it — ask the
human's consent before downloading:

1. Pick your target from `uname -sm`:
   - `Darwin arm64` -> `aarch64-apple-darwin`
   - `Darwin x86_64` -> `x86_64-apple-darwin`
   - `Linux x86_64` -> `x86_64-unknown-linux-gnu`
   - `Linux aarch64` -> `aarch64-unknown-linux-gnu`
   - Windows -> `x86_64-pc-windows-msvc`
2. Download it onto your `PATH`:

   ```
   curl -fsSL "https://github.com/aspen-crm/aspen-tools/releases/download/cli-latest/aspen-<target>" -o ~/.local/bin/aspen
   chmod +x ~/.local/bin/aspen
   ```

   Make sure `~/.local/bin` is on `PATH`.

Three outcomes, all fine: it runs; the host asks the human to approve the download (that prompt IS
the consent — let them answer); or a security classifier denies it. **On a denial, stop trying** —
show the human the command to run themselves (a `!` prefix runs it in this session) and wait. When
they say it is done, verify `aspen --version`.

## Step 2 — Install the Aspen plugin

The plugin teaches you the loop and how to read the instance. It installs from this repo's Claude
Code marketplace — there is nothing to download. You cannot run a slash command yourself, so hand
these two to the human and wait for them to run both in Claude Code:

```
/plugin marketplace add aspen-crm/aspen-tools
/plugin install aspen@aspen
```

When the plugin is installed, the `using-aspen` and `read-metadata` skills become available.

## Step 3 — Log in

`aspen login` is a hand-off you START and the human COMPLETES in the browser. Run:

```
aspen login --base-url <instance>
```

It opens the browser for the human to approve the sign-in — they are already signed in to the
instance. **You never see, type, ask for, or print a token.** When they confirm, verify
`aspen whoami`. On a headless or SSH machine, `aspen login --base-url <instance> --device` prints a
code to approve elsewhere instead.

## Step 4 — Build

Invoke the `using-aspen` skill and follow where it routes you. It discovers the CLI's commands from
`aspen --help` (nothing hardcoded), reads the instance's model with `read-metadata` before you
author, and drives the extend-`_p` / author-`_c` loop.

## Safety

- Ask the human's consent before anything that installs on their machine.
- `aspen login` is a browser hand-off. Never see, type, ask for, or print an API token.
- Metadata and records on the platform cannot be deleted, so anything you create while testing is
  permanent — say so before the human starts.
- If a download is denied by a security classifier, stop and hand the human the command to run
  themselves.
