---
name: contact-merge
description: Use when asked to merge, de-duplicate, dedupe, combine, or unmerge/split contact_p records on an Aspen instance — fold a duplicate contact into a survivor, or reverse a merge. Drives the platform's contact merge/unmerge endpoints through the bundled helper (the runtime MCP has no merge tool); finding, comparing and editing the contacts still goes through records. Contacts only — there is no account merge.
---

# Contact merge / unmerge

Fold a duplicate `contact_p` into a survivor, or reverse a merge, through the platform's
own merge endpoints. The runtime MCP has **no merge tool**, and the merge state is
**not writable through the records tools** — `merged_into_p` and the `contact_merge_p`
log are maintained by the endpoints alone, and a direct write is rejected. The bundled
helper is the one way this lane reaches them:

```
node "${CLAUDE_PLUGIN_ROOT}/skills/contact-merge/scripts/contact-merge.mjs" merge   --survivor <id_p> --merged <id_p> --reason "why"
node "${CLAUDE_PLUGIN_ROOT}/skills/contact-merge/scripts/contact-merge.mjs" unmerge --merge-id <id_p> --reason "why"
node "${CLAUDE_PLUGIN_ROOT}/skills/contact-merge/scripts/contact-merge.mjs" check
```

It needs a shell with `node` — Claude Code. In a host without one (Claude Desktop), hand
the user the pair(s) and their `app_url`s and point them at the merge action in the app.

## What a merge is — set the expectation first

A merge is a **pointer move, not a data merge.** The duplicate gets `merged_into_p =
survivor` and is thereby not-active; one append-only `contact_merge_p` event records the
pair, the actor and the reason. **Nothing is copied to the survivor and nothing that
points at the duplicate is repointed.** Both records stay. An unmerge clears the pointer and
flags the event `unmerged_p`; it reverses nothing else because nothing else was written.
There is no `is_active_p` on `contact_p` — `merged_into_p` being set is the whole signal.

So when the duplicate holds a better value (a mobile number, a title, the current email),
**carry it over before merging** with an ordinary `records` update on the survivor. After
the merge that value is still readable on the duplicate, but no list or search will lead
anyone to it.

## Merge — find, pick, carry over, confirm, run, prove

1. **Find the candidates** with `records`: `aspen_list contact_p` filtered on
   `work_email_p`, or `last_name_p` + `first_name_p`, or `aspen_search` on the name.
   **Name `merged_into_p` in `fields`** — a contact with it set is already merged and is
   neither a survivor nor a duplicate candidate (the filters can't express "is empty", so
   select it and read it). `aspen_get` each candidate and show them side by side.
2. **Pick the survivor with the user.** Defaults when they ask you to choose: the record
   with the canonical work email, the fuller and more recent data, and the one with more
   related records (`aspen_related` — activities, opportunities, roles). Say which and why.
3. **Carry over** anything the duplicate has that the survivor lacks: a normal
   confirm-gated `aspen_records_update` on the survivor, per `records`. Skip if nothing to
   carry.
4. **Confirm the pair.** Show a table — survivor (`id_p`, name, email) / merged (`id_p`,
   name, email) / reason — and get an explicit **yes**. This is the write's confirmation;
   the helper has no gate of its own.
5. **Run the helper** with `merge`. Read the JSON it prints:
   `status: SUCCESS` with `merge_id`, `survivor_id`, `merged_id` — **keep the `merge_id`**,
   it is the only key an unmerge takes. Anything else: the error table below.
6. **Prove it.** `aspen_get contact_p <merged_id>` — `merged_into_p` must equal the
   survivor. Then `aspen_get contact_p <survivor_id>` and end with **its `app_url`** as a
   link, plus the `merge_id`. A merge you haven't read back is not done.

**One pair per call, always.** The helper sends exactly one row, because a signed-in user
may send exactly one — a batch is refused by the instance. For a list of pairs, confirm
the whole list once as a table (step 4), then run the helper once per pair, in order, and
report a table of outcomes at the end. Stop and ask on the first `AUTH_REQUIRED`,
`NOT_AVAILABLE` or `REJECTED`; a per-row `FAILURE` is that pair's outcome, not a reason to
stop the rest.

## Unmerge — find the event, confirm, run, prove

1. **Find the `merge_id`.** From the merge report if you made it; else
   `aspen_list contact_merge_p` with the filter `merged_p eq <duplicate id_p>` and fields
   `id_p, survivor_p, merged_p, unmerged_p, merge_reason_p, ct_p`, and take the row whose
   `unmerged_p` is **false** (filter on the id, not the checkbox — `aspen_list` quotes every
   filter value and the instance rejects a quoted checkbox). The event's `id_p` is the
   `merge_id`.
2. **Confirm** — show survivor / merged / when / original reason, get a **yes**.
3. **Run the helper** with `unmerge --merge-id <id_p> --reason "why"`.
4. **Prove it.** `aspen_get contact_p <merged_id>` — `merged_into_p` is now empty. End with
   that contact's `app_url`.

