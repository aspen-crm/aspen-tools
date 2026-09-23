---
type: llm
weight: 2
focus:
  source: file
  path: metacode/server/server_main_c/src/lib.rs
---

This is the record-trigger crate after the run. Judge ONLY whether a trigger maintains the
engagement budget figures.

A stored field is only correct if something keeps it current. On this platform there is no
scheduler and no formula field, so the maintenance has to be a record trigger: on `timesheet_c`
(consumed changes when hours are approved) and/or on `order_line_c` (contracted changes when a
line is added or repriced), writing the figure back onto the parent `engagement_c`.

Background for judging the code: reading fields uses `record.get("field_c")` returning a
`FieldState`; writing another object's record uses `context.services().record()` with an
`UpdateRequest`; queries are single-line AQL and require a `LIMIT`.

PASS if the file registers or implements at least one trigger whose job is to recompute and write
a budget figure onto `engagement_c`. Minor API mistakes are fine — judge the intent and shape, not
whether it would compile.

FAIL if the file is still the empty skeleton (just `entrypoints!` and `struct Entrypoints;`), or
if its triggers do something unrelated to maintaining the budget figures.
