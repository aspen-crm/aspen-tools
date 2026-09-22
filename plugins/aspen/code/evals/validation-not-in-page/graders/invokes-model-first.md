---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?model-first"'
arm: with-only
---

Indicator only: did the run invoke the `model-first` skill? Scored in the with-plugin arm as a
sign the plugin fired; not counted against the no-plugin baseline.