A user's unmerge is remembered: the platform will refuse a *system* re-merge of that pair
(`CANNOT_REMERGE`) for good, while a user can still re-merge it by hand. Say so when the
user unmerges something a sync created.

## The helper's result — route on `status`, then `error_type`

| `status` / `error_type` | meaning / do |
|---|---|
| `SUCCESS` | the row applied (or was already applied — same pair twice returns the existing `merge_id`). Prove it. |
| `FAILURE` · `INVALID_INPUT` | an id names no contact you can see, or the two ids are one contact. Re-`get` both; ask. |
| `FAILURE` · `ALREADY_MERGED` | the duplicate is already merged into someone else — `resolved_survivor_id` names whom. Show the user; don't re-aim it (that needs an unmerge first). |
| `FAILURE` · `SURVIVOR_MERGED` | your survivor is itself a duplicate; `resolved_survivor_id` is its root. Offer to merge into the root instead. |
| `FAILURE` · `HAS_CHILDREN` | the duplicate is itself a survivor of earlier merges. Unmerge its children first (find them: `aspen_list contact_merge_p` filtered `survivor_p eq <duplicate>`, keep rows with `unmerged_p` false), then merge each of them and it into the new survivor, one call each. |
| `FAILURE` · `CANNOT_REMERGE` | a person deliberately separated this pair. Terminal — do not retry; tell the user. |
| `FAILURE` · `INVALID_DATA` (unmerge) | no such `merge_id`, or not visible to you. Re-list `contact_merge_p`. |
| `FAILURE` · `INVALID_STATE` (unmerge) | the survivor has since been merged, or the pointer no longer matches the event. Show the user the current `merged_into_p`; ask. |
| `REJECTED` (HTTP 400/422) | the request shape was refused — read `detail`. If it says more than one row or `merge_source`, the helper is being misused; report it. |
| `NOT_AVAILABLE` (HTTP 404) | this instance's build has no merge endpoints. Stop; the user merges in the app. |
| `AUTH_REQUIRED` | expired or missing credential. Relay the `fix_hint` the call returned — it names this host's fix (the connector's settings on Cowork/Desktop, `aspen login --instance <URL> --api-key <KEY>` on Claude Code). Do not send a Cowork user to a CLI they do not have. **Never read, print or set the token yourself.** |
| `NO_IDENTITY` (exit 3) | nothing to sign in with — the `detail` names the fix. Relay it verbatim. |
| `TRANSPORT` / `USAGE` | network or your arguments. Fix and retry once; then surface it. |

`check` prints where the identity comes from (`env`, `mcp-env`, `aspen-cli`) and the
instance — run it first when a session starts with merges, or when anything above is
`AUTH_REQUIRED`. `--dry-run` prints the exact request minus the token and sends nothing.

## Non-negotiables

- **Contacts only.** There is no account merge on the platform — no `account_merge_p`, no
  pointer on `account_p`, no endpoint. Say so plainly; do not invent one with `_c` fields.
- **Never write `merged_into_p` or `contact_merge_p` through the records tools.** The
  instance rejects both; the helper is the path.
- **Never pass a source.** The helper sends no `merge_source`; the instance stamps `user_p`
  from the signed-in identity. There is no flag for it, on purpose.
- **Both contacts must be visible to the signed-in user.** A private contact you can't see
  reads as `INVALID_INPUT`; that is the boundary, not a bug to work around.
- **Never handle the token.** The helper resolves the login the way the MCP does — the
  environment, the installer's env file, then the `aspen` CLI's stored login — and prints
  nothing secret. If it can't, the user fixes the login; you do not go looking for it.
- **Merged contacts still show up in reads.** `aspen_list`/`aspen_search` don't hide them;
  select `merged_into_p` and treat a set value as "merged into that survivor" whenever the
  answer depends on it.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "I'll set `merged_into_p` with `aspen_records_update`" | Rejected by the instance. Use the helper. |
| "Merging will move the phone number over" | It moves nothing. Carry it over first with `records`. |
| "I'll batch the 40 pairs into one call" | One row per call for a user. Confirm the list once, run once per pair. |
| "I'll pass `--source miner_p` so it's attributed right" | No such flag; a user caller may not name a source. |
| "`CANNOT_REMERGE` — I'll retry later" | Terminal. A person separated that pair; tell the user. |
| "The helper said SUCCESS, so it's merged" | `aspen_get` the duplicate and read `merged_into_p`. Then the survivor's `app_url`. |
| "I'll curl the endpoint with the token from the keyring" | Never. The helper holds the credential; you never see it. |
| "They asked for an account merge — I'll add `merged_into_c`" | No account merge exists. Say so; authoring `_c` fields is the other lane, and still not a merge. |
