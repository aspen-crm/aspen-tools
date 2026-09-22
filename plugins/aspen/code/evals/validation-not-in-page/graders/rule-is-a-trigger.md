---
type: llm
weight: 3
focus:
  source: file
  path: metacode/server/server_main_c/src/lib.rs
---

This is the record-trigger crate after the run. Judge ONLY whether the discount cap is enforced
here, at save time.

The rule: a `quote_line_c` with `discount_pct_c` above 30 must be rejected unless its parent
`quote_c` has `approval_status_c` of `approved_c`, and the user must be told why.

On Aspen the only place that holds for every write is a `before_insert` / `before_update` record
trigger on `quote_line_c` that returns a hard error — `error::bail!(...)` or `return Err(...)`.
A hard error is also the only confirmed way to surface a message to the user on this platform;
`warn!` and `info!` output cannot be read back anywhere.

Background for judging the code: the parent quote's approval status is not in the batch, so it
takes a query (single-line XQL, `LIMIT` required) or a lookup off the batch's quote ids.

PASS if the file registers or implements a before-insert and/or before-update trigger on
`quote_line_c` that checks the discount against the parent's approval status and rejects with a
hard error. Minor API mistakes are fine — judge the intent and shape, not whether it compiles.
Checking only `before_insert` and not `before_update` is a weakness, not a failure.

FAIL if the file is still the empty skeleton (just `entrypoints!` and `struct Entrypoints;`), if
the rule is enforced only by logging or by silently clamping the value, or if the trigger is
registered on the wrong object or the wrong events.
