# Installing Aspen for Cowork — end-user guide

Work your Aspen CRM from Claude: view, search, report on, create, and update records in
plain language.

There are **two pieces**, and you need both:

| Piece | What it is | Where it goes |
|---|---|---|
| **Runtime MCP** — `aspen-runtime-mcp-<os>.mcpb` | The tools. A small program that talks to your instance's API. **This is the piece that holds your API key.** | Claude Desktop → Extensions |
| **Cowork plugin** — `aspen-cowork` | The know-how. Skills that teach Claude how to explore your model and make changes safely. | Cowork → Customize → Plugins |

Installing the tools without the plugin works, but Claude guesses more. Install both.

Both install **once, globally** — every future conversation has them. There is nothing to
redo per session.

**Time:** about 10 minutes. **You'll need:** your Aspen instance URL, and permission to
create an API key in it.

---

## Step 1 — Create your API key

The runtime MCP signs in to your instance as **you**, using a personal API key. Create it
first, so you have it ready to paste in Step 2.

1. Open a browser and **log in to your Aspen instance** — the same URL you use for the CRM
   day to day, e.g. `https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename`.
2. Go to **API Keys**.
3. **Create a new key.** Give it a name you'll recognise later, like `Claude Desktop`.
4. **Copy the key as soon as it's shown** and keep it somewhere safe until Step 2 — you
   will paste it into Claude Desktop's config form. It looks like:

   ```
   secret-token:aspen_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   Copy the **whole** string including the `secret-token:` prefix.

While you're here, note your **instance base URL** — you need that in Step 2 too. It's the
**full path** to your instance: the host, then your domain, then the instance name.

- ✅ `https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename`
- ❌ `https://0000-00-0999-ip.aspen-crm.com` — the host alone, missing the domain and instance
- ❌ `https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename/ui/objects/account_p` — the
  accounts list *inside* the CRM, not the instance root. This is the easy mistake: it's what's
  in your address bar when you go looking for the URL

Stop at the instance name. Whatever the CRM appends after it as you click around — a tab, a
record, a view — is not part of the base URL.

> The config form's own hint shows a bare host as its example. Take the **full** path
> anyway: the server builds your clickable record and list links from this value, and a
> host-only base URL produces links that go nowhere.

**About the key:** it carries your own permissions — Claude can see and change exactly what
you can, nothing more. It's stored in Claude Desktop's secret store, and the model itself
never sees it. If you ever need to cut access, revoke the key in the same **API Keys**
screen; nothing else has to be uninstalled.

---

## Step 2 — Install the runtime MCP (`.mcpb`)

This goes into **Claude Desktop**, even if you'll be working in Cowork — Cowork desktop
bridges to the servers installed in Claude Desktop.

### 2a. Download the bundle for your OS

| OS | File |
|---|---|
| macOS (Intel + Apple Silicon) | [`aspen-runtime-mcp-macos.mcpb`](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-macos.mcpb) |
| Windows (x64) | [`aspen-runtime-mcp-windows.mcpb`](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-windows.mcpb) |

The macOS bundle is universal — one file serves both Intel and Apple Silicon.

Or from a terminal:

```bash
curl -fsSLO https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-macos.mcpb
```

### 2b. Install it in Claude Desktop

**Double-click the `.mcpb` file**, or open **Claude Desktop → Settings → Extensions →
Install Extension** and pick it.

On macOS the bundled program carries only an ad-hoc signature — it is not signed with a
Developer ID and not notarized — so macOS may warn the first time it runs. That warning is
expected.

### 2c. Fill in the config form

Claude Desktop shows a short form. **This is where your API key goes.**

| Field | What to enter |
|---|---|
| **Instance base URL** | The full instance URL from Step 1, e.g. `https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename`. A trailing slash is fine — it's ignored |
| **API token** | The `secret-token:aspen_…` key you created in Step 1, pasted whole |
| **API base path (advanced)** | **Leave it alone** — `/api/v24.3`. There is nothing to change here |

Click through to finish. The extension appears as **Aspen Runtime MCP** and is enabled for
every conversation from now on.

---

## Step 3 — Install the Cowork plugin

The plugin is **not a download**. It comes from this repository's plugin marketplace, which
is public, so you point Cowork at the repo and it fetches the current version.

1. In Cowork, open **Customize → Plugins**.
2. Choose **Add marketplace** and enter:

   ```
   aspen-crm/aspen-tools
   ```

3. From that marketplace, install **`aspen-cowork`**.

It installs at user scope: available in every session, no per-conversation setup.

> Do this in the **Plugins UI**. `/plugin marketplace add` is the Claude Code CLI's way in
> and Cowork has no such command — the **Add marketplace** button is the same thing. The
> marketplace is named `aspen`, which is what you'll see the plugin listed under.

