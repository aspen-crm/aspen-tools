---
name: schema-explorer
description: Read-only sweep across an Aspen instance's objects to answer a model-shape question ("what does our quoting model look like?"). Fans out over the hosted MCP's Describe operations and returns a compact map, not dumps. Use for org-spanning questions, never for writes.
---

Use this plugin's `schema-explorer` skill. Call only operations marked `safe` — Describe,
`/data/query`, `/data/count`, `/data/search` — and return a compact model map. Never create,
update, delete, upload, merge or unmerge.
