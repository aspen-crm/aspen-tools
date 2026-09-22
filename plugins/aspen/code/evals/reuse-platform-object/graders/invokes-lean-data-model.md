---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?lean-data-model"'
arm: with-only
---

Indicator only: did the run invoke the `lean-data-model` skill? Scored in the with-plugin arm as
a sign the plugin fired; not counted against the no-plugin baseline.
