---
type: regex
pattern: 'bail!|return\s+Err\('
target:
  source: file
  path: metacode/server/server_main_c/src/lib.rs
weight: 1
---

Cheap corroborating signal: the trigger returns a hard error somewhere, which is the only
confirmed way to surface a rejection to the user on this platform. A run that answered in the
page leaves this file as the fixture wrote it, and this fails.
