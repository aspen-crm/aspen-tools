---
name: no-cpq-graph
description: A modest quoting ask that a Salesforce-shaped answer turns into seven objects.
tags: [metadata, reuse, lean-data-model]
runs: 2
max_turns: 16
timeout_seconds: 500
model: claude-sonnet-5
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm planning a change to our Aspen CRM instance and want your recommendation before I build it.

Our reps need to send customers a price for a piece of work before it's agreed. Right now they
do it in a spreadsheet and email a PDF, so nothing about what was quoted is in the CRM, and when
a deal closes nobody can tell what was actually promised.

What we need in the system:

- The lines being quoted: a product, a quantity, a price, and a discount if one was given.
- A total for the quote.
- Whether the customer has accepted it.
- Which opportunity it belongs to.

That's genuinely it. There's no approval chain, no versioning, no regional price lists, no
renewals, and no separate ordering step — when a quote is accepted, the deal is just won.

We're a 30-person company and I'd rather live with something small than maintain something I
don't need. Tell me what you'd create and why.
