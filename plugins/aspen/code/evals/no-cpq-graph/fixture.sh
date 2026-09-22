#!/usr/bin/env bash
# The platform tier a real instance has. `opportunity_p` and `product_p` are both here, which
# is most of what the request needs -- the question is how much gets added beside them.
set -euo pipefail
mkdir -p metacode/platform/object_p metacode/metadata/object_p

cat > metacode/platform/object_p/opportunity_p.json <<'JSON'
{ "ctype": "object_p", "name": "opportunity_p", "label": "Opportunity", "display-field": "name_p",
  "fields": [
    { "name": "name_p", "type": "text", "subtype": "text" },
    { "name": "amount_p", "type": "currency", "subtype": "currency" },
    { "name": "close_date_p", "type": "date", "subtype": "date" },
    { "name": "status_p", "type": "picklist", "subtype": "picklist" },
    { "name": "owner_p", "type": "id", "subtype": "lookup", "relationship": "user_p" } ] }
JSON

cat > metacode/platform/object_p/product_p.json <<'JSON'
{ "ctype": "object_p", "name": "product_p", "label": "Product", "display-field": "name_p",
  "fields": [
    { "name": "name_p", "type": "text", "subtype": "text" },
    { "name": "sku_p", "type": "text", "subtype": "text" },
    { "name": "list_price_p", "type": "currency", "subtype": "currency" } ] }
JSON

cat > metacode/platform/object_p/account_p.json <<'JSON'
{ "ctype": "object_p", "name": "account_p", "label": "Account", "display-field": "name_p",
  "fields": [ { "name": "name_p", "type": "text", "subtype": "text" } ] }
JSON

cat > metacode/platform/object_p/product_category_p.json <<'JSON'
{ "ctype": "object_p", "name": "product_category_p", "label": "Product Category", "display-field": "name_p",
  "fields": [ { "name": "name_p", "type": "text", "subtype": "text" } ] }
JSON
