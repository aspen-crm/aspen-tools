---
name: init
description: One-time onboarding for a freshly cloned Aspen application template. Derives the org name from the clone's folder name, prompts for the target Aspen Platform instance URL and metacode API key, rebrands the "company" placeholder, writes .env, installs the toolchain (x-cli, x-sdk, mover), then helps build out the app — a page, the data model/metadata, or whatever the user describes their CRM should do — deploys it to the instance, and re-initializes git so the clone is the user's own project. Does the work for the user; never tells them to run terminal commands. Run it right after cloning.
allowed-tools: Bash(npm install), Bash(npm run setup), Bash(npm run save), Bash(npm run checkin), Bash(node *), Bash(pwd), Bash(basename *), Bash(git *), Bash(rm -rf .git), Write, Edit, Read
---

# Init — onboard a fresh clone

Goal: rebrand this template, and get the clone fully set up **and deployed** to the developer's own
Aspen Platform instance. Work through the steps in order. If a step fails, stop and report it
rather than continuing.

**Do the work yourself.** Run every command and make every file change (rebrand, `.env`, install,
deploy) on the user's behalf. Never tell the user to open a terminal, run a command, or do a
manual step themselves — if something needs doing, you do it. Asking the user for *information* is
fine and expected (the instance URL, the API key, the page choice, anything else you need); what you
must not do is offload *actions* onto them.

## 1. Read the project docs

Read `README.md` (especially "Getting started" and "Deploy") and `AGENTS.md` so you follow this
repo's layout, conventions, and scripts.

## 2. Collect the instance + credentials

Ask the user, in plain conversation, for these two values and **wait for their reply** (ask for both
in one message). Do not guess, invent, or proceed until you have them:

- **`ASPEN_INSTANCE_URL`** (required) — the base URL of their Aspen Platform instance
  (e.g. `https://yourdomain-yourinstance.veevaxinfra.com`).
- **`X_METACODE_API_KEY`** (required) — their metacode API key, format `secret-token:veev_...`.

Treat the API key as a secret: never echo it back, print it, or include it in any summary or log.

## 3. Rebrand from the folder name

Derive the **org name** from the folder this repo was cloned into: take the current directory's name
(`basename "$PWD"`) and strip a leading `aspen-crm-` — e.g. `aspen-crm-acme` gives org `acme`. Only
if the folder is still an un-personalized default (`aspen-template`, or `aspen-crm-company-name`) or
has no company suffix, ask the user for the org name instead.

Then edit these files, replacing the `company` token in the identifier — do **not** touch the docs
(`README.md`, `AGENTS.md`), which describe the placeholder:

- `package.json` (root) -> `name`: `company-aspen` -> `<org>-aspen`.
- `metacode/ui/ui_main_c/package.json` -> `name`: `company-aspen-ui` -> `<org>-aspen-ui`.
- `metacode/ui/ui_main_c/xconfig.json` -> `routing.base-url-path-part`: `company-aspen` -> `<org>-aspen`.

## 4. Write `.env`

Write `.env` in the repo root (overwrite any existing file) with exactly these two lines, filled in
with the values from step 2:

```
export ASPEN_INSTANCE_URL=<the URL they gave>
export X_METACODE_API_KEY=<the key they gave>
```

## 5. Install the toolchain

From the repo root, run:

- `npm install` — root dev tooling and git hooks.
- `npm run setup` — installs `x-cli` / `x-sdk` into the UI package and downloads the `mover` deploy
  CLI from the instance (into `./mover`).

## 6. Build out the app (so it can deploy)

A fresh clone has no pages, so `routing.routes` in `xconfig.json` is empty and the app can't deploy
until at least one route points at a real page (the platform compiles the UI on checkin and rejects
an empty `routing.routes`). Ask the user what they want to build — frame it broadly, not just
"a page":

> To make your app deployable I'll add at least one page — but you're not limited to that. Tell me
> what you'd like and I'll build it:
> - a quick **Hello World** page to prove the pipeline,
> - your **data model** (objects, fields, layouts, picklists, tabs, list views — the metadata),
> - or just describe **what you want your CRM to do** and I'll build it out.
> Or skip for now.

Wait for their answer, then build it yourself following the repo's conventions:

- **Hello World** — run the bundled scaffold script from the repo root:

  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold-page.mjs"
  ```

  It writes `metacode/ui/ui_main_c/src/pages/home-page/HomePage.tsx` and adds its route to
  `xconfig.json` (idempotent).

- **A data model or a described CRM** — build it:
  - Metadata under `metacode/metadata/` — see `metacode/metadata/README.md` for the directory /
    `ctype` map and the `_c` naming rule.
  - UI under `metacode/ui/ui_main_c/src/` — follow `docs/agents/frontend-development.md`; each page is
    wrapped with the app providers, exported via `definePage`, and registered in `xconfig.json`
    (customer components use the `_c` suffix). The template at
    `${CLAUDE_PLUGIN_ROOT}/templates/pages/home-page/HomePage.tsx` is a good starting shape.
  - Whatever they ask for, make sure the result includes **at least one routed page** so the app can
    deploy. If their request is data-model-only, add a simple landing page too (the Hello World
    scaffold is fine).

- **Skip** — leave `routing.routes` empty. There is nothing to deploy yet; skip the deploy (step 8)
  and, in your report, offer to build something whenever they're ready (you'll do it — don't ask them to).

## 7. Make it the user's own repository (fresh git history)

The clone's git history and `origin` still point at the shared template, which the user can't push
to. Give them a clean, self-owned starting point — run this yourself from the repo root:

```bash
rm -rf .git
git init -b main
git add -A
git commit -m "Initial commit"
```

Do **not** add a remote or ask for a repo URL — the app is fully set up and works locally as-is; the
user adds their own remote (any git host) whenever they're ready. `.env`, `node_modules`, and `mover`
are gitignored, so no secrets or binaries are committed.

## 8. Deploy it (you run this — do not ask the user to)

If a page was added, deploy it yourself by running these from the repo root, in order, stopping and
reporting if any step fails (no local build is needed — the platform compiles the UI on checkin):

```bash
npm run save      # upload the metacode package to the instance
npm run checkin   # checkin-prep --deploy-when-ready
```

Do not print these for the user to run — run them. If a step fails (e.g. `npm run setup`/`mover`
download failed earlier from a bad instance URL or API key, or a checkin compile error), surface the
error, explain the likely cause, fix what you can (e.g. rewrite `.env`), and retry — again, yourself.

## 9. Report

Summarize what you did: rebranded to `<org>-aspen`, installed the toolchain, downloaded `mover`,
added the first page, and deployed to the instance (or, if the user skipped the page, that it's set
up but not yet deployed, and you'll add a page and deploy whenever they want). Do not treat the API
key as anything but a secret. Never end by instructing the user to run commands themselves.
