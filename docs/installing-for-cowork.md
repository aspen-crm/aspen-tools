# Installing Aspen for Cowork — end-user guide

Work your Aspen CRM from Claude: view, search, report on, create, and update records in
plain language.

There are **two pieces**, and you need both:

| Piece | What it is | Where it goes |
|---|---|---|
| **Runtime MCP** — `aspen-runtime-mcp-<os>.mcpb` | The tools. A small program that talks to your instance's API. **This is the piece that holds your API key.** | Claude Desktop → Extensions |
| **Cowork plugin** — `aspen-cowork-plugin.zip` | The know-how. Skills that teach Claude how to explore your model and make changes safely. | Cowork → Customize → Plugins |

Installing the tools without the plugin works, but Claude guesses more. Install both.

Both install **once, globally** — every future conversation has them. There is nothing to
redo per session.

**Time:** about 10 minutes. **You'll need:** your Aspen instance URL, and permission to
create an API key in it.

---

## Fastest way — let Claude do it

Open a Cowork conversation and paste the whole block below. Claude downloads both files for
you, then walks you through the parts only you can do.

````
You're helping me install Aspen for Claude. There are two pieces: a runtime MCP bundle
(.mcpb) that goes into Claude Desktop, and a Cowork plugin (.zip) that goes into Cowork.

Work through this with me one step at a time. Stop and wait for me at every point where I
have to do something myself — don't run ahead.

STEP 1 — Download both files.

Work out whether I'm on macOS or Windows, then download the matching pair into my Downloads
folder. If you can't write there, use your working folder and tell me exactly where that is.

  macOS runtime MCP:
  https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-macos.mcpb

  Windows runtime MCP:
  https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-windows.mcpb

  Cowork plugin (same file for both platforms):
  https://github.com/aspen-crm/aspen-tools/releases/download/aspen-cowork-latest/aspen-cowork-plugin.zip

Check that each file really arrived: non-zero size, and a valid archive rather than a saved
HTML error page. Both .mcpb and .zip are zip archives, so an integrity test on each works.

If you have no network access, don't improvise a workaround. Say so, print the two links I
need, and ask me to click them and tell you when they've finished downloading.

Either way, tell me the full path of each file before moving on.

STEP 2 — My API key and instance URL.

Walk me through this:
  1. Log in to my Aspen instance in a browser.
  2. Go to API Keys and create one — I'll name it "Claude Desktop".
  3. Copy it as soon as it's shown. It looks like secret-token:aspen_xxxxxxxx and I need
     the whole string including the secret-token: prefix.

Then have me find my instance base URL — the full path: host, then domain, then instance
name.

  Right:  https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename
  Wrong:  https://0000-00-0999-ip.aspen-crm.com          (host only)
  Wrong:  https://.../instancename/ui/objects/account_p  (a page inside the CRM)

Whatever the CRM appends to the URL as I click around is not part of the base URL.

NEVER ask me to paste the API key into this chat, and don't accept it if I offer it. It
goes into the extension's config form and nowhere else. Just wait for me to say I have it.

STEP 3 — Install the runtime MCP.

Tell me to double-click the .mcpb you downloaded, or use Claude Desktop → Settings →
Extensions → Install Extension. A config form appears. Tell me to fill it in as:

  Instance base URL       my full instance URL from Step 2 (a trailing slash is fine)
  API token               the secret-token:aspen_... key, pasted whole
  API base path           leave it exactly as it is: /api/v24.3

On macOS the bundled program is ad-hoc signed, so macOS may warn the first time it runs.
That's expected. Wait for me to confirm the extension is installed.

STEP 4 — Install the Cowork plugin.

Tell me to open Cowork → Customize → Plugins → Add → Upload plugin, and pick the
aspen-cowork-plugin.zip you downloaded. It uploads as a zip — I must NOT unzip it first.
Wait for me to confirm.

STEP 5 — Check it worked.

Try calling aspen_describe with no arguments.

You probably don't have that tool: this conversation loaded its tools before the extension
existed. If it's missing, say so plainly rather than guessing — then tell me to start a
FRESH conversation and ask these two things:

  "What objects are in my Aspen instance?"
     Should list my objects, mostly _p names like account_p and contact_p.

  "Show me my 5 most recent accounts."
     Should return rows, plus a link that opens the same list in my CRM.

If either one fails, point me at the Troubleshooting table in
https://github.com/aspen-crm/aspen-tools/blob/main/docs/installing-for-cowork.md
````

Claude will pause and wait for you several times — that's the design, not a stall. It also
can't confirm the install itself: a conversation's tools are fixed when it starts, so the
extension you just installed won't appear until you open a new one.

---

## Or install it by hand

### Step 1 — Create your API key

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

While you're here, note your **instance base URL** — you need that in Step 2 too. It's the **full path** to your instance: the host, then your domain, then the instance name.

- ✅ `https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename`
- ❌ `https://0000-00-0999-ip.aspen-crm.com`
- ❌ `https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename/ui/objects/account_p`

Whatever the CRM appends after it as you click around — a tab, a record, a view — is not part of the base URL.

**Never paste your API key into a chat.** It belongs in the extension's config form and
nowhere else. If Claude ever asks you for it, something is wrong — the model is not
supposed to see it.

### Step 2 — Install the runtime MCP (`.mcpb`)

| OS | File |
|---|---|
| macOS (Intel + Apple Silicon) | [`aspen-runtime-mcp-macos.mcpb`](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-macos.mcpb) |
| Windows (x64) | [`aspen-runtime-mcp-windows.mcpb`](https://github.com/aspen-crm/aspen-tools/releases/download/stdio-mcp-latest/aspen-runtime-mcp-windows.mcpb) |

**Double-click the `.mcpb` file**, or open **Claude Desktop → Settings → Extensions →
Install Extension** and pick it.

| Field | What to enter |
|---|---|
| **Instance base URL** | The full instance URL from Step 1, e.g. `https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename`. A trailing slash is fine — it's ignored |
| **API token** | The `secret-token:aspen_…` key you created in Step 1, pasted whole |
| **API base path (advanced)** | **Leave as-is** — `/api/v24.3`. There is nothing to change here |

Click through to finish.

### Step 3 — Install the Cowork plugin

1. Click
   [`aspen-cowork-plugin.zip`](https://github.com/aspen-crm/aspen-tools/releases/download/aspen-cowork-latest/aspen-cowork-plugin.zip). **Don't unzip it**

2. In Cowork, open **Customize → Plugins**. Click **Add → Upload plugin**.
3. Select the `aspen-cowork-plugin.zip` you just downloaded. Upload the zip as-is.

It installs at user scope: available in every session, no per-conversation setup.

> **Using Claude Code as well?** There the plugin comes from this repository's marketplace
> instead — `/plugin marketplace add aspen-crm/aspen-tools`, then
> `/plugin install aspen-cowork@aspen`. Same plugin, same version; only the delivery
> differs. The marketplace also carries `aspen-code`, the CLI-authoring lane, which is not
> part of this setup.

#### Cowork on the web (claude.ai/cowork)

Not supported for this install. Cowork web only accepts a remote HTTPS MCP URL, and the
runtime MCP runs locally on your machine. Use the **desktop** app.

### Step 4 — Verify it works

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

You should get rows back if there is data, plus a link that opens the same list in your CRM.

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
