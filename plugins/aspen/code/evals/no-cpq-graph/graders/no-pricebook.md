---
type: regex
pattern: '(creat|add|author|build|introduc)[^.\n]{0,70}(pricebook|price_book|price book|order[ _]line|approval object)'
flags: i
match: not_contains
target: last_message
weight: 1
---

Negative signal: the plan does not propose BUILDING the rest of the Salesforce CPQ graph.

The verb requirement matters. Naming a pricebook or an order line as something deliberately not
being built is a good answer, and the llm grader on this case passes it explicitly — so this
pattern only matches those names next to a create/add/author/build/introduce verb. A grader that
fired on the word alone would mark the best answers down, which is worse than no signal.
