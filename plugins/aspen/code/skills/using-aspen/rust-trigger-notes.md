# Rust trigger notes

Read this only when you're actually authoring a Rust trigger. The rest of `using-aspen`'s loop —
find the shape, compile, deploy, verify — is identical for this and everything else you author, so
it stays in `SKILL.md`; this file is the part specific to the `aspen_crm` crate, whose own docs.rs
coverage is thin (8.84% at last check). Confirmed from a real trigger that compiled clean and
deployed 12/12, not from the docs.

## Before the first compile

`aspen compile --rust` builds with `--locked`, so a crate with no `Cargo.lock` fails. Generate one
once, then commit it:

```
cd metacode/server/<crate>/ && cargo generate-lockfile
```

## Inserting a record

```rust
let input = RecordInput::builder()
    .field("subject_p", RecordFieldValue::Text("...".to_string()))
    .field("owner_p", RecordFieldValue::PolyidParent(owner_id))
    .build()?;
let request = InsertRequest::builder("task_p").record(input).build()?;
context.services().record().execute_insert(request)?;
```

The object name (`"task_p"`) is the `InsertRequest` builder's argument, not a field on
`RecordInput`. `execute_insert` is a method on `RecordService` (`context.services().record()`),
not on the request builder — an easy pair to get backwards, and the compiler catches it, but only
after you've written the wrong version first.

`task_p.owner_p` is `PolyidParent` here, not `IdLookup`, because that's what its own field
metadata says (`type: polyid`, `subtype: parent`) — see "Field types: which `RecordFieldValue`
variant to write" below before copying this for a different field.

## Reading fields in a trigger

`AfterUpdateContext`'s batch holds only the fields that *changed* in this update — checking
`record.get("field_c")` for a value already means the transition happened; there's no need to
compare old vs. new yourself. But that also means untouched fields aren't in the batch at all —
read anything else about the record (its name, an unrelated field) with a separate query.

**`id_p` is the one exception.** It never "changes", but `record.get("id_p")` still returns
`FieldState::Value(RecordFieldValue::Id(id))` on every record in the batch. Confirmed from the
platform's `record-trigger` WIT interface: `before-delete-record`/`after-delete-record` get a
dedicated `id()` accessor, but the insert/update record types
(`immutable-object-record`/`mutable-object-record`) do not — `get("id_p")` is the *only* way those
triggers can identify which record they're looking at, so the platform has to populate it
regardless of the changed-only rule. If a match on it ever falls through to your catch-all arm,
look elsewhere first (field name typo, wrong variant) — it almost never means the id is missing.

Use the id to read anything else about the record with a separate query:

```rust
let id = /* from record.get("id_p") */;
let query = context.services().query()
    .query(format!("SELECT name_c, account_c FROM org_c WHERE id_p = '{id}'"))
    .build()?;
let rows = context.services().query().execute(query)?;
```

A query row's cells are `Option<ValidFieldValue>` — a different type from a batch record's
`FieldState`, with its own match shape:

```rust
match row.get(0) {
    Some(Some(ValidFieldValue::RecordFieldValue(RecordFieldValue::Text(name)))) => name.clone(),
    _ => /* absent, null, or a type you didn't expect for this column */,
}
```

Don't assume which `RecordFieldValue` variant a *lookup* column reads back as (`Id`? `IdLookup`?
something else?) — that has not been confirmed against a real query result the way the rest of
this file has. Find out with the technique in "Debugging a trigger" below rather than guessing;
whichever variant it turns out to be, it is not necessarily the same one you'd use to *write* that
field (see "Polyid fields").

## Field types: which `RecordFieldValue` variant to write

The variant is `<Type><Subtype>`, matching the field's *own* metadata `type`/`subtype` exactly —
not something to infer from the field's name or from how many `allowed-objects` a polyid has.
Check the field's `type`/`subtype` (its metadata JSON, or the compiled one) before writing it:

| `type` / `subtype` | variant |
|---|---|
| `id` / `lookup` | `RecordFieldValue::IdLookup` |
| `id` / `parent` | `RecordFieldValue::IdParent` |
| `polyid` / `lookup` | `RecordFieldValue::PolyidLookup` |
| `polyid` / `parent` | `RecordFieldValue::PolyidParent` |

