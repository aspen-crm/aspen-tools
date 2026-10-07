# Set up Codex in the terminal for Aspen

You are setting up this customer's computer to use Aspen from Codex CLI. Execute
the steps below, verify each result, and reuse anything already configured. The
default setup includes Aspen Code for customization and Aspen CRM AI for records;
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
administrator. Records-only use does not require Builder. Do not run `aspen init`
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
codex plugin add aspencrm-ai@aspen
codex plugin list --marketplace aspen --json
```

Check that the selected plugins are installed and enabled. The initial Codex
versions are `aspen-code` 2.8.0 and `aspencrm-ai` 0.1.0; later versions are fine.
The records plugin's display name is **Aspen CRM AI**. Do not install the
deprecated `aspen-crm-builder` plugin, or the retired `aspen-cowork` (Aspen
Runtime): if `aspen-cowork` is installed, remove it with
`codex plugin remove aspen-cowork@aspen`, and remove an `aspen-runtime-mcp`
server from `codex mcp list` with `codex mcp remove`.

Use the installed plugin paths returned by Codex to locate their manifests,
skills and hooks. If needed, use the marketplace root returned
by `codex plugin marketplace list --json` to locate the same source files. Do not
assume a fixed cache version directory or edit the installed plugin.

## 3. Connect the instance's hosted MCP

Skip this step for a customization-only setup. The records plugin carries skills
only; the tools come from the instance, which serves an MCP server at its URL
with `/mcp` on the end. Check `codex mcp list` for one already pointing there,
and reuse it. Otherwise add it:

```sh
codex mcp add aspen --url "<instance URL>/mcp"
```

Then the customer signs in. `codex mcp login aspen` opens the instance's own
sign-in page in their browser; they run it themselves in their terminal, since
it needs them at the keyboard. If login fails at client registration, they
retry with `--oauth-client-registration cimd`. There is no API key or token in
this setup: never ask for one, and refuse one if offered.

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
   `using-aspen`, `lean-data-model`, and `model-first`; Aspen CRM AI includes
   `using-aspencrm-ai` and `explore` among its skills.
2. For customization, confirm the instance folder contains `metacode/` and the
   Aspen CLI runs. Check whether hooks are trusted; if not, report that explicitly.
3. For records use, confirm the hosted MCP connection and its three tools
   (`summarize_api`, `search_api_operations`, `execute_api_request`). Load the
   `explore` skill and make one read: `GET /api/v24.3/describe/me` through
   `execute_api_request`, which names the signed-in user, then the object
   catalog. This proves sign-in and connectivity without changing data. If it
   fails, report the HTTP status and `body.failures`, let the customer complete
   `codex mcp login aspen`, then retry. If Codex cannot connect at all, report
   that too: the server needs MCP protocol revision 2026-07-28, which this
   Codex version may not speak yet.
4. Report what is installed, which folder and instance are selected, and what
   verification passed or remains blocked. Do not call setup complete solely
   because the plugin manifests or server binary exist.

Do not create sample records, upload files, deploy metadata, or run shared-state
recovery during setup — every write would also ask the customer for an approval
they did not expect. Once setup is verified, invite the customer's first real
Aspen task.

References: [Codex plugin setup](https://developers.openai.com/plugins/build/plugins),
[hook trust](https://learn.chatgpt.com/docs/hooks), and the
[Aspen Codex installation guide](https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/docs/installing-for-codex.md).
