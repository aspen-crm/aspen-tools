---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?using-aspen"'
arm: with-only
---

Indicator only: did the run invoke the `using-aspen` skill? Scored in the with-plugin arm as a sign
the plugin fired; not counted against the no-plugin baseline, which has no skill to invoke.
