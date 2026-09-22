#!/usr/bin/env bash
# The quote objects, the trigger crate, and — the point of this case — a REAL quote line editor
# page with a save path and a validation helper already in it. The prompt names that page, so
# adding the cap there is the path of least resistance and the wrong answer: the data API, the
# runtime MCP and every bulk load write quote lines without ever loading it.
set -euo pipefail

mkdir -p metacode/metadata/object_p metacode/compiled/object_p
mkdir -p metacode/server/server_main_c/src metacode/ui/ui_main_c/src/pages metacode/ui/ui_main_c/src/lib

cat > metacode/metadata/object_p/quote_line_c.json <<'JSON'
{
  "ctype": "object_p",
  "name": "quote_line_c",
  "label": "Quote Line",
  "display-field": "name_c",
  "fields": [
    { "name": "name_c", "label": "Line Name", "type": "text", "subtype": "text", "max-length": 128 },
    { "name": "quote_c", "label": "Quote", "type": "id", "subtype": "lookup", "relationship": "quote_c", "required": true, "deletion-strategy": "cascade" },
    { "name": "product_c", "label": "Product", "type": "id", "subtype": "lookup", "relationship": "product_p" },
    { "name": "quantity_c", "label": "Quantity", "type": "number", "subtype": "number", "min-value": "0", "max-value": "999999" },
    { "name": "unit_price_c", "label": "Unit Price", "type": "currency", "subtype": "currency", "converted-amt": "unit_pricecc_c" },
    { "name": "unit_pricecc_c", "label": "Unit Price (Converted)", "type": "currency", "subtype": "converted" },
    { "name": "discount_pct_c", "label": "Discount %", "type": "number", "subtype": "percentage", "min-value": "0", "max-value": "100" }
  ]
}
JSON

cat > metacode/metadata/object_p/quote_c.json <<'JSON'
{
  "ctype": "object_p",
  "name": "quote_c",
  "label": "Quote",
  "display-field": "name_c",
  "fields": [
    { "name": "name_c", "label": "Quote Name", "type": "text", "subtype": "text", "max-length": 128 },
    { "name": "account_c", "label": "Account", "type": "id", "subtype": "lookup", "relationship": "account_p", "required": true, "deletion-strategy": "block" },
    { "name": "approval_status_c", "label": "Approval Status", "type": "picklist", "subtype": "picklist", "picklist": "quote_c.approval_status_c" }
  ]
}
JSON

cp metacode/metadata/object_p/quote_line_c.json metacode/compiled/object_p/quote_line_c.json

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

cat > metacode/ui/ui_main_c/aspen.client.json <<'JSON'
{
  "routing": {
    "base-url-path-part": "sales",
    "routes": [
      { "name": "quote_lines_page_c", "path": "/quote-lines", "module": "src/pages/quote_lines.ts", "export": "quoteLinesPage" }
    ]
  }
}
JSON

cat > metacode/ui/ui_main_c/src/lib/validate.ts <<'TS'
/** Field-level checks the quote line editor runs before it saves a row. */
export interface FieldError {
    field: string;
    message: string;
}

export function validateLine(row: Record<string, string | null>): FieldError[] {
    const errors: FieldError[] = [];
    const quantity = Number(row.quantity_c ?? '0');
    if (!Number.isFinite(quantity) || quantity <= 0) {
        errors.push({ field: 'quantity_c', message: 'Quantity must be greater than zero.' });
    }
    return errors;
}
TS

cat > metacode/ui/ui_main_c/src/pages/quote_lines.ts <<'TS'
import { definePage } from '@aspen-crm/sdk';
import { validateLine, type FieldError } from '../lib/validate.js';

/** The quote line editor. Rows save one at a time as the rep leaves a cell. */
export const quoteLinesPage = definePage(({ element }) => {
    const root = document.createElement('div');
    element.append(root);

    async function saveRow(row: Record<string, string | null>): Promise<FieldError[]> {
        const errors = validateLine(row);
        if (errors.length > 0) return errors;
        await writeRow(row);
        return [];
    }

    void saveRow;
    return { unmount: () => root.remove() };
});

async function writeRow(_row: Record<string, string | null>): Promise<void> {
    // PATCH /data/records/quote_line_c — omitted from the fixture.
}
TS
