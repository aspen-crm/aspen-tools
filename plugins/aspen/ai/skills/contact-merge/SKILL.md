---
name: contact-merge
description: Use when asked to find duplicate contacts, or to merge, de-duplicate, dedupe, combine, or unmerge/split contact_p records on an Aspen instance — fold a duplicate contact into a survivor, or reverse a merge. Drives the platform's duplicate-search, merge and unmerge endpoints (/crm/contact/duplicates/search, /crm/merge/contact_p, /crm/unmerge/contact_p) through execute_api_request; comparing and editing the contacts goes through records. Contacts only — there is no account merge.
---

# Contact merge / unmerge

Fold a duplicate `contact_p` into a survivor, or reverse a merge, through the platform's own
endpoints. The merge state is **not writable through a records update** — `merged_into_p`
and the `contact_merge_p` log are maintained by these endpoints alone.

```
POST /api/v24.3/crm/contact/duplicates/search   {"data": {"first_name_p": "Ana", "last_name_p": "Diaz", "work_email_p": "ana@acme.com"}}
POST /api/v24.3/crm/merge/contact_p             {"data": [{"survivor_id": "<id_p>", "merged_id": "<id_p>", "merge_reason": "why"}]}
POST /api/v24.3/crm/unmerge/contact_p           {"data": [{"merge_id": "<contact_merge_p id_p>", "unmerge_reason": "why"}]}
```

Duplicate search is `safe`. Merge and unmerge are approved in the host.

## What a merge is — set the expectation first

A merge is a **pointer move, not a data merge.** The duplicate gets `merged_into_p =
survivor`, which alone makes it inactive, and one append-only `contact_merge_p` event records
the pair, who did it and why. **Nothing is copied to the survivor and nothing pointing at the
duplicate is repointed.** Both records stay. An unmerge clears the pointer and marks the event
`unmerged_p`; it reverses nothing else because nothing else was written.

So when the duplicate holds a better value (a mobile number, the current email), **carry it
over before merging** with an ordinary `records` update on the survivor.

## Merge — find, pick, carry over, confirm, run, prove

1. **Find the candidates.** `duplicates/search` with what you know of the person (at least one
   field; all-blank is refused) returns ranked `data.candidates`. Or query `contact_p` on
   `work_email_p`, or `last_name_p` + `first_name_p`. **Select `merged_into_p`** — a contact
   with it set is already merged, and is neither a survivor nor a candidate. Read both
   contacts in full and show them side by side.
2. **Pick the survivor with the user.** When asked to choose: the canonical work email, the
   fuller and more recent data, more related records (activity, opportunities, roles). Say
   which and why.
3. **Carry over** what the duplicate has and the survivor lacks — a normal update (`records`).
4. **Confirm the pair in the conversation:** survivor (`id_p`, name, email) / merged (`id_p`,
   name, email) / reason. Get an explicit **yes**, then send; the host asks once more.
5. **Read the row:** `body.data[0].status` `SUCCESS` with `merge_id`, `survivor_id`,
   `merged_id`. **Keep the `merge_id`** — it is the only key an unmerge takes.
6. **Prove it.** Query the duplicate: `merged_into_p` must equal the survivor. Report both
   names, their `id_p`s and the `merge_id`.

**One pair per request.** A signed-in user may send exactly one row; more is refused. For a
list of pairs, confirm the whole list once as a table, then send one request per pair (each
approved), and report a table of outcomes. Stop on the first auth or request-level failure;
a per-row `FAILURE` is that pair's outcome, not a reason to stop the rest.

**Never send `merge_source`.** The instance attributes a user's merge to the user; a user
request that names a source is refused.

## Unmerge — find the event, confirm, run, prove

1. **Find the `merge_id`:** from your merge report, or
   `SELECT id_p, survivor_p, merged_p, unmerged_p, merge_reason_p, ct_p FROM contact_merge_p WHERE merged_p = '<duplicate id_p>' ORDER BY ct_p DESC LIMIT 10`
   and take the row with `unmerged_p` false. Its `id_p` is the `merge_id`.
2. **Confirm** survivor / merged / when / original reason; get a **yes**.
3. **Send** the unmerge with an `unmerge_reason`.
4. **Prove it:** the duplicate's `merged_into_p` is now empty.

A user's unmerge is remembered: the platform will never again merge that pair automatically
(`CANNOT_REMERGE` for a system merge), though a person can still merge it by hand. Say so when
the user splits a pair a sync created.

## Route on the row's `status`, then the failure's `error_type`

| What comes back | Meaning / do |
|---|---|
| `SUCCESS` | Applied — or already applied (the same pair twice returns the existing `merge_id`). Prove it. |
| `FAILURE` · `INVALID_INPUT` | An id names no contact the user can see, or both ids are one contact. Re-read both; ask. |
| `FAILURE` · `ALREADY_MERGED` | The duplicate is already merged into someone else — `context.resolved_survivor_id` names whom. Show the user; re-aiming it needs an unmerge first. |
| `FAILURE` · `SURVIVOR_MERGED` | Your survivor is itself a duplicate; `context.resolved_survivor_id` is its root. Offer to merge into the root. |
| `FAILURE` · `HAS_CHILDREN` | The duplicate is itself the survivor of earlier merges. Unmerge its children first (`contact_merge_p` rows with `survivor_p` = it and `unmerged_p` false), then merge each into the new survivor. |
| `FAILURE` · `CANNOT_REMERGE` | A person deliberately separated this pair. Terminal — tell the user. |
| `FAILURE` · `INVALID_DATA` (unmerge) | No such `merge_id`, or not visible. Re-query `contact_merge_p`. |
| `FAILURE` · `INVALID_STATE` (unmerge) | The survivor has since been merged, or the pointer no longer matches the event. Show the current `merged_into_p`; ask. |
| `body.failures` with no `data` | The request shape was refused (more than one row, a `merge_source`, a missing id) — nothing was touched. Fix and resend. |
| A tool error that the path is not served | This instance's build has no merge endpoints. The user merges in the app. |

## Non-negotiables

- **Contacts only.** There is no account merge on the platform — no endpoint, no pointer on
  `account_p`. Say so; don't invent one with `_c` fields.
- **Never write `merged_into_p` or `contact_merge_p` with a records update.** The instance
  refuses both.
- **Both contacts must be visible to the user.** A contact they can't see reads as
  `INVALID_INPUT`; that is the boundary, not a bug.
- **Merged contacts still show up in reads.** Queries and search don't hide them; select
  `merged_into_p` whenever the answer depends on it.
- **Never merge by deleting.** A delete destroys the record and its history; a merge keeps both.
