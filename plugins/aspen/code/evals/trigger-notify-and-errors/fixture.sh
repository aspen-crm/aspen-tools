#!/usr/bin/env bash
# Lay down the standard server_main_c trigger crate the plugin's skeleton ships, so the task is
# "edit this crate" (as it is in a real instance folder) and the graders always have a file to read.
set -euo pipefail

crate="metacode/server/server_main_c"
mkdir -p "$crate/src"

cat > "$crate/src/lib.rs" <<'RS'
//! Record-trigger crate. Author the trigger(s) for this task in this file.
//! The platform only loads a server codefile named `server_main_c`.

aspen_crm::entrypoints!(Entrypoints);

struct Entrypoints;
RS

cat > "$crate/Cargo.toml" <<'TOML'
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

cat > "$crate/aspen.server.json" <<'JSON'
{ "record-triggers": [] }
JSON

cat > "rust-toolchain.toml" <<'TOML'
[toolchain]
channel = "1.98.0"
targets = ["wasm32-wasip2"]
TOML
