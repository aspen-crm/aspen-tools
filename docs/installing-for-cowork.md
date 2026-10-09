# Installing Aspen for Claude and Cowork — end-user guide

Work your Aspen CRM from Claude: view, search, report on, create, update and delete records,
attach files, and merge duplicate contacts, in plain language.

**The quickest way through this page:** paste its URL into a Claude or Cowork conversation
and say "read this and help me install". Claude will work the steps with you, one at a time.
Or just follow the steps yourself — they're written for both.

> **If you're Claude, reading this page for someone:** this document is agent-executable.
> Work the steps in order with them, and follow these rules.
>
> - **Ask for their instance URL first**, unless they already gave it: it is what Step 1
>   builds the connector URL from, and every later step names that URL back to them.
> - **Every click in settings is theirs.** Adding a connector, signing in and uploading a
>   plugin happen in their app, not in your tools. Tell them exactly where to click, then
>   wait for them to say it's done.
> - **Print the URL every single time you name a file or an address.** "Click the link" with
>   no link is a broken instruction. Copy the plugin URL out of Step 3 verbatim into your own
>   message, and spell out their connector URL once you have their instance URL.
> - **Never ask for a password, token or API key, and refuse one if it's offered.** Signing
>   in happens on Aspen's own sign-in page. Nothing secret belongs in a conversation.
> - **You cannot verify this install yourself.** A conversation's tools are fixed when it
>   starts, so the connector you just helped add will not appear in *this* one. Step 4
>   happens in a fresh conversation, and it's theirs to run.

---

## What you're installing

There are **two pieces**, and you need both:

| Piece | What it is | Where it goes |
|---|---|---|
| **The Aspen connector** — your instance's own MCP server | The tools. Your instance serves them; Claude signs in to it **as you**. Nothing to download. | Settings → Connectors |
| **The plugin** — `aspencrm-ai-plugin.zip` | The know-how. Skills that teach Claude your instance's grammar and how to change records safely. | Cowork → Customize → Plugins |

The connector without the plugin works, but Claude guesses more. Install both.

Both install **once** — every future conversation has them. There is nothing to redo per
session, and it works on the desktop app and on the web alike.

**Time:** about 5 minutes. **You'll need:** your Aspen instance URL, and your Aspen sign-in.

**Coming from the old setup?** If you installed the **Aspen Runtime MCP** extension
(`aspen-runtime-mcp-*.mcpb`) or the **aspen-cowork** plugin before, remove both first —
Claude Desktop → **Settings → Extensions** for the extension, Cowork → **Customize → Plugins**
for the plugin. They are retired, and left in place they show Claude a second, older set of
Aspen tools. The API key you made for the extension is no longer used; you can delete it in
Aspen's **API Keys** screen.

---

## Step 1 — Work out your connector URL

Open your Aspen CRM in a browser and look at the address. Your **instance URL** is the
**full path to your instance**: the host, then your domain, then the instance name.

- ✅ `https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename`
- ❌ `https://0000-00-0999-ip.aspen-crm.com`
- ❌ `https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename/ui/objects/account_p`

Whatever the CRM appends after the instance name as you click around — a tab, a record, a
view — is not part of it.

Your **connector URL** is that, with **`/mcp`** on the end:

```
https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename/mcp
```

## Step 2 — Add the connector and sign in

1. In Claude (desktop or web), open **Settings → Connectors**.
2. Click **Add custom connector**. Name it **Aspen**, paste the connector URL from Step 1,
   and click **Add**.
3. Click **Connect** on the new connector. Aspen's own sign-in page opens: sign in as you
   normally do and allow access.

The connector is now signed in as you. Everything Claude can see or change through it is
exactly what you can see or change in the CRM — no more.

**No "Add custom connector" button?** On a Team or Enterprise plan, an owner adds custom
connectors for the organization. Send them the connector URL and this page; once they've
added it, you click **Connect** and sign in yourself.

## Step 3 — Install the plugin (`.zip`)

