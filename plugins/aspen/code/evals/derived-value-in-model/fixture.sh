#!/usr/bin/env bash
# The three objects the prompt names, in the authored tier, plus compiled copies to read a
# shape from and the standard trigger crate. The point of the case is which tier the answer
# lands in, so everything needed to answer it in ANY tier is present: objects to add a field
# to, a crate to write a trigger in, and (deliberately) a UI codefile already set up, so
# building it as a page is just as available as building it as a model.
set -euo pipefail

mkdir -p metacode/metadata/object_p metacode/compiled/object_p
mkdir -p metacode/server/server_main_c/src metacode/ui/ui_main_c/src/pages

cat > metacode/metadata/object_p/engagement_c.json <<'JSON'
{
  "ctype": "object_p",
  "name": "engagement_c",
  "label": "Engagement",
  "display-field": "name_c",
  "description": "A delivery project run for one account against a fixed contract value.",
  "fields": [
    { "name": "name_c", "label": "Engagement Name", "type": "text", "subtype": "text", "max-length": 128, "indexed": true },
    { "name": "account_c", "label": "Account", "type": "id", "subtype": "lookup", "relationship": "account_p", "required": true, "deletion-strategy": "block" },
    { "name": "status_c", "label": "Status", "type": "picklist", "subtype": "picklist", "picklist": "engagement_c.status_c" },
    { "name": "owner_c", "label": "Owner", "type": "id", "subtype": "lookup", "relationship": "user_p" },
    { "name": "start_date_c", "label": "Start Date", "type": "date", "subtype": "date" },
    { "name": "end_date_c", "label": "End Date", "type": "date", "subtype": "date" }
  ]
}
JSON

cat > metacode/metadata/object_p/order_line_c.json <<'JSON'
{
  "ctype": "object_p",
  "name": "order_line_c",
  "label": "Order Line",
  "display-field": "name_c",
  "fields": [
    { "name": "name_c", "label": "Line Name", "type": "text", "subtype": "text", "max-length": 128 },
    { "name": "engagement_c", "label": "Engagement", "type": "id", "subtype": "lookup", "relationship": "engagement_c", "deletion-strategy": "block" },
    { "name": "product_c", "label": "Product", "type": "id", "subtype": "lookup", "relationship": "product_p" },
    { "name": "line_total_c", "label": "Line Total", "type": "currency", "subtype": "currency", "converted-amt": "line_totalcc_c", "description": "Contracted value of this line." },
    { "name": "line_totalcc_c", "label": "Line Total (Converted)", "type": "currency", "subtype": "converted" }
  ]
}
JSON

cat > metacode/metadata/object_p/timesheet_c.json <<'JSON'
{
  "ctype": "object_p",
  "name": "timesheet_c",
  "label": "Timesheet",
  "display-field": "name_c",
  "fields": [
    { "name": "name_c", "label": "Timesheet Name", "type": "text", "subtype": "text", "max-length": 128 },
    { "name": "engagement_c", "label": "Engagement", "type": "id", "subtype": "lookup", "relationship": "engagement_c", "deletion-strategy": "block" },
    { "name": "week_starting_c", "label": "Week Starting", "type": "date", "subtype": "date" },
    { "name": "total_hours_c", "label": "Total Hours", "type": "number", "subtype": "number", "min-value": "0", "max-value": "168" },
    { "name": "bill_rate_c", "label": "Bill Rate", "type": "currency", "subtype": "currency", "converted-amt": "bill_ratecc_c" },
    { "name": "bill_ratecc_c", "label": "Bill Rate (Converted)", "type": "currency", "subtype": "converted" },
    { "name": "status_c", "label": "Status", "type": "picklist", "subtype": "picklist", "picklist": "timesheet_c.status_c" }
  ]
}
JSON

# A compiled copy to read a shape from, as the loop's first step tells you to.
cp metacode/metadata/object_p/engagement_c.json metacode/compiled/object_p/engagement_c.json

cat > metacode/server/server_main_c/src/lib.rs <<'RS'
//! Record-trigger crate. Author the trigger(s) for this task in this file.
//! The platform only loads a server codefile named `server_main_c`.

aspen_crm::entrypoints!(Entrypoints);

struct Entrypoints;
RS

cat > metacode/server/server_main_c/Cargo.toml <<'TOML'
[package]
name = "server_main_c"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
aspen-crm = "0.1.0"
jiff = "0.2"
TOML

echo '{ "record-triggers": [] }' > metacode/server/server_main_c/aspen.server.json

cat > rust-toolchain.toml <<'TOML'
[toolchain]
channel = "1.98.0"
targets = ["wasm32-wasip2"]
TOML

# A working UI codefile, so a page is exactly as easy to reach for as a field.
cat > metacode/ui/ui_main_c/aspen.client.json <<'JSON'
{
  "routing": {
    "base-url-path-part": "services",
    "routes": [
      { "name": "engagements_page_c", "path": "/engagements", "module": "src/pages/engagements.ts", "export": "engagementsPage" }
    ]
  }
}
JSON

cat > metacode/ui/ui_main_c/src/pages/engagements.ts <<'TS'
import { definePage } from '@aspen-crm/sdk';

export const engagementsPage = definePage(({ element }) => {
    const root = document.createElement('div');
    element.append(root);
    return { unmount: () => root.remove() };
});
TS
