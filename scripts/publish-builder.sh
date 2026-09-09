#!/usr/bin/env bash
#
# Publish one Aspen Builder version to this repository, in two phases with a
# human reading the text in between.
#
#   ./scripts/publish-builder.sh 0.11.0              # 1. stage a DRAFT
#   ./scripts/publish-builder.sh 0.11.0 --go-live    # 2. publish it
#
# Phase 1 uploads the installers to a DRAFT release: nothing is downloadable
# and nothing is listed. Phase 2 is the only thing that makes it public, and it
# refuses to run until the notes have been written by hand.
#
# Two files go out, deliberately: macOS on Apple silicon, and Windows on x64.
# The other builds are still produced by `npm run package:*` in aspen-builder
# and kept there; they are simply not published.
#
set -euo pipefail

VERSION="${1:-}"
MODE="${2:-}"
REPO="aspen-crm/aspen-tools"
SRC="${BUILDER_RELEASE_DIR:-../aspen-builder/release}"
NOTES_DIR="release-notes"

if [[ -z "$VERSION" ]]; then
  echo "usage: $0 <version> [--go-live|--dry-run]   e.g. $0 0.11.0" >&2
  exit 2
fi

TAG="builder-v$VERSION"
NOTES="$NOTES_DIR/$TAG.md"
MAC_SRC="$SRC/Aspen Builder-$VERSION-arm64.dmg"
WIN_SRC="$SRC/Aspen Builder-$VERSION-Setup-x64.exe"
MAC_PUB="Aspen-Builder-arm64.dmg"
WIN_PUB="Aspen-Builder-Setup-x64.exe"

for f in "$MAC_SRC" "$WIN_SRC"; do
  if [[ ! -f "$f" ]]; then
    echo "missing: $f" >&2
    echo "build it first in aspen-builder: npm run package:mac && npm run package:win" >&2
    exit 1
  fi
done

# ---------------------------------------------------------------- notes ----
# The notes are written by hand, every time. This is a PUBLIC page: it is read
# by people who do not have the source, do not know our ticket numbers and have
# no interest in which file changed. The private release in aspen-builder is
# where the detail belongs.
if [[ ! -f "$NOTES" ]]; then
  mkdir -p "$NOTES_DIR"
  cat > "$NOTES" <<TEMPLATE
Aspen Builder $VERSION.

<!--
Keep this SHORT -- a few lines. Say what someone will notice, in their words.

Good:  Sign-in works again on current instances.
Bad:   Fixed resolveInstanceUrl to probe / and read the redirect (VX-4090).

Leave out: file paths, function names, ticket numbers, internal repo names,
platform internals, and anything that only makes sense with the source open.
The private release in aspen-builder is where all of that lives.

Delete these comments before publishing -- they are not stripped for you.
-->
TEMPLATE
  echo "wrote a notes template: $NOTES"
  echo "edit it, then re-run: $0 $VERSION"
  exit 3
fi

if grep -q '<!--' "$NOTES"; then
  echo "$NOTES still contains the template comments." >&2
  echo "edit it into real notes first, then re-run." >&2
  exit 3
fi

BODY="$(sed -e 's/[[:space:]]*$//' "$NOTES")"
if [[ -z "${BODY//[[:space:]]/}" ]]; then
  echo "$NOTES is empty. Write something before publishing." >&2
  exit 3
fi

CHARS=$(printf '%s' "$BODY" | wc -c | tr -d ' ')
LINES=$(printf '%s\n' "$BODY" | grep -c '' || true)

echo "publishing Builder $VERSION to $REPO"
echo "  macOS (Apple silicon)  $(basename "$MAC_SRC")"
echo "  Windows (x64)          $(basename "$WIN_SRC")"
echo
echo "--- notes as they will appear, $LINES lines / $CHARS chars ------------"
printf '%s\n' "$BODY"
echo "----------------------------------------------------------------------"
if (( CHARS > 1200 )); then
  echo "note: that is long for a public page. Private detail belongs in aspen-builder."
fi
echo

if [[ "$MODE" == "--dry-run" ]]; then
  echo "dry run: nothing uploaded"
  exit 0
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp "$MAC_SRC" "$STAGE/Aspen-Builder-$VERSION-arm64.dmg"
cp "$WIN_SRC" "$STAGE/Aspen-Builder-$VERSION-Setup-x64.exe"
cp "$MAC_SRC" "$STAGE/$MAC_PUB"
cp "$WIN_SRC" "$STAGE/$WIN_PUB"

# ------------------------------------------------------- phase 1: draft ----
if [[ "$MODE" != "--go-live" ]]; then
  if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
    gh release edit "$TAG" --repo "$REPO" --notes "$BODY" --draft >/dev/null
    gh release upload "$TAG" \
      "$STAGE/Aspen-Builder-$VERSION-arm64.dmg" \
      "$STAGE/Aspen-Builder-$VERSION-Setup-x64.exe" \
      --repo "$REPO" --clobber
  else
    gh release create "$TAG" \
      "$STAGE/Aspen-Builder-$VERSION-arm64.dmg" \
      "$STAGE/Aspen-Builder-$VERSION-Setup-x64.exe" \
      --repo "$REPO" --draft \
      --title "Aspen Builder $VERSION" --notes "$BODY" >/dev/null
  fi
  echo "staged as a DRAFT. Nothing is downloadable and nothing is listed yet."
  echo "read it: $(gh release view "$TAG" --repo "$REPO" --json url --jq .url)"
  echo "then:    $0 $VERSION --go-live"
  exit 0
fi

# ----------------------------------------------------- phase 2: go live ----
if ! gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "no draft for $TAG. Run '$0 $VERSION' first." >&2
  exit 1
fi

read -r -p "Publish these notes to the public repo? Type the version to confirm: " CONFIRM
if [[ "$CONFIRM" != "$VERSION" ]]; then
  echo "not confirmed; nothing published."
  exit 1
fi

gh release edit "$TAG" --repo "$REPO" --notes "$BODY" --draft=false >/dev/null

# `builder-latest` is a fixed tag, never GitHub's own "Latest": that resolves
# across the whole repository, so a plugin- release would silently repoint every
# Builder download link at a release holding no installers.
if gh release view builder-latest --repo "$REPO" >/dev/null 2>&1; then
  gh release edit builder-latest --repo "$REPO" \
    --notes "Always the current Aspen Builder. Currently $VERSION." >/dev/null
else
  gh release create builder-latest --repo "$REPO" \
    --title "Aspen Builder (latest)" \
    --notes "Always the current Aspen Builder. Currently $VERSION." \
    --latest=false >/dev/null
fi
gh release upload builder-latest "$STAGE/$MAC_PUB" "$STAGE/$WIN_PUB" \
  --repo "$REPO" --clobber

echo
echo "published. permanent links:"
echo "  https://github.com/$REPO/releases/download/builder-latest/$MAC_PUB"
echo "  https://github.com/$REPO/releases/download/builder-latest/$WIN_PUB"
