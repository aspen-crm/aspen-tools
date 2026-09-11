# Rust trigger notes

Read this only when you're actually authoring a Rust trigger. The rest of `using-aspen`'s loop —
find the shape, compile, deploy, verify — is identical for this and everything else you author, so
it stays in `SKILL.md`; this file is the part specific to the `aspen_crm` crate, whose own docs.rs
coverage is thin (8.84% at last check). Confirmed from a real trigger that compiled clean, deployed
clean, and — after the fixes below — actually fired and produced the expected record. Getting from
"compiles and deploys" to "fires" took a multi-hour live debugging session; every fact below is
what that session actually hit, not what seemed plausible going in.

## The crate directory must be named `server_main_c` (or `server_main_a`)

**This is the first thing to check if a trigger never fires and nothing else explains why.** The
platform's codefile runtime only ever loads a server codefile named `server_main_c` or
`server_main_a` — hardcoded on the platform side, not validated at compile time, not validated at
checkin. A crate at `server/org_sub_watcher_c/`, correctly declared in its own `aspen.server.json`,
with the right object, the right event, and correct trigger logic, **compiles clean and checks in
clean** (`SUCCESS`, 0 failures at every phase) and then never fires — no error, no warning, nowhere.
It looks indistinguishable from a deployed, working trigger with a logic bug, which is what made
this take so long to find: every other layer (metadata, manifest parsing, the compiled wasm, the
Rust code) was already correct.

The crate directory name and the deployed codefile component's name are the same thing — renaming
one means renaming both:

```
mv metacode/server/<old-name>/ metacode/server/server_main_c/
```

and update `Cargo.toml`'s `name` to match (the file's own comment says why: *"The crate name must
match the codefile directory name"*).

The trigger's own identity — the `"name"` field inside `aspen.server.json`'s `record-triggers`
entry, which `entrypoints!` turns into the trait your `impl` block implements — is a **separate**
string from the crate/directory/component name, and does not need to match it. Only one name here
is fixed: the crate directory (and therefore the codefile component) has to be `server_main_c` or
`server_main_a`. If a project needs more than one server codefile, that's a real constraint to
raise with the platform team, not something to work around by naming a second crate something else
— a second crate under any other name is silently never loaded.

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
    .field("owneron_p", RecordFieldValue::PicklistObjectRef("user_p".to_string()))
    .build()?;
let request = InsertRequest::builder("task_p").record(input).build()?;
let result = context.services().record().execute_insert(request)?;
```

The object name (`"task_p"`) is the `InsertRequest` builder's argument, not a field on
`RecordInput`. `execute_insert` is a method on `RecordService` (`context.services().record()`),
not on the request builder — an easy pair to get backwards, and the compiler catches it, but only
after you've written the wrong version first.

`task_p.owner_p` is `PolyidParent` here, not `IdLookup`, because that's what its own field
metadata says (`type: polyid`, `subtype: parent`); `owneron_p` is `owner_p`'s discriminator
companion and has to be set alongside it — see "Field types: which `RecordFieldValue` variant to
write" below for both the variant table and why the discriminator is never optional, even here
where `owner_p` only ever points at `user_p`. Bind `execute_insert`'s return value and check it —
see "Debugging a trigger" below for why a bare `execute_insert(request)?;` hides exactly the errors
you need to see while getting this shape right the first time.

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

Use the id to read anything else about the record with a separate query. **`SELECT` requires a
`LIMIT`** — a query without one is rejected at query time; adding `LIMIT 1` (nothing else changed)
turned a real query from failing to working:

```rust
let id = /* from record.get("id_p") */;
let query = context.services().query()
    .query(format!("SELECT name_c, account_c FROM org_c WHERE id_p = '{id}' LIMIT 1"))
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

A *lookup* column doesn't reliably come back as one single `RecordFieldValue` variant — match more
than one with an or-pattern rather than picking one and hoping:

```rust
match row.get(1) {
    Some(Some(ValidFieldValue::RecordFieldValue(
        RecordFieldValue::Id(id) | RecordFieldValue::IdLookup(id),
    ))) => id,
    other => /* absent, null, or still something else — widen the pattern if you hit this */,
}
```

This is what actually fixed a real trigger's queries: matching only `RecordFieldValue::Id` left
every row unmatched, falling through to the catch-all silently, on every run. It is not necessarily
the same variant you'd use to *write* that field (see "Field types" below) — reading and writing a
lookup/polyid field are different code paths with independently-confirmed shapes.

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
| `picklist` / `object_ref` | `RecordFieldValue::PicklistObjectRef` |

The last row is a polyid's **discriminator** field (`owneron_p` for `owner_p`, `whaton_p` for
`what_p`) — shaped like a plain picklist (one `String`), but its own distinct variant, not
`RecordFieldValue::Picklist`. Writing it as `Picklist` compiles clean (both variants wrap a
`String`) and only fails at `execute_insert`, inside `result.failures()` — invisible unless you
check that explicitly (see "Debugging a trigger" below).

**Confirmed the hard way, not from the docs:** `task_p.owner_p` and `task_p.what_p` are both
`polyid`/`parent` fields — `owner_p` restricted to one object (`user_p`) via `allowed-objects`,
`what_p` open to several. A trigger that wrote both with `RecordFieldValue::IdLookup` — reasoning
"it only points at one kind of object, so it's basically a lookup" — compiled clean, checked in
clean, and inserted nothing: no task record, no error surfaced where the human was looking, just a
trigger that appeared to do nothing. Restricting a polyid to one `allowed-objects` entry doesn't
turn it into an `id`/`lookup` field; it's still `type: polyid`, and still needs `PolyidLookup` or
`PolyidParent` — never `IdLookup`, which is only correct for a field whose own `type` is `id`, e.g.
`account_p.owner_p`.

