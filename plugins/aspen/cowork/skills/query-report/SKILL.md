---
name: query-report
description: Use for a natural-language question about one object's records ("top 5 open opportunities by amount") or a group-by count/sum ("pipeline by stage"). Read-only; results are capped server-side, so these summarize rather than export.
---

# Query & report

Two read-only accelerators over the Data surface. Both cap results server-side — they
summarize, they do not export.

## `aspen_query` — a natural-language question

**Not every gateway has it.** `aspen_query` needs a model key configured server-side; a gateway
without one answers every call with `this gateway has no ANTHROPIC_API_KEY configured`. That is
a **deployment fact, not a transient error** — it will not clear on a retry, and it says nothing
about your question. The first time you see it, stop using this tool for the rest of the session
and answer from `aspen_list` / `aspen_report` (below) instead, which are always available.
`aspen_report` covers every "X by Y" question on its own.

Where it is configured, `aspen_query {object, question}` answers a question about **one object**
in a single call: a fast model composes the query server-side (a filtered list or a grouped
report) and the gateway runs it under the list/report caps. It is worth preferring over chaining
`explore` + `aspen_list` yourself.

- `question` is **natural language**, not SQL or XQL — pass the user's question as prose.
- Name the `object` (`opportunity_c`). If you don't know which object, `aspen_search` first.
- Read-only by construction — it never writes.
- **End with the `app_url`.** It sits at the **top level** of the query result (and again
  inside `result`), and it opens the app's list view with the plan's own filters and sort
  already applied — the user's question, as a view they can keep working in. The `plan` the
  server composed is beside it: say which filters you actually ran, then hand over the link.
- **Check `app_url_exact` first** (inside `result`). `false` means the app's list view
  couldn't carry every filter the plan ran, so the link opens a broader set than the answer;
  `app_url_dropped_filters` names which. Say so instead of implying the link is the answer.

## `aspen_report` — group-by count/sum

`aspen_report <object> <group_by>` with `measure` = `count` (default) or `sum`
(+ `measure_field`, a numeric field). Returns up to **50 groups**, each with a display
`label` and its own deep link. Optional AND-only `filters`, same shape as `aspen_list`.

Use it for "X by Y": pipeline by stage, renewals by status, count of contacts by account.

**Two levels of link, and both matter.** The report's top-level `app_url` opens everything
the report covers; each group's `app_url` opens **that group's slice** — the report's filters
plus `group_by = <that value>`. A count is a dead end without them: "42 renewals in
Negotiation" is only useful if the user can click through to the 42. Give the top-level link
with the totals, and attach each group's link to its row when you list the groups.

## Caps — say so, don't paper over them

Rows: default 10, hard cap 200. Groups: ≤50 (`groups_truncated` when more exist).

A report's **totals are not a sample** — the gateway pages the full matching set and
aggregates it, up to a 10,000-row scan ceiling. Read **`exact`** and say which you have:

- `exact: true` — the totals cover every matching row. Report them as the answer, flatly.
- `exact: false` — the scan ceiling was hit, so totals may be **understated**. Say so, and
  offer the narrowing filter the `note` asks for. Never round an approximate total into a
  confident one.

When the **row** cap bounds what you can show, tell the user it's a bounded page and hand
over the `app_url` so they can see the rest — rather than implying you listed everything.
Numeric results come back as JSON **strings** — parse before formatting.
