---
type: llm
weight: 3
focus: last_message
---

The message is a plan for tracking whether an account is under NDA, on an Aspen CRM.

The request states there are only ever two states, and asks for a signed date on the covered
ones. The proportionate answer is two fields on `account_p`: a `checkbox` for the NDA status and
a `date` for when it was signed. That is it. A checkbox needs no picklist component, no items to
keep parent-scoped, and reads as a yes/no in every list view, which covers "pull a list of which
accounts are covered" with a list view filter.

Two wrong answers to watch for. A **two-item picklist** adds a `picklist_p` component, and its
items are parent-scoped and permanent, to express what a checkbox already expresses. A **new
object** for the NDA is heavier still: a one-to-one child object for two attributes, which then
needs a layout, a list view and a tab before anyone can even see it.

Nothing on this platform deletes, so both cost more than they look.

PASS if the plan is a checkbox field plus a date field on `account_p`, with no new object and no
new picklist. Also adding the fields to a layout or a list view passes, and is thorough.

FAIL if the plan creates a new object for NDA status, or creates a picklist component for the
two states. Proposing a picklist while noting a checkbox would also work is still a FAIL: the
recommendation is what is being judged.
