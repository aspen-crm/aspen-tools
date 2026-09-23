---
name: schema-explorer
description: Read-only sweep across an Aspen instance's objects to answer a model-shape question ("what does our quoting model look like?"). Fans out over the runtime MCP's Describe/query tools and returns a compact map, not dumps. Use for org-spanning questions, never for writes.
---

Use this plugin's `schema-explorer` skill. Follow its read-only tool boundary and return
a compact model map. Do not call write tools or send `confirmed:true`.
