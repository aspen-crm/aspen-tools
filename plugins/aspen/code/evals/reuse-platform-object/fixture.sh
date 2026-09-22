#!/usr/bin/env bash
# The instance already models this. `opportunity_p` is in the platform tier with the fields a
# deal needs, and a custom `opportunity_line_c` already hangs off it -- so the concept is not
# just present, it has been built on. Nothing in the prompt says any of that; finding it is
# the case.
set -euo pipefail
mkdir -p metacode/platform/object_p metacode/metadata/object_p metacode/metadata/tab_collection_p

cat > metacode/platform/object_p/opportunity_p.json <<'JSON'
{
  "ctype": "object_p",
  "name": "opportunity_p",
  "label": "Opportunity",
  "display-field": "name_p",
  "description": "A revenue opportunity against an account.",
  "fields": [
    { "name": "name_p", "label": "Opportunity Name", "type": "text", "subtype": "text" },
    { "name": "customer_p", "label": "Customer", "type": "polyid", "subtype": "lookup", "allowed-objects": ["account_p"] },
    { "name": "amount_p", "label": "Amount", "type": "currency", "subtype": "currency" },
    { "name": "probability_p", "label": "Probability", "type": "number", "subtype": "percentage" },
    { "name": "close_date_p", "label": "Close Date", "type": "date", "subtype": "date" },
    { "name": "next_step_p", "label": "Next Step", "type": "text", "subtype": "text" },
    { "name": "description_p", "label": "Description", "type": "text", "subtype": "long" },
    { "name": "owner_p", "label": "Owner", "type": "id", "subtype": "lookup", "relationship": "user_p" },
    { "name": "status_p", "label": "Status", "type": "picklist", "subtype": "picklist" }
  ]
}
JSON

cat > metacode/platform/object_p/account_p.json <<'JSON'
{ "ctype": "object_p", "name": "account_p", "label": "Account", "display-field": "name_p",
  "fields": [ { "name": "name_p", "label": "Account Name", "type": "text", "subtype": "text" } ] }
JSON

cat > metacode/platform/object_p/contact_p.json <<'JSON'
{ "ctype": "object_p", "name": "contact_p", "label": "Contact", "display-field": "name_p",
  "fields": [ { "name": "name_p", "label": "Full Name", "type": "text", "subtype": "text" } ] }
JSON

cat > metacode/metadata/object_p/opportunity_line_c.json <<'JSON'
{
  "ctype": "object_p",
  "name": "opportunity_line_c",
  "label": "Opportunity Line",
  "display-field": "name_c",
  "description": "A product line on an opportunity.",
  "fields": [
    { "name": "name_c", "label": "Line Name", "type": "text", "subtype": "text" },
    { "name": "opportunity_c", "label": "Opportunity", "type": "id", "subtype": "lookup", "relationship": "opportunity_p" },
    { "name": "quantity_c", "label": "Quantity", "type": "number", "subtype": "number" },
    { "name": "unit_price_c", "label": "Unit Price", "type": "currency", "subtype": "currency" }
  ]
}
JSON

cat > metacode/metadata/tab_collection_p/sales_c.json <<'JSON'
{
  "ctype": "tab_collection_p",
  "name": "sales_c",
  "label": "Sales",
  "tabs": [
    { "name": "account_c", "tab": "account_p.tab_p", "active": true },
    { "name": "contact_c", "tab": "contact_p.tab_p", "active": true },
    { "name": "opportunity_c", "tab": "opportunity_p.tab_p", "active": true }
  ]
}
JSON
