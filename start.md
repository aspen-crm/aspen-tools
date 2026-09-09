# Set up Claude Code to build on Aspen

You are setting up this machine to build a CRM customization on **Aspen** in the `_c` customer
namespace, driven by the `aspen` CLI. This document is agent-executable: do the steps in order,
run the verify step in each, and stop for the human only where it says to.

You need one value: `<instance>` — the Aspen instance URL you are building against, which your
console provides. Use it exactly as given; it is used only for `aspen login`.

Everything you download comes from the public `aspen-crm/aspen-tools` GitHub releases, so no account
or token is needed to download.

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
   curl -fsSL "https://github.com/aspen-crm/aspen-tools/releases/latest/download/aspen-<target>" -o ~/.local/bin/aspen
   chmod +x ~/.local/bin/aspen
   ```

   Make sure `~/.local/bin` is on `PATH`.

Three outcomes, all fine: it runs; the host asks the human to approve the download (that prompt IS
the consent — let them answer); or a security classifier denies it. **On a denial, stop trying** —
show the human the command to run themselves (a `!` prefix runs it in this session) and wait. When
they say it is done, verify `aspen --version`.

## Step 2 — Install the Aspen plugin

The plugin teaches you Aspen's author -> validate -> deploy -> verify loop.

1. Download and unpack it (ask the human's consent for the download, then run):

   ```
   mkdir -p ~/.aspen/plugin/current
   curl -fsSL "https://github.com/aspen-crm/aspen-tools/releases/latest/download/aspen-plugin.tar.gz" | tar -xzf - -C ~/.aspen/plugin/current
   ```

2. You cannot run a slash command yourself, so hand these two to the human and wait for them to run
   both in Claude Code:

   ```
   /plugin marketplace add ~/.aspen/plugin/current
   /plugin install aspen@aspen
   ```

When the plugin is installed, the `using-aspen` and `getting-started` skills become available.

## Step 3 — Log in

`aspen login` is a hand-off you START and the human COMPLETES in the browser. Run:

```
aspen login --base-url <instance>
```

It opens the browser for the human to approve the sign-in — they are already signed in to the
instance. **You never see, type, ask for, or print a token.** When they confirm, verify
`aspen whoami`. On a headless or SSH machine, `aspen login --base-url <instance> --device` prints a
code to approve elsewhere instead.

## Step 4 — Onboard

Invoke the `using-aspen` skill and follow where it routes you. With the CLI installed and logged in,
`getting-started` scaffolds a project with `aspen init` (it takes no name — it binds to the instance
you logged in to) and orients you against the instance's real schema with `aspen describe` before
you author anything.

## Safety

- Ask the human's consent before anything that installs on their machine.
- `aspen login` is a browser hand-off. Never see, type, ask for, or print an API token.
- Metadata and records on the platform cannot be deleted, so anything you create while testing is
  permanent — say so before the human starts.
- If a download is denied by a security classifier, stop and hand the human the command to run
  themselves.
