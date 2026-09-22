---
type: llm
weight: 3
focus:
  source: file
  path: metacode/metadata/object_p/engagement_c.json
---

This is the `engagement_c` object's authored metadata after the run. Judge ONLY whether the
budget figures the request asked for now exist as stored fields on this object.

The request asked for contracted value, consumed to date, and remaining — and, critically, for a
way to FIND the engagements that are close to running out. On Aspen, only a stored field can be
put in a list view column, filtered, sorted, used in a `query-filter`, read by another trigger, or
seen through the runtime MCP. A number computed in page code satisfies the first half of the
request and cannot satisfy the second half at all.

The object started with exactly six fields: `name_c`, `account_c`, `status_c`, `owner_c`,
`start_date_c`, `end_date_c`.

PASS if the object has gained at least one currency or number field holding a budget figure —
remaining, consumed, or contracted (any naming). Gaining two or three of them is better and also
passes.

FAIL if the object is unchanged from those six fields, or if the only additions are unrelated to
the budget figures.
