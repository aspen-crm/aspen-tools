---
type: llm
weight: 2
focus:
  source: file
  path: metacode/server/server_main_c/src/lib.rs
---

The file is a Rust `before_insert` trigger for Aspen. Judge ONLY how it reads the account owners.

The trigger must default each new `campaign_target_c`'s `owner_c` from its `account_c`'s owner. The
efficient shape, on a batch of thousands: first walk the whole batch and collect the distinct
account ids that need a lookup, then read them with a small number of queries — one query per up to
100 ids (an `IN (...)` list, chunked in groups of 100) — into a map from account id to owner, then
apply from that map. A query returns at most 100 rows, so chunking by 100 is the ceiling.

PASS if the trigger collects the needed account ids across the whole batch and reads them in
batched queries (chunked, roughly one query per 100 ids), rather than querying per row.

FAIL if it issues a query inside the per-record loop (one lookup per `campaign_target_c`), or
otherwise scales its number of queries with the number of rows rather than with the number of
distinct accounts / 100.
