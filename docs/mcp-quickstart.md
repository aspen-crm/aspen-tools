# MCP quickstart

Connect Claude to your Aspen CRM in about five minutes. Once connected, you can view, search,
report on, create, update and delete records, attach files and merge duplicate contacts, in
plain language.

Every Aspen instance serves its own MCP server. There is nothing to download: you add your
instance's URL as a connector and sign in to it as yourself.

## The one prompt

If you would rather be walked through it, paste this into a Claude or Cowork conversation:

```text
Read https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/docs/installing-for-cowork.md in full and help me install it, one step at a time. Ask me for my Aspen instance URL when you need it.
```

Claude works the steps with you and spells out your connector URL. Everything below is the
same install, done by hand.

## Step 1 — Your connector URL

Open your Aspen CRM in a browser. Your **instance URL** is the host, your domain, then the
instance name, and nothing after it:

```
https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename
```

Your **connector URL** is that with `/mcp` on the end:

```
https://0000-00-0999-ip.aspen-crm.com/domain.com/instancename/mcp
```

Whatever the CRM appends as you click around — a tab, a record, a view — is not part of it.

## Step 2 — Add the connector

### Claude on the desktop or the web

1. **Settings -> Connectors -> Add custom connector**.
2. Name it **Aspen**, paste your connector URL, and add it.
3. Click **Connect**. Aspen's own sign-in page opens; sign in as you normally would and
   approve.

The connector is signed in as you, so everything Claude can see or change through it is
exactly what you can see or change in the CRM.

**On a Team or Enterprise plan?** Custom connectors are added for the whole organization by an
owner. Send them your connector URL and this page; once it is added, everyone picks it up from
**Settings -> Connectors**.

### Claude Code

```sh
claude mcp add --transport http aspen https://<host>/<domain>/<instance>/mcp
```

Then `/mcp` to sign in. If the connector is already on the claude.ai account you signed in to
Claude Code with, it is there already — do not add it twice.

### Other MCP clients

The server is a Streamable HTTP MCP endpoint with OAuth, so any client that supports both
connects with the same URL.

## Step 3 — Install the plugin

The connector carries the tools; the **aspencrm-ai** plugin carries the procedures for using
them well. The connector works without it, but Claude guesses more. Install both.

| Where | How |
|---|---|
| Claude Code | `/plugin marketplace add aspen-crm/aspen-tools` then `/plugin install aspencrm-ai@aspen` |
| Cowork | **Customize -> Plugins**, upload [aspencrm-ai-plugin.zip](https://github.com/aspen-crm/aspen-tools/releases/download/aspencrm-ai-latest/aspencrm-ai-plugin.zip) |

## Step 4 — Check it worked

A conversation's tools are fixed when it starts, so **start a new conversation** — the
connector you just added does not exist in the one you have been using. Then ask:

```text
What objects are in my Aspen CRM?
```

A real answer lists your objects — `account_p`, `contact_p`, `opportunity_p` and any `_c`
objects your org has added. That proves the connector is live and signed in as you.

## What you get

The server exposes three tools over your instance's REST API:

| Tool | What it does |
|---|---|
| `summarize_api` | Lists every operation the server will run, by tag, each marked safe or not. |
| `search_api_operations` | Finds the operations matching plain words, with their request schemas. |
| `execute_api_request` | Runs one operation as the signed-in user. |

Writes are approved in your client before they run. Reads are not.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| No Aspen tools at all | The connector is not added, not connected, or switched off for this conversation | **Settings -> Connectors**: confirm **Aspen** is there and connected, then check it is enabled in the conversation's tools menu |
| No Aspen tools, and you added the connector a minute ago | The conversation started before the connector existed | Start a new conversation |
| It will not connect, or sign-in loops | The URL is missing the domain or instance name, or does not end in `/mcp` | Re-add it exactly as Step 1 spells it out |
| No **Add custom connector** button | Team or Enterprise plan | An owner adds it for the organization |
| It worked, and now every request fails to sign in | Your session with the instance expired or was revoked | **Settings -> Connectors -> Aspen -> Connect** and sign in again |
| "needs the user's approval, which this client cannot collect" | The app cannot show approval prompts, so it can read but not write | Make changes from an app that shows approval prompts, or in the CRM |

## Next

- [installing-for-cowork.md](installing-for-cowork.md) — the same install, step by step, written
  for Claude to work through with you.
