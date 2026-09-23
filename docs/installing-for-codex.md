# Aspen plugins in Codex

`aspen-code` builds the model through the Aspen CLI. `aspen-cowork` works with live
records through the runtime MCP; its Codex display name is **Aspen Runtime**.
Both use the existing `aspen` repository marketplace. The deprecated
`aspen-crm-builder` plugin is not needed.

For the customer-facing, agent-executable walkthrough, use
[One-prompt terminal setup](start-codex.md). The sections below document the
individual installation and validation commands.

## Install from this checkout

Requires Node.js 22 or later and Codex with plugin and hook support. Native loading is
tested with Codex CLI 0.156.0. Run from the repository root:

```sh
codex plugin marketplace add .
codex plugin add aspen-code@aspen
codex plugin add aspen-cowork@aspen
```

Install either plugin independently. Once these changes are released, the marketplace
can instead be registered with `codex plugin marketplace add aspen-crm/aspen-tools`.
Start a new task after installation or updates so its skill inventory is refreshed.
In Codex, review and trust the Aspen Code hooks before relying on their enforcement.
Plugin installation does not automatically trust hooks.

For code work, select the instance folder Aspen Builder created under `~/Aspen/`.
The CLI lives at `.aspen/bin/aspen` in that folder. Worktrees may omit Builder's ignored
cache; use the intended instance folder as the CLI working directory.

## Runtime server and identity

The runtime plugin carries a launcher, not the compiled server. On macOS or Linux:

```sh
sh plugins/aspen/cowork/bin/install-runtime-mcp.sh --instance https://HOST/DOMAIN/INSTANCE
```

The installer puts the binary in `~/.config/aspen/mcp/`, respecting `ASPEN_CONFIG_DIR`
and `XDG_CONFIG_HOME`. `--file BUNDLE.mcpb` uses an already downloaded bundle.
On Windows, extract `server/aspen-runtime-mcp.exe` from the Windows `.mcpb` (a ZIP),
and put it in that same config directory's `mcp/` folder, or set `ASPEN_RUNTIME_MCP`
to the executable. The Codex launcher uses Node on all three platforms.

The user supplies the instance credential through an existing Aspen CLI login or through
`ASPEN_INSTANCE` and `ASPEN_API_TOKEN` in the host environment/private `mcp/env` file.
The agent must not read or print credentials. A CLI API-key login is durable; the MCP
cannot refresh an expired OAuth token. The bulk and merge helpers also understand CLI
file credentials and OS-keyring credentials on macOS/Linux. Linux keyring access from
the helpers requires `secret-tool`; Windows helpers require file/environment credentials.

Do not register the same server separately when the runtime plugin is enabled. The plugin
declares the Node launcher inline in its Codex manifest; Claude Code retains its shell
launcher. Codex forwards the listed Aspen environment variables. A desktop app started
outside a terminal may not inherit terminal exports; the private env file or CLI login
avoids that dependency.

Bulk updates default to enabled for the local launcher. `ASPEN_BULK_WRITES=0` disables
them. Skills check the actual tool catalog. The Codex server definition allows 360 seconds
per tool call to accommodate the runtime's 300-second upload ceiling.

For a standalone server without the plugin, register the launcher by its absolute path:

```sh
codex mcp add aspen-runtime-mcp -- node /ABSOLUTE/aspen-tools/plugins/aspen/cowork/bin/aspen-runtime-mcp.mjs
```

Then set `tool_timeout_sec = 360` under `[mcp_servers.aspen-runtime-mcp]` in Codex's
`config.toml`, and use `env_vars` to forward any needed Aspen environment settings.
The launcher reads the private env file itself. Never put a real token in a shared config.

The `aspen_query` planner has its own Anthropic/Vertex configuration. Codex login does not
configure it. Describe/list/report work without that planner, and the query skill falls
back to those tools when the planner is unavailable.

## Hook behavior

Both hosts use `hooks/pre-tool.mjs` and the same Aspen policy checks. Codex patches are
previewed in memory, including multiple files, hunks, moves and deletes. Generated tiers
and invalid UI styles are denied. Unreadable Aspen patches are denied with a correction
hint. Model-size and UI-placement findings are advisory context in Codex; the skills
make those decisions before writing. Claude Code retains its `ask` responses.

Codex cannot prompt from a hook's `permissionDecision: "ask"`. Direct shared-state
recovery commands are therefore denied. After the user authorizes the exact operation,
the skill runs `scripts/recover.mjs` from the installed `using-aspen` skill with
`--confirmed`, the recovery verb, and the CLI path. The helper accepts only
`clear-package` or `checkin-clear` and invokes one argv command without a shell.
Its confirmation flag records the workflow's authorization; it is not an authentication
mechanism. Existing user authorization should not be requested again.

Hooks are guardrails, not a filesystem security boundary: shell scripts and tools outside
the edit hook can change files. Keep offline validation, footprint and UI lint checks in
the pre-deploy workflow. When hooks are disabled, the skills still apply and load CLI help
on demand.

## Validate and package

```sh
node --test plugins/aspen/code/test/*.test.mjs plugins/aspen/cowork/test/*.test.mjs
node scripts/validate-plugins.mjs plugins/aspen/code plugins/aspen/cowork
node scripts/test-codex.mjs
node scripts/smoke-runtime-mcp.mjs /ABSOLUTE/PATH/TO/aspen-runtime-mcp
./scripts/package-plugin.sh plugins/aspen/code dist codex
./scripts/package-plugin.sh plugins/aspen/cowork dist codex
```

The native loader test makes no model calls and does not install plugins. The protocol
smoke uses an empty temporary identity directory and only initializes/lists tools and
resources; it never calls a live instance. Behavioral model evals are separately opt-in;
see the plugin's eval README.

Codex archives end in `-codex.zip` and retain the runtime launcher. The default `cowork`
archive preserves the Claude Desktop delivery contract and omits MCP startup wiring.
