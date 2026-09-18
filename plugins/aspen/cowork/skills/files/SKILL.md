---
name: files
description: Use when asked to upload, attach, add or replace a file — a PDF, contract, image, spreadsheet, any document — on an Aspen record, or to set a record's file field. Drives aspen_files_upload (a local file → a file id, optionally attached to a record in the same call); finding the record and the field still goes through explore and records. Never the app's upload form, never file contents in a text field.
---

# Files (upload and attach)

Put a file on a record through the runtime MCP's own upload tool. A record holds a file
through a field of **`type: id`, `subtype: file`** (describe shows it), whose value is a
**file id**. `aspen_files_upload` turns a file on the user's computer into that id, and
with `attach` sets the field in the same call. That is the whole mechanism — there is
nothing to drive in the app, and no other field takes a file.

```
aspen_files_upload  path="/…/Master Agreement.pdf"                 # → file_id
aspen_files_upload  path="…"  attach={object, id, field}           # → file_id, field set, record read back
aspen_records_create/update … fields={file_c: "<file_id>"}         # a file field takes an id you already have
```

## Where the file has to be — the one thing that differs by host

The upload reads the file **from the computer running the MCP server**, at an **absolute
path there**. The server never sees your sandbox.

| Host | Where the server runs | What `path` is |
|---|---|---|
| Claude Code | this machine | any absolute path here — including a file you just wrote |
| Claude Desktop | this machine | a path the user gives you (`~/Downloads/msa.pdf` — `~` is their home) |
| Cowork (desktop app) | Claude Desktop, on the **user's** computer | the file's path **on their computer**. Your working folder is one of *their* folders mounted into your sandbox — a file you see at `/sessions/…/mnt/<Folder>/x.pdf` is `<their path to Folder>/x.pdf` on their machine. **Ask them where `<Folder>` lives** if you don't know; never pass the `/sessions/…` path |
| Cowork on the web | nowhere local | no upload is possible. The user attaches the file in the app; you can still create the record and hand over its `app_url` |

In Cowork, a file that is **not** in the working folder (something in the sandbox's `/tmp`,
or an output you produced elsewhere) is not on the user's computer at all — copy it into the
working folder first, then upload it from there.

A wrong path is not fatal: the tool answers `NOT_FOUND` with "No file at … on this
computer" and the same guidance. Read it and ask; don't guess a second path.

## Attach a file to a record — find, describe, confirm, upload, prove

1. **Find the record** with `records` (`aspen_search` / `aspen_list` / `aspen_get`) and keep
   its `id_p`. If the record doesn't exist yet, see the order note below.
2. **Describe fresh** — `aspen_describe <object>` — and find the file field: **`type: id`,
   `subtype: file`**. Note its `required` flag. There may be more than one (a signed copy
   and a draft, say): pick with the user, never by name-guessing.
3. **Confirm.** Show a table — file (path as you will pass it, name, size, content type) →
   target (`object`, `id_p`, field) — and say plainly that **attaching replaces whatever
   file the field holds now**. Get an explicit **yes**. This is the write's confirmation;
   the server refuses without `confirmed=true`.
4. **Upload with `attach`**, `confirmed: true`. `filename` defaults to the path's file name
   and `content_type` from its extension (`.pdf` → `application/pdf`); pass `content_type`
   yourself when the name has no or an odd extension.
5. **Prove it.** Read the result: `file_id`; `stored.filename` / `stored.content_type` are
   what the instance actually recorded (probed from the download route — if `stored` is
   null, the upload still happened, say so and move on); `attached.record[<field>]` must
   equal `file_id`. **End with `attached.app_url`** as a link. An upload you haven't read
   back is not done.

**Several files:** one call per file. Confirm the whole list once as a table (step 3), run
once per file in order, report a table of outcomes (`file_id` each). Stop and ask on the
first `AUTH_REQUIRED` or `INSTANCE_UNREACHABLE`; a per-file failure is that file's outcome.

**Order when the record is new:** if the file field is `required`, the record cannot be
created without it — upload first **without** `attach`, then `aspen_records_create` with the
field set to the `file_id` (one confirmation covers both; show them together). If the field
is optional, either order works; creating first and uploading with `attach` reads back the
finished record in one result.

