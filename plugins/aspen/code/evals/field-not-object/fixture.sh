#!/usr/bin/env bash
# Just `account_p`. The whole answer is two fields on it.
set -euo pipefail
mkdir -p metacode/platform/object_p
cat > metacode/platform/object_p/account_p.json <<'JSON'
{ "ctype": "object_p", "name": "account_p", "label": "Account", "display-field": "name_p",
  "fields": [
    { "name": "name_p", "label": "Account Name", "type": "text", "subtype": "text" },
    { "name": "owner_p", "label": "Owner", "type": "id", "subtype": "lookup", "relationship": "user_p" } ] }
JSON
