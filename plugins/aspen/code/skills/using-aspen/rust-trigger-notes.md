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
    .field("owner_p", RecordFieldValue::IdLookup(owner_id))
    .build()?;
let request = InsertRequest::builder("task_p").record(input).build()?;
context.services().record().execute_insert(request)?;
```

The object name (`"task_p"`) is the `InsertRequest` builder's argument, not a field on
`RecordInput`. `execute_insert` is a method on `RecordService` (`context.services().record()`),
not on the request builder — an easy pair to get backwards, and the compiler catches it, but only
after you've written the wrong version first.

## Reading fields in a trigger

`AfterUpdateContext`'s batch holds only the fields that *changed* in this update — checking
`record.get("field_c")` for a value already means the transition happened; there's no need to
compare old vs. new yourself. But that also means untouched fields aren't in the batch at all —
read anything else about the record (its name, an unrelated field) with a separate query:

```rust
let query = context.services().query()
    .query(format!("SELECT name_c, account_c FROM org_c WHERE id_p = '{id}'"))
    .build()?;
let rows = context.services().query().execute(query)?;
```

## Polyid fields

A polyid restricted to one object on the platform side (`owner_p` → always `user_p`) only needs
the ID: `RecordFieldValue::IdLookup(id)`.

An **open** polyid — no `allowed-objects` on the field, e.g. `task_p.what_p` — needs its
discriminator set explicitly too, or the record it points at is ambiguous:

```rust
.field("what_p", RecordFieldValue::IdLookup(org_id))
.field("whaton_p", RecordFieldValue::Picklist("org_c".to_string()))
```