1. Download the plugin:
   [`aspencrm-ai-plugin.zip`](https://github.com/aspen-crm/aspen-tools/releases/download/aspencrm-ai-latest/aspencrm-ai-plugin.zip)

   ```
   https://github.com/aspen-crm/aspen-tools/releases/download/aspencrm-ai-latest/aspencrm-ai-plugin.zip
   ```

   This link always gives you the current version. **Don't unzip it.**
2. In Cowork, open **Customize → Plugins**. Click **Add → Upload plugin**, and select the
   zip as it downloaded.

It installs for you: available in every session, no per-conversation setup.

> **Using Claude Code as well?** There the plugin comes from this repository's marketplace
> instead — `/plugin marketplace add aspen-crm/aspen-tools`, then
> `/plugin install aspencrm-ai@aspen`. Same plugin, same version; only the delivery differs.
> If you signed in to Claude Code with the same Claude account, the connector from Step 2 is
> there already. Otherwise add it with
> `claude mcp add --transport http aspen <connector URL>` and sign in from `/mcp`.

## Step 4 — Check it worked

**Start a new conversation first.** A conversation loads its tools when it starts, so the
connector you just added won't exist in the one you've been using. Then ask:

> **What objects are in my Aspen instance?**

Claude should come back with a list of your objects — mostly `_p` names like `account_p` and
`contact_p`, plus any `_c` objects your org has added. That one answer proves the connector
is loaded, the URL is right, and your sign-in works.

Then try a real one:

> **Show me my 5 most recent accounts.**

Two more things confirm the plugin loaded:

- Claude uses the namespace suffixes correctly without you explaining them — `_p` for
  platform, `_c` for your own — and never asks for `account` when it means `account_p`.
- Ask it to **create** a record. It shows you what it will write, and then **your app asks
  you to approve the request** before anything is sent. Every change works that way — the
  instance enforces it, and Claude cannot skip it.

**Deletes are permanent.** Claude can delete records here, and can change or delete many in
one go. It always asks you in words first, and you approve each request on top of that.
There is no undo and no recycle bin, so read what it shows you before you say yes.

**Files:** small files (up to roughly 180 KB) can be attached through Claude. For anything
larger, Claude will tell you which record and field it is, and you upload it in the CRM.

---

## Troubleshooting

| What you see | What's wrong | Fix |
|---|---|---|
| No Aspen tools at all | The connector isn't added, isn't connected, or is switched off for this conversation | **Settings → Connectors** — confirm **Aspen** is there and connected. In the conversation, check it's enabled in the tools menu |
| No Aspen tools, and you added the connector a minute ago | The conversation started before the connector existed | Start a new conversation |
| The connector won't connect, or sign-in loops | The URL is incomplete — usually the domain or instance name is missing — or doesn't end in `/mcp` | Re-add it as `https://<host>/<domain>/<instance>/mcp`, exactly as in Step 1 |
| Sign-in page won't load | Wrong host, or you're off the network/VPN that reaches it | Open your instance URL in a browser — if the CRM doesn't load there, it won't load here |
| It worked, and now every request fails to sign in | Your session with the instance expired or was revoked | **Settings → Connectors → Aspen → Connect**, and sign in again |
| "…not permitted" / `AUTHORIZATION_FAILURE` | You're signed in, but your Aspen role can't do that | Ask your Aspen admin. Claude can only do what you can do in the CRM |
| "…needs the user's approval, which this client cannot collect" | This app can't show approval prompts, so it can read but not write | Reads still work here. Make changes from an app that shows approval prompts, or in the CRM |
| Claude sees two sets of Aspen tools | The retired **Aspen Runtime MCP** extension or **aspen-cowork** plugin is still installed | Remove them (see *Coming from the old setup?*) |
| Tools work, but Claude guesses field names and gets them wrong | The plugin isn't installed | Redo Step 3 |
| The plugin upload is rejected | The zip was unzipped, or re-zipped after editing | Download [`aspencrm-ai-plugin.zip`](https://github.com/aspen-crm/aspen-tools/releases/download/aspencrm-ai-latest/aspencrm-ai-plugin.zip) again and upload it untouched |
| An approval prompt you didn't expect | Claude is about to change data | Read it. Approve only what you asked for; declining is always safe |
