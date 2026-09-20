---
type: llm
weight: 2
focus:
  source: file
  path: metacode/server/server_main_c/src/lib.rs
---

The file is a Rust `before_insert` trigger for Aspen. Judge ONLY how it writes the defaulted owner.

This is a `before_insert` handler, so the incoming records are still being written — the correct
way to default a field is to set it directly on each mutable batch record in memory (e.g.
`record.set("owner_c", ...)`), which costs no extra API call at all. It should NOT issue a separate
`execute_update` / `execute_insert` per row to write the default back.

PASS if the defaulted owner is applied by setting the field on the in-memory batch records, so the
only API calls the trigger makes are the batched account lookups (no per-row write round trips).

FAIL if the trigger issues a write (update or insert) per record to apply the default, or otherwise
makes its number of write round trips scale with the number of rows in the batch.
