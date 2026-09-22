---
type: llm
weight: 1
focus: last_message
---

The message explains what was built for the engagement-budget request. Judge ONLY whether it
tells the reader where each piece lives and why.

PASS if the message says which parts are metadata (fields on the object), which are a trigger,
and which — if any — are UI, in a way a reader could act on. An explicit tier or placement table
is ideal but not required; naming the components and their roles is enough.

FAIL if the message only describes the outcome ("you can now see remaining budget") without
saying what was authored where.