**Confirmed the hard way, not from the docs:** `task_p.owner_p` and `task_p.what_p` are both
`polyid`/`parent` fields — `owner_p` restricted to one object (`user_p`) via `allowed-objects`,
`what_p` open to several. A trigger that wrote both with `RecordFieldValue::IdLookup` — reasoning
"it only points at one kind of object, so it's basically a lookup" — compiled clean, checked in
clean, and inserted nothing: no task record, no error surfaced where the human was looking, just a
trigger that appeared to do nothing. Restricting a polyid to one `allowed-objects` entry doesn't
turn it into an `id`/`lookup` field; it's still `type: polyid`, and still needs `PolyidLookup` or
`PolyidParent` — never `IdLookup`, which is only correct for a field whose own `type` is `id`, e.g.
`account_p.owner_p`.

An **open** polyid — several `allowed-objects`, or none — additionally needs its discriminator
field set, or the record it points at is ambiguous:

```rust
.field("what_p", RecordFieldValue::PolyidParent(org_id))
.field("whaton_p", RecordFieldValue::Picklist("org_c".to_string()))
```

This is all about *writing* a field on a `RecordInput`. Reading one back — from a batch record or
a query row — is a different code path with its own variant; don't assume it round-trips the same
way (see "Reading fields in a trigger" above).

## Debugging a trigger that "isn't firing"

A trigger that appears to do nothing after a checkin is almost always still running — either a
`match` arm didn't hit the case you expected (and a catch-all silently swallowed which case it
actually was), or a write it issued was rejected somewhere you weren't looking. Work through these
before re-reading the `aspen_crm` API from memory:

1. **Confirm it deployed, not just compiled.** `checkin-prep` succeeding doesn't mean
   `checkin-deploy` ran. A checkin stuck partway through looks identical, from the outside, to a
   trigger that's live and has a logic bug.
2. **Confirm the registration matches exactly.** `object` and `events` in `aspen.server.json` are
   plain strings the platform doesn't validate against object/picklist metadata at compile time —
   a typo'd object name or event compiles clean and simply never runs.
3. **Picklist item names are exact strings, not a compiler-checked enum.** `"cancelled_c"` in Rust
   has to match the picklist item's `name` in its metadata JSON byte-for-byte; nothing catches a
   mismatch except comparing the two files.
4. **If the trigger inserts or updates a record, check the `Result` explicitly, not just via `?`.**
   Writing a field with the wrong `RecordFieldValue` variant for its own `type`/`subtype` (see the
   table above) is accepted by the compiler — every variant is a valid `RecordFieldValue` — and
   still fails at `execute_insert`/`execute_update`, but from wherever the human triggered the
   event (e.g. changing a picklist value in the UI), that failure surfaces nowhere they'd think to
   look. Log the `Err` case yourself instead of relying on `?` alone:
   ```rust
   match context.services().record().execute_insert(request) {
       Ok(_) => {}
       Err(e) => aspen_crm::warn!(context, "org_sub_watcher_c: insert failed: {e:?}"),
   }
   ```
   This is exactly the class of bug that bit a real `org_c` trigger: `task_p.owner_p`/`what_p` are
   `polyid`/`parent` fields written with `RecordFieldValue::IdLookup` — compiled clean, checked in
   clean, silently created no task.
5. **Turn the catch-all arm into a diagnostic, temporarily.** `_ => continue` can't tell you
   whether the field was absent, null, or present with a variant your `match` didn't list —
   `{other:?}` can:
   ```rust
   let status = match record.get("subscription_status_c")? {
       FieldState::Value(RecordFieldValue::Picklist(s)) => s,
       other => {
           aspen_crm::warn!(context, "unexpected subscription_status_c: {other:?}");
           continue;
       }
   };
   ```
   Redeploy, fire the event once, read the log, then remove the line. This is faster and more
   reliable than guessing — `aspen_crm`'s docs.rs coverage is thin, and shapes this file doesn't
   already cover (like what a query row's lookup column actually deserializes to) aren't confirmed
   anywhere. Do this for query-row matches too, not just batch-field matches — same risk, same fix.
