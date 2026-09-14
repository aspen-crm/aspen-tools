#!/bin/sh
# Launch the Aspen runtime MCP server for Claude Code.
#
# The plugin's .mcp.json runs this rather than the server itself, because the
# server is not part of the plugin: it ships as the .mcpb bundle, and
# install-runtime-mcp.sh (next to this file) unpacks it to a fixed place. This
# script finds it there, settles the session's identity, and execs it over
# stdio. When it is missing, the error names the installer -- Claude Code's own
# message would only say the server failed to start.
#
# Where the server is:
#   $ASPEN_RUNTIME_MCP, if set (a build of your own, say), else
#   <config>/mcp/aspen-runtime-mcp, where <config> is $ASPEN_CONFIG_DIR, else
#   $XDG_CONFIG_HOME/aspen, else ~/.config/aspen -- the aspen CLI's own directory.
#
# Identity, in order:
#   1. ASPEN_API_TOKEN / ASPEN_INSTANCE / ASPEN_API_BASE from the environment
#      Claude Code was launched in. An EMPTY value counts as unset.
#   2. The same names from <config>/mcp/env, which the installer writes.
#   3. Neither: the server falls back to the aspen CLI's stored login, so a
#      developer who has run `aspen login` needs no key here at all.
#
# Empty values are stripped on purpose. The server treats a present-but-empty
# ASPEN_API_TOKEN as a real (empty) credential and stops looking, which would
# silently disable the CLI-login fallback for anyone whose shell exports the
# variable unset.
set -eu

config="${ASPEN_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/aspen}"
dir="$config/mcp"
bin="${ASPEN_RUNTIME_MCP:-$dir/aspen-runtime-mcp}"

# What the shell set wins over the env file.
token="${ASPEN_API_TOKEN:-}"
instance="${ASPEN_INSTANCE:-}"
api_base="${ASPEN_API_BASE:-}"

if [ -f "$dir/env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$dir/env"
  set +a
  if [ -n "$token" ]; then ASPEN_API_TOKEN="$token"; fi
  if [ -n "$instance" ]; then ASPEN_INSTANCE="$instance"; fi
  if [ -n "$api_base" ]; then ASPEN_API_BASE="$api_base"; fi
fi

for name in ASPEN_API_TOKEN ASPEN_INSTANCE ASPEN_API_BASE; do
  eval "value=\${$name:-}"
  if [ -n "$value" ]; then
    export "$name"
  else
    unset "$name"
  fi
done

if [ ! -x "$bin" ]; then
  here="$(cd "$(dirname "$0")" && pwd)"
  echo "aspen-runtime-mcp: no server binary at $bin" >&2
  echo "Install it:   sh \"$here/install-runtime-mcp.sh\"" >&2
  echo "Or point ASPEN_RUNTIME_MCP at a binary you already have." >&2
  exit 1
fi

exec "$bin" --stdio