**"Attach this to the opportunity / case / lead" with no file field on it:** the platform's
own **`attachment_p`** is the record that carries a file *for* another record. Describe it
fresh; on the instances seen it is `name_p` (required), **`content_p`** (the file field,
required), `related_to_p` — a polyid to the parent, so set it **and** `related_toon_p` to one
of its `allowed_objects` — `version_p` (required, a number sent as the string `"1"`),
`description_p`, `type_p`. **Omit `original_version_p`** even though describe marks it
required: the instance sets it to the new record itself, and sets `is_latest_p`. Because
`content_p` is required, the order is upload first (no `attach`), then
`aspen_records_create attachment_p` with `content_p: "<file_id>"`; the result's `app_url` is
the attachment's page, and the file shows on the parent record.

**Just an upload** (no target yet) is fine: call without `attach`, hand the user the
`file_id`, and say it's the only handle — the file is a `file_p` record that **list and get
cannot read** (the instance refuses `file_p` as an object), so the id lives in your report
and in whichever field it is set on, nowhere else you can look it up.

## The result — route on the error `code`

| what comes back | meaning / do |
|---|---|
| `uploaded: true`, `file_id`, `stored`, `attached` | done — prove per step 5 |
| `NOT_FOUND` · "No file at …" | the path isn't a file **on the computer running the server**. Cowork: give the path on the user's computer (table above); ask them. Never retry with a guess. |
| `USAGE` · relative path / directory / empty file / bad `attach` | fix the argument. `path` must be absolute; `attach` is `{object, id, field}`. |
| `VALIDATION_FAILED` · over the 256 MiB ceiling, or the instance's own limit | too big for this route. The user uploads it in the app and sets the field there; hand them the record's `app_url`. |
| `VALIDATION_FAILED` · on the attach | the field or record was refused (wrong field, not a file field, not visible). The message starts "uploaded … as file_p <id>, but setting … failed" — **the file is already up.** Re-describe, then set the field with `aspen_records_update` to that `file_id`. **Do not upload again.** |
| `CONFIRMATION_REQUIRED` | you called without `confirmed=true`. Show the table, get a yes, retry with it. |
| `NOT_FOUND` on the attach target | the object/record isn't visible to the user, or the name is bare/guessed. `aspen_describe` / `aspen_get` it; same "already uploaded" rule as above. |
| `INSTANCE_UNREACHABLE` after a long wait | the upload has its own 300s ceiling; a very large file over a slow link can hit it. Retry once; then the app. |
| `AUTH_REQUIRED` | the session's token — relay `fix_hint`, which names where this host keeps it. Never handle the token. |

There is **no download tool**. To see a file, the user opens the record in the app
(`app_url`); the field renders it.

## Non-negotiables

- **The tool is the way.** Never drive the app's upload form (browser automation) and never
  paste a file's contents or a base64 blob into a text field. If the tool can't reach the
  file (Cowork web, or a path the user can't name), the user uploads in the app — say so.
- **A file field takes a file id, only.** Never a path, a URL, or a name. The id comes from
  `aspen_files_upload` (or from a field that already holds one).
- **Confirm before uploading.** The path, the name, the target, and that the field's current
  file is replaced. The server refuses an unconfirmed call; that gate is not yours to bypass.
- **An attach failure is not an upload failure.** The file is up; set the field, don't
  re-upload — every retry would leave another orphan file.
- **Never invent a path.** A file you cannot locate on the user's computer is a question to
  the user, not a guess to try.
- **Prove with the read-back**, then end with the record's `app_url`.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "No upload tool exists — I'll drive the web UI in Chrome" | `aspen_files_upload` is the upload. Use it. |
| "I'll pass the `/sessions/…/mnt/…` path" | That's the sandbox. The server runs on the user's computer — give the path there; ask if unknown. |
| "I'll set `file_c` to the PDF's path / URL" | A file field takes a file id. Upload first. |
| "The attach failed — I'll upload again" | The file is already up (the message names its `file_p` id). Set the field with `records`. |
| "I'll `aspen_get file_p <id>` to check it" | `file_p` is refused as an object. The proof is `stored` in the upload result and the field on the record. |
| "I'll read the PDF's text into a text field instead" | That's not attaching the file. Ask the user which they want; do not substitute. |
| "It uploaded, so it's on the record" | Only if you passed `attach` — check `attached.record[<field>]`. Otherwise set the field. |
| "The opportunity has no file field, so I can't attach anything" | `attachment_p` exists for exactly that: upload, then create an attachment related to the opportunity. |
