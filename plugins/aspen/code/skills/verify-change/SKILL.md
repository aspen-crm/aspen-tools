---
name: verify-change
description: Use after a checkin or deploy succeeds, to prove the change actually works — read the model back, then round-trip a record. A green checkin is not proof. Any write to the instance is permanent and needs explicit human approval first.
---

# Verify a change

**"Checked in" is not "done."** A green checkin proves the metadata compiled and the
instance accepted it. It does not prove the field is writable, the picklist holds the
values you meant, the layout shows what you added, or the relationship resolves. Those
are different claims, and only exercising them settles it.

Close the loop, or say plainly that you did not.

## Level 1 — read it back (always, free)

Do this every time. It writes nothing, so nothing needs approving.

1. **Re-pull the model.** Your local copy is now behind the instance — the digest marks
   itself stale after a checkin for exactly this reason. Download the active set again
   and let the digest rebuild.
2. **Read the component back** with `read-metadata`, in the **resolved** layer. Resolved
   is the real merge, so it is the only layer that answers "what does the instance
   actually have now."
3. **Check what you claimed.** The field is present, its type is what you authored, the
   picklist holds the values you meant, the layout references resolve. Compare against
   what you intended, not against what you wrote — those differ exactly where the bug is.

If the resolved layer does not show your change, the change is not live, whatever the
checkin said. Go to `diagnose`.

A read-back is enough on its own for anything structural — a new picklist value, a
layout section, a renamed label. Stop here unless the change is about *data*.

## Level 2 — exercise it with data (the human's step)

For a change that has to hold data — a new field, a required flag, a relationship, a type
change — reading the model back is not proof. A field can be present, correctly typed,
and still reject or mangle the value you put in it. The proof is a record: create one,
read it back, confirm the value survived.

**You almost certainly cannot do this yourself.** The `aspen` CLI is the metadata lane and
has no record verbs — check `.aspen/bin/aspen --help` and see for yourself rather than taking this
skill's word for it, since the CLI is the authority on its own commands. If a project has
some other record access, it is that project's, not something this plugin assumes.

So Level 2 is normally **handed to the human**: ask them to open the object in the UI,
create or edit one record exercising exactly what you changed, and tell you what happened.
Make the ask specific enough to act on:

> Please open a Contract record and set **Renewal Date** and **ARR**. I need to know the
> date picker accepts it and the amount saves with two decimals. Anything you create stays
> on the instance — nothing on the platform is deleted.

### If you do have a way to write

Whoever runs it, the same gate applies **before** anything reaches the instance:

- **What object**, and **the exact field values** — written out, not "a test record".
- **That it is permanent.** What you create while testing stays, and other people see it.
  Do not plan on cleaning up; write as though you cannot.
- **Which instance** — confirm the binding rather than assuming it.

Then wait for a clear yes. Silence is not approval, and neither is a yes to a different
write earlier in the session; ask again for each one.

Then **read the record back by id** and compare against what you sent. A write that
reports success and stores something else — a truncated string, a coerced number, an
empty lookup — is the failure this whole step exists to catch.

## Report what you actually proved

Say which level you reached and what it showed. "Checked in, read back resolved, field
present and typed as authored; no record written" is a complete and honest report.
"Deployed successfully" is not a verification claim at all.

If you could not verify — no record lane, no approval given, an instance you could not
re-pull — **say that instead of implying it worked.** An unverified change is a normal
outcome. A change reported as verified when it was not is how a broken field reaches
someone else.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "The checkin was green, so it works" | Green means it compiled. It does not mean it holds data. |
| "I'll create a test record to check" | Not until the human has seen the object, the values, and approved. |
| "I'll delete the test record afterwards" | Write as though you cannot. Get approval on that basis. |
| "They approved a write earlier" | Approval is per write, not per session. |
| "The write returned 200, so the value is right" | Read it back by id. Coercion and truncation both return success. |
| "I'll write a test record to check" | The CLI has no record verbs. Ask the human to exercise it, or say you could not. |
