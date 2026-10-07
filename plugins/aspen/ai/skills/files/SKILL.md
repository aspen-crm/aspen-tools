---
name: files
description: Use when asked to upload, attach, add or replace a file — a PDF, contract, image, CSV, any document — on an Aspen record, to set a record's file field, or to read a stored file back. Drives POST /data/files (bytes → a file id) and GET /data/files/{id} through execute_api_request; setting the field still goes through records. Small files only through the hosted MCP; a larger one is uploaded in the app. Never file contents in a text field.
---

# Files (upload, attach, read back)

A record holds a file through a field of **`type: id`, `subtype: file`** (describe shows it),
whose value is a **file id**. Uploading turns bytes into that id; setting the field is an
ordinary update. Nothing else takes a file.

```
POST  /api/v24.3/data/files          headers={"Aspen-Filename": "Master%20Agreement.pdf"}
                                     content_type="application/pdf"  body="<base64 of the file>"
                                     → body: {"status": "SUCCESS", "id": "<file id>"}
PATCH /api/v24.3/data/<object>       {"data": [{"id_p": "<record id>", "<file field>": "<file id>"}]}
GET   /api/v24.3/data/files/<id>     → the file's bytes (base64) or text
```

Both writes are `safe: false`, so each is approved in the host.

## What fits through this route — say it before you start

The upload travels **inside the tool call**: the whole request is capped at **256 KB**, and a
binary file goes as base64, which is a third larger. So:

- **A binary file (PDF, image, spreadsheet) up to about 180 KB** fits. Every byte of it passes
  through your own output, so keep to files that are genuinely small.
- **A text file** (`text/csv`, `text/plain`, XML) goes as a plain string, no base64 — up to
  about 250 KB.
- **Anything larger cannot be uploaded from here.** Say so plainly and hand it to the user:
  they open the record in the app and upload the file to that field. You can still create or
  update the record around it.

**You need the bytes in your own environment.** In a host with a shell or sandbox (Claude Code,
Codex, Cowork), read the file there — `base64 < file | tr -d '\n'` gives the body. A file the
user mentions but you cannot read is a question for the user, not a guess.

## Attach a file to a record — find, describe, confirm, upload, set, prove

1. **Find the record** with `records` and keep its `id_p`. If it doesn't exist yet, see the
   order note below.
2. **Describe fresh** and find the file field (`type: id`, `subtype: file`), and its
   `required` flag. If there are several (a signed copy and a draft), pick with the user.
3. **Check the size** against the limits above, then **show the plan**: file (name, size,
   content type) → target (object, record, field), and that **setting the field replaces the
   file it holds now**.
4. **Upload.** `Aspen-Filename` is the original name, **percent-encoded** (`%20` for a space);
   `content_type` is the file's own MIME type (`application/pdf`, `image/png`, `text/csv`) —
   it is stored and replayed on download. Read `body.id` — the file id.
5. **Set the field** with a `PATCH` (records), value the file id as a string.
6. **Prove it.** `SELECT <file field> FROM <object> WHERE id_p = '<id>' LIMIT 1` must return
   the file id. Name the record; there is no link to give.

**Several files:** one upload per file, then one `PATCH` that sets them all if they go on one
record. Confirm the whole list first.

**Order when the record is new:** a `required` file field means the record can't be created
without it — upload first, then create with the field set to the id. Optional: either order.

**"Attach this to the opportunity" with no file field on it:** the platform's **`attachment_p`**
carries a file *for* another record. Describe it fresh; on the instances seen it has
`name_p` (required), **`content_p`** (the file field, required), `related_to_p` — a polyid to
the parent, so set it **and** `related_toon_p` to one of its `allowed-objects` — and
`version_p` (required; send the string `"1"`). **Omit `original_version_p`** even though
describe marks it required: the instance fills it. Upload first, then create the
`attachment_p` with `content_p` set to the file id.

**An upload with no target** is fine: hand the user the file id and say it is the only handle.
The `file_p` record cannot be queried, so the id lives in your report and in whichever field
holds it.

## Reading a file back

`GET /data/files/<id>` returns the file. A binary body arrives as **base64**; a text body as a
string. Responses are cut at 64 KB: a binary body cut short comes back as `null` with
`truncated: true` — you cannot read that file here, so say so; a text body cut short is a
partial file, never the whole one. The file id comes from the record's file field.

## Errors

| What comes back | Meaning / do |
|---|---|
| The tool refuses the request as too large | Over the 256 KB request cap. The user uploads it in the app. |
| `INVALID_DATA` on the upload | A missing `Aspen-Filename` or content type, or the instance's own size limit. Read `detail`. |
| The upload succeeded but the `PATCH` failed | **The file is already up** — keep its id. Fix the update (re-describe, right field) and set it; **don't upload again**, every retry leaves an orphan file. |
| `AUTHORIZATION_FAILURE` | The user can't write that record or field. |
| `FAILURE` on download | No such file, or not visible to this user. |

## Red flags — STOP

| Thought | Reality |
|---|---|
| "I'll set the file field to the path / URL / name" | It takes a file id. Upload first. |
| "I'll paste the PDF's text into a notes field instead" | That is not attaching the file. Ask which they want. |
| "It's 2 MB, I'll split it" | There is no chunked upload. The user uploads it in the app. |
| "The PATCH failed, upload again" | The file is up. Set the field with the id you have. |
| "I'll drive the app's upload form in a browser" | Not this lane. Small files go through the API; large ones are the user's to upload. |
