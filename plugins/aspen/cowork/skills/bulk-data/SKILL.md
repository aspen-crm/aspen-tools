---
name: bulk-data
description: Use for a data job on an Aspen instance that the records tools cannot carry — more than ~100 rows, creating many records, deleting any record, or a data load/import/backfill driven from a CSV, spreadsheet or JSON file. Covers mass updates, clearing or re-pointing a field across many records, and removing test or seed data. Drives the platform's batch data API through the bundled helper (aspen_records_bulk_update tops out at 100 updates, and no MCP tool deletes). Also the reference for the batch endpoints, AQL paging, and the type quirks that silently break a load.
---

# Bulk data

For the jobs the `records` skill cannot carry. Reach for `records` first — it is the safer
lane, and when available, `aspen_records_bulk_update` already does **up to 100 rows of
updates** in one confirmed call. Come here when the job is outside that:

- **more than ~100 rows**, or a file-driven load of unknown size;
- **creating** many records (the bulk tool updates only);
- **deleting** anything (there is no delete anywhere in the runtime MCP);
- a multi-step job — read, transform, write, verify — driven from a script.

This skill reaches the platform's batch data API through the bundled helper.

Resolve `<absolute skill directory>` to the directory containing this loaded `SKILL.md`.
Use that absolute path in the commands below; do not depend on a plugin-root shell variable.

```
node "<absolute skill directory>/scripts/aspen-data.mjs" check
node "<absolute skill directory>/scripts/aspen-data.mjs" query  --aql "SELECT id_p, work_email_p FROM contact_p" --out rows.json
node "<absolute skill directory>/scripts/aspen-data.mjs" count  --aql "ROWCOUNT FROM contact_p"
node "<absolute skill directory>/scripts/aspen-data.mjs" create --object account_p --file new.json
node "<absolute skill directory>/scripts/aspen-data.mjs" update --object contact_p --file changes.json --execute
node "<absolute skill directory>/scripts/aspen-data.mjs" delete --object task_p    --file ids.json
```

It needs a shell with `node`, such as local Codex or Claude Code. In a host without one (Claude Desktop), say so
and fall back to `records` for a small job, or hand the user the plan to run themselves.

**Writes are dry runs unless `--execute`.** Without it the batches are built and summarised
and nothing is sent. Always show the user the dry-run output and get an explicit **yes**
before re-running with `--execute` — the helper has no gate of its own.

## The loop

1. **Describe first.** Field names, types, required flags, picklist values and length
   limits come from `aspen_describe` / `aspen_get_picklist` (the `explore` skill), never
   from a guess and never from a value you saw in a record. A 4-character value in a
   128-character field is not a 4-character field. The same describe's `ui.layout_p` carries
   **`placed_fields`** — check the columns you are about to load against it. A field no
   layout places stores fine and is **invisible on the record page**, which across a
   10,000-row load is 10,000 records the user can't see the new data on. Name it in the
   dry-run confirmation (step 4), once for the job; the rule is in `records`
   ("will they see it?").
2. **Count, then read.** `count` tells you the size of the job before you fetch anything.
   `query` pages for you; do not put `LIMIT`/`OFFSET` in your AQL (the helper refuses it).
3. **Build the file.** A JSON array of records. `update` and `delete` need `id_p` on every
   row; `delete` also accepts a bare array of id strings. Write the file yourself — the
   customer-specific mapping is the part no helper can own.
4. **Dry run, show, confirm.** Report counts and a sample, not the whole array — plus any
   field in the load that no layout places, so the user decides before 10,000 rows land
   somewhere they'll never look.
5. **`--execute`, then read back.** A returned `overview` is not proof. Re-`query` the
   records and check the values landed. Partial success is normal and exits 1.

## Ordering, when one job has several steps

Do the step that triggers platform recalculation **first**, then re-read, then fix what is
left. Triggers maintain derived rows: setting `contact_p.owner_p` maintains
`contact_owner_p`/`contact_rel_p`, and an address write repoints `account_p.location_p`. A
batch built from a snapshot taken before the first step will fight the triggers.