> The same marketplace also offers **`aspen-code`**. That's the other lane — authoring
> metadata with the `aspen` CLI — and it is not part of this setup. Install it only if you
> also write `_c` components.

### Cowork on the web (claude.ai/cowork)

Not supported for this install. Cowork web only accepts a remote HTTPS MCP URL, and the
runtime MCP runs locally on your machine. Use the **desktop** app.

---

## Step 4 — Verify it works

Start a new conversation and ask:

> **What objects are in my Aspen instance?**

Claude should call `aspen_describe` with no arguments and come back with a list of your
objects — mostly `_p` names like `account_p` and `contact_p`, plus any `_c` objects your
org has added. That single call proves all three things at once: the extension is loaded,
the instance URL resolves, and your API key is accepted.

(The catalog caps at about 100 objects. If yours is larger, the answer says so rather than
listing everything — ask about a specific object instead.)

Then try a real one:

> **Show me my 5 most recent accounts.**

You should get rows back, plus a link that opens the same list in your CRM.

Two more things to confirm the plugin loaded:

- Claude uses the namespace suffixes correctly without you explaining them — `_p` for
  platform, `_a` for an installed application, `_c` for your own — and never asks for
  `account` when it means `account_p`.
- Ask it to **create** a record — it should ask you to confirm before writing, every time.
  (The server enforces this itself; it cannot be talked out of it.)

There is **no delete tool** in this lane. Claude can create and update records, and that is
all — anything it makes while you're experimenting stays.

---

## Troubleshooting

| What you see | What's wrong | Fix |
|---|---|---|
| `AUTH_REQUIRED` | The API key is missing, wrong, expired, or revoked | Create a fresh key (Step 1) and re-enter it in **Settings → Extensions → Aspen Runtime MCP → Configure** |
| Every call redirects to a login page, or `NOT_FOUND` on everything | The instance URL is incomplete — usually the domain or instance name is missing, or a page path got left on the end | Re-enter it as the full `https://<host>/<domain>/<instance>` from Step 1, with nothing after the instance name |
| `INSTANCE_UNREACHABLE` | Wrong host, or you're off the network/VPN that can reach it | Paste the instance URL into a browser — if the CRM doesn't load there, it won't load here |
| `NOT_FOUND` on *everything*, and the URL is definitely right | The API base path was edited | Put **API base path** back to its default `/api/v24.3` |
| No `aspen_*` tools at all | The extension isn't installed or isn't enabled | **Claude Desktop → Settings → Extensions** — confirm **Aspen Runtime MCP** is present and toggled on, then restart Desktop |
| Tools work, but Claude guesses field names and gets them wrong | The plugin isn't installed | Redo Step 3 |
| Cowork sees no Aspen tools, but Claude Desktop does | Cowork's bridge to Desktop isn't up | Make sure Claude Desktop is running, then restart Cowork |
| `NOT_FOUND` on one object name only | A bare name was used where the namespaced one is needed | Not a setup problem — ask Claude to run `aspen_describe` and use the exact name it returns (`account_p`, not `account`) |
| `CONFIRMATION_REQUIRED` | Claude tried to write without your explicit yes | Working as intended. Say yes to the change it showed you |

---

## Updating

**Keep both halves current together.** The plugin's guidance names things the server
returns, so a new plugin against an old server (or the reverse) can point Claude at data
that isn't there.

1. **Runtime MCP** — the download URL never changes, so re-fetching gets you the current
   build. In **Claude Desktop → Settings → Extensions**, *uninstall* Aspen Runtime MCP
   **first**, then install the freshly downloaded `.mcpb`. Installing over the top can
   silently keep the old binary. You'll re-enter your instance URL and API key — the
   existing key still works, no need to create a new one.
2. **Plugin** — in **Cowork → Customize → Plugins**, update the `aspen` marketplace. That
   pulls whatever is on the repository's default branch, so you never wait for a release to
   get a fix.

To check which runtime MCP version a bundle holds before installing it:

```bash
unzip -p aspen-runtime-mcp-macos.mcpb manifest.json | grep -o '"version":"[^"]*"'
```

The plugin's version is shown beside it in Cowork's plugin list.

---

## Notes

- **Where the pieces come from** — the `.mcpb` bundle is a release asset on
  [aspen-crm/aspen-tools](https://github.com/aspen-crm/aspen-tools/releases?q=stdio-mcp),
  and the `stdio-mcp-latest` link always gives you the current build. The plugin is served
  from the same public repository, as marketplace `aspen`.
- **Linux** — `.mcpb` bundles exist for Linux on request, but Claude Desktop runs on macOS
  and Windows only, so they aren't part of this guide. They're for other hosts that launch
  a local MCP server.
- **Never paste your API key into a chat.** It belongs in the extension's config form and
  nowhere else. If Claude ever asks you for it, something is wrong — the model is not
  supposed to see it.
