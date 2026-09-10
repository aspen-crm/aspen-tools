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

## Level 2 — round-trip a record (gated)

For a change that has to hold data — a new field, a required flag, a relationship, a
type change — the proof is a record: create one, read it back, confirm the value
survived the round trip.

This writes to a shared instance. **Get explicit human approval first.**

### The approval gate

Before any command that writes, put this in front of the human and wait for a clear yes:

- **What object** you will write to.
- **The exact field values**, written out — not "a test record", the actual payload.
- **That it is permanent.** Anything you create while testing stays on the instance and
  other people will see it. Do not plan on cleaning up afterwards; write as though you
  cannot.
- **Which instance** — confirm the binding rather than assuming it, so nobody discovers
  the test data was written somewhere that mattered.

Then wait. Silence is not approval, and neither is the human having approved a different
write earlier in the session. Ask again for each one.

The plugin's `guard-destructive` hook also stops and asks on a confirmed write. **That
is a backstop, not the approval** — it catches the case where you forgot, and a human
clicking through a permission prompt has not seen the field values. The approval happens
in the conversation, in your words, before you run anything.

### Running it

There are no record verbs in the `aspen` CLI — it is the metadata lane. Record traffic
goes through a separate tool (`aspenx`, or a runtime MCP, depending on how this machine
is set up). **Check what is actually available** — `aspenx --help` — rather than assuming
it is installed; if there is no record lane here, say so and stop at Level 1 instead of
inventing one.

Where `aspenx` is present, the shape of the round trip is:

1. **Read first.** A query or a describe costs nothing and is never gated. Confirm the
   object and the field names you are about to write.
2. **Dry-run the write.** `aspenx` refuses a write without `--confirmed` and sends
   nothing, so running it un-confirmed shows you exactly what would go without touching
   the instance. Show the human that output — it is the best possible version of the
   approval gate above.
3. **Write, once approved.** Re-run with `--confirmed`.
4. **Read it back by id** and confirm the value the instance stored is the value you
   sent. A write that reports success and stores something else — a truncated string, a
   coerced number, an empty lookup — is the failure this whole step exists to catch.

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
| "The permission prompt is the approval" | The prompt is a backstop. The human has not seen the values in it. |
| "The write returned 200, so the value is right" | Read it back by id. Coercion and truncation both return success. |
