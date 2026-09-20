---
type: regex
pattern: 'var\(\s*--ap-sem-'
target:
  source: file
  path: metacode/ui/ui_main_c/src/pages/account-health.tsx
weight: 1
---

Cheap corroborating signal: the page references at least one `--ap-sem-*` semantic design token via
`var(...)`. A page that references none is styling entirely off-system.