Children before parents when deleting, and break reference cycles first (clear the lookup on
one side, then delete). `deletion-strategy` on the field tells you which: `block` means the
parent will refuse to go, `cascade` means the child goes with it, `set_to_null` means the
reference is cleared for you.

## The quirks that silently break a load

| Symptom | Cause |
|---|---|
| `invalid type: boolean, expected a string` | **Checkbox values are the strings `"true"`/`"false"` in a JSON body.** In an AQL `WHERE` clause they are the opposite — unquoted, or you get *"must be written without quotes"*. The helper coerces booleans on the way out; the WHERE side is yours. |
| A record "does not exist" that plainly does | A bad field name can come back as an **error payload under HTTP 200**, so a naive read of `data` sees zero rows. The helper fails loudly instead. Check the field is really on the object — `user_p`, for instance, has **no `name_p`**; it carries `first_name_p`/`last_name_p`. |
| Only 100 rows came back | `/data/query` caps at **100 rows per request whatever `LIMIT` says**. Page with `OFFSET`; `query` does it for you. |
| Arithmetic gives nonsense | Numbers and checkboxes come back as **strings** (`"50000.00"`, `"true"`). Parse before you compute. |
| A create is rejected for a missing field | The object **uses object types** and needs `otype_p`. Read it off an existing record rather than hardcoding a name that differs per instance — `SELECT otype_p FROM <object> LIMIT 1`. |
| A `LIKE` filter is refused | Only a **trailing** wildcard is allowed. |
| A polyid or currency write does not stick | Both are clusters. A polyid needs the id **and** its object-type field set together; a currency needs the entered amount and the currency code — never the converted amount, which the instance derives. |

## Non-negotiables

- **Never handle the user's token.** The helper resolves identity itself, in the runtime
  MCP's order: `--instance`/`--token` flags, then `ASPEN_INSTANCE`/`ASPEN_API_TOKEN`, then
  `<config>/mcp/env`, then the CLI's stored login. `check` reports which source won and
  never the value. Use the flags to reach an instance the user is not logged into; prefer
  the environment variable over a `--token` on the command line, which is visible to `ps`
  and lands in shell history. Never read a credential file to pass its contents onward, and
  never print a token.
- **Delete is a hard delete with no undo.** There is no recycle bin. Prefer neutralising a
  record with an update. When a delete is genuinely wanted, say plainly that it cannot be
  reversed, get an explicit yes, and dry-run first. On a shared instance, say that too.
- **Scope every filter to what you mean.** A bulk update is only as good as its `WHERE`.
  Filter on the owning user or the exact key, and report anything the filter caught that you
  did not intend before writing.
- **Batches cap at 500 rows** per request; the helper chunks for you.
- **Read `overview.failures`, not just the count.** Per-row failures sit in `data`; the
  helper surfaces the first 20 and exits 1.
- **Prefer `records` when it fits.** A few records interactively, or up to 100 updates via
  `aspen_records_bulk_update`, with the server's own confirmation, is the safer lane. Reach
  here for creates at scale, any delete, more rows than that, or a scripted multi-step job.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "I'll pass `false` for the checkbox" | It must be the string `"false"` in the body — and unquoted in a WHERE clause. |
| "The query returned nothing, so there are none" | A bad field name answers 200 with an error payload. Check the field exists. |
| "`LIMIT 5000` will fetch them all" | 100 rows per request. Page. |
| "The batch returned, so it worked" | Read `overview.failures`, then re-query and prove it. |
| "I'll put the token in the command" | Export it instead; `--token` is visible to `ps` and in shell history. |
| "I'll delete the test records" | Hard delete, no undo, shared instance. Update to neutralise, or confirm explicitly. |
| "I'll write my own curl loop" | That is how the checkbox and paging bugs get re-derived. Use the helper. |
| "This is 60 updates, so I need the helper" | `aspen_records_bulk_update` covers ≤100 updates in one confirmed call. Use `records`. |
