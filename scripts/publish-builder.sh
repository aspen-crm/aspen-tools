#!/usr/bin/env bash
#
# Publish one Aspen Builder version to this repository.
#
# Two files go out, deliberately: macOS on Apple silicon, and Windows on x64.
# Those cover everyone we hand a link to. The other builds (Intel mac, Arm
# Windows, the universal Windows installer) are still produced by
# `npm run package:*` in aspen-builder and are still worth keeping there; they
# are simply not published, because every extra file on a download page is one
# more chance to pick the wrong one.
#
#   ./scripts/publish-builder.sh 0.11.0
#   ./scripts/publish-builder.sh 0.11.0 --dry-run
#
set -euo pipefail

VERSION="${1:-}"
DRY_RUN="${2:-}"
REPO="aspen-crm/aspen-tools"
SRC="${BUILDER_RELEASE_DIR:-../aspen-builder/release}"

if [[ -z "$VERSION" ]]; then
  echo "usage: $0 <version> [--dry-run]   e.g. $0 0.11.0" >&2
  exit 2
fi

# What we ship, and what it is called once published. The published names carry
# no version: `builder-latest` overwrites them in place, which is what keeps the
# README's download links permanent.
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

echo "publishing Builder $VERSION to $REPO"
echo "  macOS (Apple silicon)  $(basename "$MAC_SRC")"
echo "  Windows (x64)          $(basename "$WIN_SRC")"

if [[ "$DRY_RUN" == "--dry-run" ]]; then
  echo "dry run: nothing uploaded"
  exit 0
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
# The versioned release keeps the real filenames, so a download from it is
# self-describing once it is sitting in someone's Downloads folder.
cp "$MAC_SRC" "$STAGE/Aspen-Builder-$VERSION-arm64.dmg"
cp "$WIN_SRC" "$STAGE/Aspen-Builder-$VERSION-Setup-x64.exe"
# `builder-latest` gets the version-less names.
cp "$MAC_SRC" "$STAGE/$MAC_PUB"
cp "$WIN_SRC" "$STAGE/$WIN_PUB"

TAG="builder-v$VERSION"
if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "updating existing $TAG"
  gh release upload "$TAG" \
    "$STAGE/Aspen-Builder-$VERSION-arm64.dmg" \
    "$STAGE/Aspen-Builder-$VERSION-Setup-x64.exe" \
    --repo "$REPO" --clobber
else
  echo "creating $TAG"
  gh release create "$TAG" \
    "$STAGE/Aspen-Builder-$VERSION-arm64.dmg" \
    "$STAGE/Aspen-Builder-$VERSION-Setup-x64.exe" \
    --repo "$REPO" \
    --title "Aspen Builder $VERSION" \
    --notes "Aspen Builder $VERSION. See the private aspen-builder repository for the full change log."
fi

# `builder-latest` is a fixed tag, never GitHub's own "Latest": that resolves
# across the whole repository, so publishing a plugin- release would silently
# repoint every Builder download link at a release holding no installers.
if gh release view builder-latest --repo "$REPO" >/dev/null 2>&1; then
  gh release edit builder-latest --repo "$REPO" \
    --notes "Always the current Aspen Builder. Currently $VERSION." >/dev/null
else
  gh release create builder-latest --repo "$REPO" \
    --title "Aspen Builder (latest)" \
    --notes "Always the current Aspen Builder. Currently $VERSION." \
    --latest=false >/dev/null
fi
# --clobber is what makes this an update: without it the upload is rejected
# because an asset of that name already exists.
gh release upload builder-latest "$STAGE/$MAC_PUB" "$STAGE/$WIN_PUB" \
  --repo "$REPO" --clobber

echo
echo "published. permanent links:"
echo "  https://github.com/$REPO/releases/download/builder-latest/$MAC_PUB"
echo "  https://github.com/$REPO/releases/download/builder-latest/$WIN_PUB"
