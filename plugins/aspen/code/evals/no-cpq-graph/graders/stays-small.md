---
type: llm
weight: 3
focus: last_message
---

The message is a plan for adding quoting to an Aspen CRM at a 30-person company. Judge ONLY how
many objects it proposes to create, against what was asked for.

What was asked for: quote lines with product, quantity, price and discount; a quote total;
accepted or not; and a link to the opportunity. The requester explicitly ruled out approvals,
versioning, regional price lists, renewals and a separate ordering step, and said they would
rather live with something small.

The instance already has `opportunity_p` and `product_p` in its platform tier.

A proportionate answer is roughly two new custom objects — a quote and a quote line — or even
one, if lines hang off the opportunity directly. The total and the accepted flag are fields. The
link to the opportunity is a lookup.

The failure is reproducing Salesforce's CPQ graph: Quote plus QuoteLine plus Order plus OrderLine
plus PriceBook plus PriceBookEntry plus an approval object. Salesforce carries that for twenty
years of backward compatibility. Nothing here does, and nothing on Aspen deletes.

PASS if the plan proposes at most three new custom objects, and does not introduce a pricebook,
an order, or an approval object. Naming those as things deliberately NOT being built passes and
is a good sign.

FAIL if it proposes four or more new objects, or introduces any of pricebook, pricebook entry,
order, order line, quote version or approval as things to build now.
