#!/usr/bin/env node
// Cross-platform MCP launcher. stdout belongs exclusively to the server's JSON-RPC.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { configRoot, parseEnvFile } from '../skills/contact-merge/scripts/contact-merge.mjs';

export function launchConfig(env = process.env, platform = process.platform) {
  const root = configRoot(env);
  const settings = join(root, 'mcp', 'env');
  const stored = existsSync(settings) ? parseEnvFile(readFileSync(settings, 'utf8')) : {};
  const childEnv = { ...env };
  // Explicit allowlist: the env file is data, never executable shell code.
  for (const key of ['ASPEN_API_TOKEN', 'ASPEN_INSTANCE', 'ASPEN_DEFAULT_INSTANCE', 'ASPEN_API_BASE', 'ASPEN_BULK_WRITES']) {
    const value = env[key]?.trim() || stored[key]?.trim();
    if (value) childEnv[key] = value;
    else delete childEnv[key];
  }
  childEnv.ASPEN_BULK_WRITES ??= '1';
  const binary = env.ASPEN_RUNTIME_MCP || join(root, 'mcp', `aspen-runtime-mcp${platform === 'win32' ? '.exe' : ''}`);
  return { binary, env: childEnv };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = launchConfig();
  const child = spawn(config.binary, ['--stdio'], { env: config.env, stdio: 'inherit', shell: false });
  child.on('error', () => {
    console.error(`aspen-runtime-mcp: cannot launch ${config.binary}. Install the runtime with bin/install-runtime-mcp.sh (macOS/Linux), or extract server/aspen-runtime-mcp.exe from the Windows bundle. ASPEN_RUNTIME_MCP can name an existing binary.`);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
}
