---
name: custom-ui-design-tokens
description: A genuinely custom page (rollups + tiles) that must be styled with the Aspen design system.
tags: [ui, design-system, tokens]
runs: 2
max_turns: 24
timeout_seconds: 700
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

You're building on our Aspen CRM instance. The session is rooted in the instance folder, with
`metacode/` in it, and a TypeScript UI codefile already set up at `metacode/ui/ui_main_c/`.

I need an **account health dashboard** page for a single account. A standard record layout can't do
this — it has to compute rollups and render its own widgets:

- A row of summary **stat tiles** across the top: open-opportunity count, total open pipeline
  (currency), and a health score.
- Below the tiles, a **table of the account's related orgs**, one row each, with a colored health
  **badge** (green / amber / red) per row.

Pull the data from the instance's query endpoints. Build it as a custom page at
`metacode/ui/ui_main_c/src/pages/account-health.tsx`, and declare its route in
`metacode/ui/ui_main_c/aspen.client.json`.

It needs to look like it belongs in Aspen — match the product's look, and hold up in dark mode and
on a narrow screen, not just on my machine in light mode. This is an authoring exercise on a local
checkout — there's no live instance to deploy to, so don't run the `aspen` CLI, `npm run build`, or
try to deploy; just write the page and explain your key styling decisions.
