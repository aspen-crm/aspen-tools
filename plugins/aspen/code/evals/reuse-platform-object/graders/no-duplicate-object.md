---
type: regex
pattern: '(creat|add|author|build)[^.\n]{0,60}`?deal_c`?[^.\n]{0,40}object|object_p/deal_c'
flags: i
match: not_contains
target: last_message
weight: 1
---

Negative signal: the plan does not propose authoring a `deal_c` object. Mentioning the name to
explain why it is NOT being created reads differently and should not match this pattern, which
requires a create/add/author/build verb close to it, or an `object_p/deal_c.json` path.
