---
type: regex
pattern: '"(remaining|consumed|contracted|burn|budget)[a-z_]*_c"'
flags: i
target:
  source: file
  path: metacode/metadata/object_p/engagement_c.json
weight: 1
---

Cheap corroborating signal: the engagement object gained a field whose name reads as a budget
figure. A run that answered entirely in page code leaves this file exactly as the fixture wrote
it, and this fails.
