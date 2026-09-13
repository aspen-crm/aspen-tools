#!/bin/sh
# Install the Aspen runtime MCP server for Claude Code, on macOS or Linux.
#
# Claude Code cannot install an .mcpb bundle -- that format is Claude Desktop's.
# This fetches the bundle for this machine from the aspen-tools release, takes
# the server out of it, and puts it where the aspen-cowork plugin's launcher
# (aspen-runtime-mcp.sh, next to this file) looks:
#
#   <config>/mcp/aspen-runtime-mcp     the server
#   <config>/mcp/env                   ASPEN_INSTANCE and friends, mode 600
#
# <config> is $ASPEN_CONFIG_DIR, else $XDG_CONFIG_HOME/aspen, else ~/.config/aspen
# -- the directory the aspen CLI keeps its own login in.
#
#   sh install-runtime-mcp.sh                        the current release
#   sh install-runtime-mcp.sh --instance URL         ...and record the instance
#   sh install-runtime-mcp.sh --version 0.1.16       a specific release
#   sh install-runtime-mcp.sh --file some.mcpb       a bundle already downloaded
#
# Without a checkout:
#
#   curl -fsSL https://raw.githubusercontent.com/aspen-crm/aspen-tools/main/plugins/aspen/cowork/bin/install-runtime-mcp.sh | sh -s -- --instance URL
#
# It never asks for, reads, or stores an API token. The server takes one from
# ASPEN_API_TOKEN in your environment, from the env file if you add it there
# yourself, or -- with neither -- from the aspen CLI's stored login.
set -eu

REPO="aspen-crm/aspen-tools"
RELEASES="https://github.com/$REPO/releases/download"

version=""
file=""
instance=""
api_base=""

usage() {
  cat <<'EOF'
usage: install-runtime-mcp.sh [--instance URL] [--api-base PATH] [--version X.Y.Z | --file BUNDLE.mcpb]

  --instance URL   record the instance base URL (https://<host>/<domain>/<instance>)
                   in <config>/mcp/env so the server needs nothing from your shell
  --api-base PATH  record a non-default API base path (only for a shared-host instance)
  --version X.Y.Z  install that release instead of the current one
  --file BUNDLE    install from an .mcpb you already downloaded
EOF
}

die() {
  echo "install-runtime-mcp: $*" >&2
  exit 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    --instance)   instance="${2:?--instance needs a URL}"; shift 2 ;;
    --instance=*) instance="${1#*=}"; shift ;;
    --api-base)   api_base="${2:?--api-base needs a path}"; shift 2 ;;
    --api-base=*) api_base="${1#*=}"; shift ;;
    --version)    version="${2:?--version needs a version}"; shift 2 ;;
    --version=*)  version="${1#*=}"; shift ;;
    --file)       file="${2:?--file needs a path}"; shift 2 ;;
    --file=*)     file="${1#*=}"; shift ;;
    -h|--help)    usage; exit 0 ;;
    *)            echo "install-runtime-mcp: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done
if [ -n "$file" ] && [ -n "$version" ]; then
  die "--file and --version cannot be combined: the file already is a version"
fi

# One bundle per OS. macOS is universal; Linux is per-arch; Windows is Claude
# Desktop's, and a shell installer is the wrong shape there anyway.
os="$(uname -s)"
arch="$(uname -m)"
case "$os" in
  Darwin) platform="macos" ;;
  Linux)
    case "$arch" in
      x86_64|amd64)  platform="linux-x86_64" ;;
      aarch64|arm64) platform="linux-aarch64" ;;
      *) die "no Linux bundle is published for $arch" ;;
    esac ;;
  *)
    die "this installer covers macOS and Linux. On Windows: download $RELEASES/stdio-mcp-latest/aspen-runtime-mcp-windows.mcpb, unzip server\\aspen-runtime-mcp.exe somewhere permanent, then: claude mcp add --scope user aspen-runtime-mcp -- C:\\path\\to\\aspen-runtime-mcp.exe --stdio" ;;
esac

config="${ASPEN_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/aspen}"
dir="$config/mcp"
bin="$dir/aspen-runtime-mcp"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if [ -n "$file" ]; then
  [ -f "$file" ] || die "no such file: $file"
  bundle="$file"
