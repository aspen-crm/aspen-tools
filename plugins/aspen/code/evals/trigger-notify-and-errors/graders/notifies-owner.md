---
type: llm
weight: 2
focus:
  source: file
  path: metacode/server/server_main_c/src/lib.rs
---

The file is a Rust record trigger for Aspen. Judge ONLY the task record it creates as the owner's
notification.

Background the grader needs: `task_p.owner_p` and `task_p.what_p` are `polyid` fields. A polyid
field is only valid when its discriminator companion is set alongside it in the same record —
`owneron_p` alongside `owner_p`, `whaton_p` alongside `what_p` — even when the polyid only ever
points at one object type. Writing the polyid without its companion is rejected at insert time, so
the notification would never be created.

PASS if the trigger builds a `task_p` record assigned to the opportunity's owner and linked to the
opportunity, AND sets each polyid together with its discriminator companion — `owner_p` with
`owneron_p`, and `what_p` with `whaton_p`.

FAIL if it omits the task, doesn't assign it to the owner, or sets a polyid (`owner_p` or `what_p`)
without its companion discriminator field.
