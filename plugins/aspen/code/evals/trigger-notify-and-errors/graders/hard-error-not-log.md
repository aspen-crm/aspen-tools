---
type: regex
pattern: 'bail!|return\s+Err\('
target:
  source: file
  path: metacode/server/server_main_c/src/lib.rs
weight: 1
---

Cheap corroborating signal: the trigger returns a hard error somewhere (`error::bail!(...)` or a
`return Err(...)`), which is the only confirmed way to surface a failure to the user on this
platform. A trigger that never returns an error can only be logging or swallowing.