else
  command -v curl >/dev/null 2>&1 || die "curl is required to download the bundle"
  if [ -n "$version" ]; then
    url="$RELEASES/stdio-mcp-v$version/aspen-runtime-mcp-$version-$platform.mcpb"
  else
    url="$RELEASES/stdio-mcp-latest/aspen-runtime-mcp-$platform.mcpb"
  fi
  bundle="$tmp/bundle.mcpb"
  echo "Downloading $url"
  curl -fsSL --retry 3 -o "$bundle" "$url" || die "download failed: $url"
fi

# An .mcpb is a zip: manifest.json plus server/<binary>. Read members straight
# out of it so nothing else lands on disk, with python3 as the fallback on a
# Linux box without unzip.
extract() {
  if command -v unzip >/dev/null 2>&1; then
    unzip -p "$1" "$2" > "$3"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c 'import sys, zipfile; sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read(sys.argv[2]))' "$1" "$2" > "$3"
  else
    die "unzip or python3 is needed to open the bundle"
  fi
}

extract "$bundle" manifest.json "$tmp/manifest.json" || die "not an .mcpb bundle: $bundle"
bundle_version="$(sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p' "$tmp/manifest.json" | head -n 1)"
[ -n "$bundle_version" ] || die "the bundle's manifest.json has no version"

extract "$bundle" server/aspen-runtime-mcp "$tmp/aspen-runtime-mcp" || die "the bundle has no server/aspen-runtime-mcp"
chmod 755 "$tmp/aspen-runtime-mcp"
# A bundle a browser downloaded carries the quarantine flag, and unzip passes it
# on; a quarantined binary is killed silently on launch. Clear it either way.
xattr -d com.apple.quarantine "$tmp/aspen-runtime-mcp" 2>/dev/null || true

mkdir -p "$dir"
mv -f "$tmp/aspen-runtime-mcp" "$bin"

if ! reported="$("$bin" --version 2>&1)"; then
  die "the installed server does not run on this machine: $reported"
fi
reported="${reported%%
*}"

# The env file: KEY='value' lines the launcher sources. Rewritten key by key so
# anything you added by hand (a token, say) survives a re-install.
set_env() {
  envfile="$dir/env"
  umask 077
  if [ -f "$envfile" ]; then
    grep -v "^$1=" "$envfile" > "$envfile.new" || true
  else
    : > "$envfile.new"
  fi
  printf "%s='%s'\n" "$1" "$2" >> "$envfile.new"
  chmod 600 "$envfile.new"
  mv -f "$envfile.new" "$envfile"
}

if [ -n "$instance" ]; then
  instance="${instance%/}"
  case "$instance" in
    https://*/*/*) ;;
    *) echo "warning: an instance base URL is https://<host>/<domain>/<instance>; '$instance' does not look like one" >&2 ;;
  esac
  set_env ASPEN_INSTANCE "$instance"
fi
if [ -n "$api_base" ]; then
  set_env ASPEN_API_BASE "$api_base"
fi

echo
echo "Installed Aspen Runtime MCP $bundle_version ($reported)"
echo "  server:   $bin"
if [ -f "$dir/env" ]; then
  echo "  settings: $dir/env"
fi
echo
if grep -q '^ASPEN_INSTANCE=' "$dir/env" 2>/dev/null; then
  echo "Instance recorded. For the token, do one of:"
else
  echo "No instance recorded. Do one of:"
fi
echo "  - run 'aspen login --instance <URL>' once: the server reuses the CLI's login"
echo "  - export ASPEN_INSTANCE and ASPEN_API_TOKEN in the shell you start Claude Code from"
echo "  - add ASPEN_API_TOKEN='secret-token:aspen_...' to $dir/env (mode 600)"
echo
echo "Then start a new Claude Code session. With the aspen-cowork plugin installed the"
echo "server starts on its own; /mcp lists it as aspen-runtime-mcp. Without the plugin:"
echo "  claude mcp add --scope user aspen-runtime-mcp -- \"$bin\" --stdio"