**Every polyid's discriminator field has to be set, not just an "open" one.** `task_p.owner_p` is
restricted to a single `allowed-objects` entry (`user_p`) — that did *not* exempt it from needing
`owneron_p` set alongside it; the insert failed validation (`result.failures()`) the same way an
open polyid missing its discriminator would. `allowed-objects` restricting a polyid to one entry is
a validation/display convenience on the platform side, not a signal that the discriminator becomes
optional or gets inferred:

```rust
.field("owner_p", RecordFieldValue::PolyidParent(owner_id))
.field("owneron_p", RecordFieldValue::PicklistObjectRef("user_p".to_string()))
.field("what_p", RecordFieldValue::PolyidParent(org_id))
.field("whaton_p", RecordFieldValue::PicklistObjectRef("org_c".to_string()))
```

This is all about *writing* a field on a `RecordInput`. Reading one back — from a batch record or
a query row — is a different code path with its own variant; don't assume it round-trips the same
way (see "Reading fields in a trigger" above).

## Debugging a trigger that "isn't firing"

A trigger that appears to do nothing after a checkin is not necessarily running at all, and if it
is, it's almost always still running — either a `match` arm didn't hit the case you expected (and a
catch-all silently swallowed which case it actually was), or a write it issued was rejected
somewhere you weren't looking. Work through these, **in this order**, before re-reading the
`aspen_crm` API from memory — they're ordered by how much they cost to check, and the cheapest one
turned out to be the actual answer once, after everything downstream of it looked fine:

1. **Is the crate directory named `server_main_c` or `server_main_a`?** See "The crate directory
   must be named `server_main_c`" above — this one is invisible at every layer this file otherwise
   tells you to check: compiles clean, checks in clean, `ac validate` clean, correct object, correct
   event, correct code. If the answer is no, nothing else below matters until it's renamed.
2. **Confirm it deployed, not just compiled.** `checkin-prep` succeeding doesn't mean
   `checkin-deploy` ran. A checkin stuck partway through looks identical, from the outside, to a
   trigger that's live and has a logic bug.
3. **Confirm the registration matches exactly.** `object` and `events` in `aspen.server.json` are
   plain strings the platform doesn't validate against object/picklist metadata at compile time —
   a typo'd object name or event compiles clean and simply never runs.
4. **Picklist item names are exact strings, not a compiler-checked enum.** `"cancelled_c"` in Rust
   has to match the picklist item's `name` in its metadata JSON byte-for-byte; nothing catches a
   mismatch except comparing the two files.
5. **A `SELECT` without `LIMIT` fails at query time.** If a trigger reaches a query and stops, this
   is the first thing to check — see "Reading fields in a trigger" above.
6. **If the trigger inserts or updates a record, capture the `Result` and check `.failures()` —
   `?` alone silently drops row-level rejections.** `execute_insert`/`execute_update` return
   `Result<BatchProcessed, BatchFailure>`: the `Err` side is a whole-batch failure (a malformed
   request) and is all a bare `execute_insert(request)?;` — return value unused — can ever surface.
   A single row that fails validation (wrong `RecordFieldValue` variant for the field's own
   `type`/`subtype`, see the table above; a missing required field; anything else the platform
   rejects) comes back inside `Ok(BatchProcessed)`, in `.failures()` — `?` never sees it, and
   discarding the return value throws it away. Bind the result, check `.failures()`, and turn any
   into a hard error rather than a log call — see the next point for why that distinction matters:
   ```rust
   let result = context.services().record().execute_insert(request)?;
   if !result.failures().is_empty() {
       let msgs: Vec<String> = result
           .failures()
           .iter()
           .flat_map(|f| {
               f.field_errors()
                   .iter()
                   .map(|e| format!("{}: {}", e.field_name(), e.message()))
                   .chain(f.record_errors().iter().map(|e| e.message().to_string()))
           })
           .collect();
       error::bail!("insert failed: {}", msgs.join("; "));
   }
   ```
   This is exactly what surfaced the two field-shape errors above (`whaton_p`'s variant, `owner_p`'s
   missing discriminator) as readable messages instead of a trigger that just never inserted
   anything.
7. **There is no confirmed way to read `aspen_crm::warn!`/`info!` output.** This instance has no
   logs UI reachable from the CLI or the devtools API (both were tried and found nothing). What
   *is* confirmed visible: a **hard error** — an `Err` returned from the entrypoint, e.g. via
   `error::bail!` — surfaces at the point of the save that fired the trigger, in the UI, as an
   error on that save. A `warn!`/`info!` call inside a `_ => continue` catch-all is invisible; the
   same catch-all turned into `error::bail!("unexpected subscription_status_c: {other:?}")`
   temporarily is not:
   ```rust
   let status = match record.get("subscription_status_c")? {
       FieldState::Value(RecordFieldValue::Picklist(s)) => s,
       other => error::bail!("unexpected subscription_status_c: {other:?}"),
   };
   ```
   Redeploy, fire the event once, read the error the save shows, then put the real `continue`-based
   handling back — a trigger that hard-errors on every unexpected shape is a debugging aid, not
   something to ship, since it would block the save entirely instead of skipping the field. Do this
   for query-row matches too, not just batch-field matches — same risk, same fix, and it's what
   distinguished "the trigger errored" (a query needing `LIMIT`) from "the trigger silently
   continued" (a match on the wrong variant) in a real session, without which both looked identical
   from the outside: no task, no visible difference.
