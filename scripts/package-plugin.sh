#!/usr/bin/env bash
# Package a plugin from this repository as a .zip a host can upload directly.
#
# Cowork installs a plugin one of two ways: from a marketplace, or by uploading
# a zip in Customize -> Plugins. This builds the second. The zip is also a valid
# `archive` source for a marketplace entry, should one ever point at it.
#
#   ./scripts/package-plugin.sh plugins/aspen/cowork
#
# The zip carries the plugin root at its TOP LEVEL -- .claude-plugin/,
# skills/, agents/ -- not nested under a directory. A host that unpacks it
# expects to find plugin.json at the root, and a wrapper directory breaks that.
#
# It also writes a single-plugin marketplace.json INTO the zip. That file is
# generated here and deliberately not committed: in the repository the plugin is
# one entry in the root marketplace, and a second nested manifest there would be
# a copy to keep in sync. In the zip there is no root marketplace to belong to.
set -euo pipefail

PLUGIN_DIR="${1:?usage: package-plugin.sh <plugin-dir> [outdir]}"
OUT_DIR="${2:-dist}"
PLUGIN_DIR="${PLUGIN_DIR%/}"

MANIFEST="$PLUGIN_DIR/.claude-plugin/plugin.json"
[ -f "$MANIFEST" ] || { echo "error: no manifest at $MANIFEST" >&2; exit 1; }

read -r NAME VERSION DESC <<<"$(python3 - "$MANIFEST" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
for k in ("name", "version"):
    if not d.get(k):
        sys.exit(f"error: {k} missing from plugin.json")
print(d["name"], d["version"], d.get("description", ""))
PY
)"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
BUILD="$STAGE/$NAME"

# Copy the plugin verbatim, minus anything that is repository bookkeeping.
mkdir -p "$BUILD"
tar -cf - -C "$PLUGIN_DIR" \
    --exclude='.git' --exclude='.gitignore' --exclude='.DS_Store' \
    --exclude='node_modules' --exclude='test' . | tar -xf - -C "$BUILD"

# The zip stands alone, so it carries its own one-plugin marketplace.
python3 - "$BUILD/.claude-plugin/marketplace.json" "$NAME" "$DESC" <<'PY'
import json, sys
path, name, desc = sys.argv[1], sys.argv[2], sys.argv[3]
json.dump({
    "name": name,
    "owner": {"name": "Aspen CRM"},
    "metadata": {"description": desc},
    "plugins": [{"name": name, "source": "./", "description": desc}],
}, open(path, "w"), indent=2)
open(path, "a").write("\n")
PY

# zip records an mtime per entry, so a checkout's file times would leak into the
# archive and two builds of one commit would not match. Pin every staged file to
# the plugin's last commit date. Builds from a dirty tree therefore reuse the
# previous commit's timestamp -- release from a clean tree.
SOURCE_EPOCH="$(git log -1 --format=%ct -- "$PLUGIN_DIR" 2>/dev/null || true)"
: "${SOURCE_EPOCH:=0}"
STAMP="$(python3 -c 'import sys,time; print(time.strftime("%Y%m%d%H%M.%S", time.gmtime(int(sys.argv[1]))))' "$SOURCE_EPOCH")"
find "$BUILD" -exec touch -t "$STAMP" {} +

# Validate what is actually about to ship, not the source tree.
claude plugin validate "$BUILD" >/dev/null || { echo "error: validation failed" >&2; exit 1; }

mkdir -p "$OUT_DIR"
ZIP="$(cd "$OUT_DIR" && pwd)/$NAME-$VERSION.zip"
rm -f "$ZIP"
# -X drops uid/gid and extra attributes so two builds of one commit match.
(cd "$BUILD" && find . -type f | sort | zip -qX "$ZIP" -@)

echo "$NAME $VERSION -> $ZIP"
unzip -Z1 "$ZIP" | sed 's/^/  /'
