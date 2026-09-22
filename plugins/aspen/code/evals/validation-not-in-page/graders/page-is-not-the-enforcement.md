---
type: llm
weight: 2
focus: last_message
---

The message explains how the discount cap was implemented. Judge ONLY whether it treats the
quote line editor page as the wrong place to enforce the rule.

The prompt deliberately framed the request around the page the reps use
(`src/pages/quote_lines.ts`, which already has a `validateLine` helper). The reason that is the
wrong home is concrete: a quote line can also be written by the platform's data API, by the
runtime MCP, by a bulk load, and by another trigger — none of which load the page. A rule that
lives only in TypeScript is therefore not enforced.

PASS if the message says the enforcement belongs server-side in a trigger, and gives a reason of
that kind — other write paths, the API, bulk loads, the MCP, "the page can be bypassed", or
similar. Adding a page-side check TOO, described as a convenience or fast feedback on top of the
trigger, still passes.

FAIL if the message presents a page-side check as the enforcement, or if it added the trigger but
never says why the page alone would not do — a reader who only had this message would not know
the page is bypassable.
