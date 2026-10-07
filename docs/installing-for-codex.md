# Aspen plugins in Codex

`aspen-code` builds the model through the Aspen CLI. `aspencrm-ai` works with live
records through the instance's hosted MCP; its Codex display name is **Aspen CRM AI**.
Both use the existing `aspen` repository marketplace. The deprecated
`aspen-crm-builder` plugin is not needed, and neither is `aspen-cowork` (Aspen Runtime),
which `aspencrm-ai` replaces.

For the customer-facing, agent-executable walkthrough, use
[One-prompt terminal setup](start-codex.md). The sections below document the
individual installation and validation commands.

## Install from this checkout

Requires Node.js 22 or later and Codex with plugin and hook support. Native loading is
tested with Codex CLI 0.156.0. Run from the repository root:

```sh
codex plugin marketplace add .
codex plugin add aspen-code@aspen
codex plugin add aspencrm-ai@aspen
```

Install either plugin independently. Once these changes are released, the marketplace
can instead be registered with `codex plugin marketplace add aspen-crm/aspen-tools`.
Start a new task after installation or updates so its skill inventory is refreshed.
In Codex, review and trust the Aspen Code hooks before relying on their enforcement.
Plugin installation does not automatically trust hooks.

For code work, select the instance folder Aspen Builder created under `~/Aspen/`.
The CLI lives at `.aspen/bin/aspen` in that folder. Worktrees may omit Builder's ignored
cache; use the intended instance folder as the CLI working directory.

## The hosted MCP and identity

`aspencrm-ai` carries skills only. The tools come from the instance itself: every Aspen
instance serves an MCP server at its own URL with `/mcp` on the end. Add it to Codex once,
then sign in:

```sh
codex mcp add aspen --url https://HOST/DOMAIN/INSTANCE/mcp
codex mcp login aspen
```

`login` opens the instance's own sign-in page; the session it stores is the customer's,
scoped to what they can see in the CRM. The instance registers OAuth clients by client ID
metadata document — if `login` fails at client registration, run it again with
`--oauth-client-registration cimd`. `--no-browser` prints the authorization URL instead, for a
remote shell. When the session later expires, `codex mcp login aspen` again.

There is no API key, no binary to install and no environment variable to set. The agent never
reads, prints or handles a credential.

The server exposes three tools — `summarize_api`, `search_api_operations`,
`execute_api_request` — and asks the user to approve every operation that changes data through
an MCP elicitation. It speaks protocol revision 2026-07-28 only. **Neither has been verified
against Codex yet:** if Codex cannot connect, or reads work but every write fails with "…this
client cannot collect", that is a Codex client limitation, not an install problem.

If `aspen-cowork` and its runtime server were set up before, remove them:
`codex plugin remove aspen-cowork@aspen`, and `codex mcp remove aspen-runtime-mcp` if it was
registered by hand. Left in place they show a second, older set of Aspen tools.

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
node --test plugins/aspen/code/test/*.test.mjs plugins/aspen/ai/test/*.test.mjs
node scripts/validate-plugins.mjs plugins/aspen/code plugins/aspen/ai
node scripts/test-codex.mjs
./scripts/package-plugin.sh plugins/aspen/code dist codex
./scripts/package-plugin.sh plugins/aspen/ai dist codex
```

The native loader test makes no model calls, does not install plugins and never reaches an
instance. Behavioral model evals are separately opt-in; see the plugin's eval README.

Codex archives end in `-codex.zip` and carry the Codex manifest. The default `cowork`
archive carries Claude's manifest and is the Cowork upload.
