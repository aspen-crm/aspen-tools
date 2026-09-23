# Set up Codex in the terminal for Aspen

You are setting up this customer's computer to use Aspen from Codex CLI. Execute
the steps below, verify each result, and reuse anything already configured. The
default setup includes Aspen Code for customization and Aspen Runtime for records;
honor a request for only one. Setup ends with read-only verification.

This guide is intended to be read inside an authenticated Codex terminal session.
If the customer has not installed Codex yet, direct them to the
[official Codex CLI setup](https://learn.chatgpt.com/docs/codex/cli), then have them
start `codex` and paste the setup prompt again.

## 1. Check prerequisites and identify the instance

Check the operating system, `node --version`, `git --version`, `codex --version`,
and `codex plugin add --help`. Aspen's plugins require Node.js 22 or later. Native
loading is tested with Codex CLI 0.156.0; use a current release with the plugin
commands. If a prerequisite is missing, install it using the customer's existing
package manager where available, respecting the host's permission prompts. For a
Codex upgrade, use its existing installation method, then have the customer restart
Codex before continuing. Do not create a second competing Codex installation.

Use the Aspen instance URL supplied by the customer, exactly as given. It normally
has the shape `https://HOST/DOMAIN/INSTANCE`. If the intended instance is unclear,
ask for its URL. An API key is not an answer to that question.

For customization, locate the matching Builder-created folder under `~/Aspen/`
(the user's home directory on Windows). It contains `metacode/` and
`.aspen/bin/aspen` or `.aspen/bin/aspen.exe`. If there are several folders, resolve
which one belongs to the intended instance; do not pick the first arbitrarily.
Run that CLI's `--version` with the instance folder as the working directory.

If the folder or CLI is missing, ask the customer to install Aspen Builder, sign
in and open their instance. Continue independent plugin/runtime installation while
they do that. Builder downloads:

- [macOS Apple silicon](https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-arm64.dmg)
- [Windows x64](https://github.com/aspen-crm/aspen-tools/releases/download/builder-latest/Aspen-Builder-Setup-x64.exe)

Other platforms need a supported Aspen CLI/instance workspace from their Aspen
administrator. Runtime-only use does not require Builder. Do not run `aspen init`
or put the instance CLI on PATH. A worktree can omit Builder's ignored `.aspen/`
cache; use the actual instance folder for setup.

## 2. Install the Codex plugins

Inspect `codex plugin marketplace list --json`. If `aspen` is absent, run:

```sh
codex plugin marketplace add aspen-crm/aspen-tools
```

If it is already the Git marketplace for `aspen-crm/aspen-tools`, refresh it with
`codex plugin marketplace upgrade aspen`. If the name points somewhere else,
resolve that conflict with the customer before replacing their configuration.

Install the selected plugins using shell commands, not Claude slash commands:

```sh
codex plugin add aspen-code@aspen
codex plugin add aspen-cowork@aspen
codex plugin list --marketplace aspen --json
```

Check that the selected plugins are installed and enabled. The initial Codex
versions are `aspen-code` 2.8.0 and `aspen-cowork` 0.8.0; later versions are fine.
The runtime plugin's display name is **Aspen Runtime**. Do not install the
deprecated `aspen-crm-builder` plugin.

Use the installed plugin paths returned by Codex to locate their manifests,
skills, hooks and runtime installer. If needed, use the marketplace root returned
by `codex plugin marketplace list --json` to locate the same source files. Do not
assume a fixed cache version directory or edit the installed plugin.

## 3. Install the runtime and connect the customer's login

Skip this step for a customization-only setup. The runtime plugin includes its
launcher but needs the compiled server installed separately.

On macOS/Linux, run the selected plugin's installer by its absolute path:

```sh
sh "<aspen-cowork plugin directory>/bin/install-runtime-mcp.sh" --instance "<instance URL>"
```

On Windows, download the
[Windows runtime bundle](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-windows.mcpb).
It is a ZIP: extract `server/aspen-runtime-mcp.exe` into `<config>/mcp/`.
`<config>` is `ASPEN_CONFIG_DIR`, otherwise `XDG_CONFIG_HOME/aspen`, otherwise
`~/.config/aspen`. On all platforms verify the installed binary with `--version`.

The plugin starts the Node launcher itself. Do not add a second server with
`codex mcp add`. Some installer messages refer to Claude Code; its separate MCP
registration command is unnecessary for this Codex plugin.

Reuse the customer's existing Aspen login. Let the runtime resolve credentials;
do not inspect credential files, query the keyring, or print environment secrets.
If authentication needs setup, the customer signs in through Builder or their
Aspen CLI. If using a personal API token, have them configure it privately using
the [runtime identity guide](https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/docs/installing-for-codex.md).
Never ask them to paste a token into the conversation. OAuth credentials may need
refreshing through the Aspen CLI; the runtime does not refresh them itself.

## 4. Start a fresh Codex session and verify

Newly installed plugins need a fresh session. Give the customer a concrete command
with their resolved instance folder, and ask them to exit the current session and
run it in their terminal:

```sh
codex -C "<absolute instance folder>" "Fetch https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/docs/start-codex.md as raw text and complete step 4: verify my existing Aspen setup for <instance URL> using read-only checks."
```

For runtime-only use, a normal working folder is sufficient. Do not start a nested
interactive Codex process yourself. Explain that Aspen Code's hooks require the
customer's review and trust in Codex. Installation alone does not activate them;
use the CLI's hook review interface and leave the trust decision to the customer.
Do not edit hook trust state or bypass a managed policy.

In the fresh session:

1. Confirm the selected plugins' skills are available. Aspen Code includes
   `using-aspen`, `lean-data-model`, and `model-first`; Aspen Runtime includes
   `using-aspen-cowork` and `explore` among its skills.
2. For customization, confirm the instance folder contains `metacode/` and the
   Aspen CLI runs. Check whether hooks are trusted; if not, report that explicitly.
3. For runtime use, confirm one `aspen-runtime-mcp` connection and its tools. Load
   the `explore` skill and make one `aspen_describe` call to list objects on the
   intended instance, using the actual tool schema. This proves authentication
   and connectivity without changing data. If it fails, report the error's code
   and `fix_hint`, let the customer complete any login step, then retry.
4. Report what is installed, which folder and instance are selected, and what
   verification passed or remains blocked. Do not call setup complete solely
   because the plugin manifests or server binary exist.

Do not create sample records, upload files, deploy metadata, or run shared-state
recovery during setup. Natural-language `aspen_query` has separate planner
credentials; use Describe/list/report for verification instead of requiring an
Anthropic or Vertex account to finish onboarding. Once setup is verified, invite
the customer's first real Aspen task.

References: [Codex plugin setup](https://developers.openai.com/plugins/build/plugins),
[hook trust](https://learn.chatgpt.com/docs/hooks), and the
[Aspen Codex installation guide](https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/docs/installing-for-codex.md).
