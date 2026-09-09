/**
 * Scaffolds the Hello World starter page into an aspen-template clone and registers
 * its route, so the app becomes deployable (x-cli requires a non-empty routing.routes).
 *
 * Run from the clone's repo root (the skill invokes it as):
 *   node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold-page.mjs"
 *
 * It:
 *   1. Copies the bundled page template into
 *      metacode/ui/ui_main_c/src/pages/home-page/HomePage.tsx
 *   2. Adds a route for it to metacode/ui/ui_main_c/xconfig.json (routing.routes),
 *      idempotently (no-op if the route name already exists).
 *
 * The page/route names use the Custom (_c) namespace. Paths are resolved relative to
 * the clone's cwd; the template is resolved relative to this script (in the plugin).
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PAGE_DIR_REL = 'metacode/ui/ui_main_c/src/pages/home-page';
const PAGE_FILE = 'HomePage.tsx';
const MODULE_PATH = 'src/pages/home-page/HomePage.tsx';
const ROUTE = { path: '/home', module: MODULE_PATH, name: 'home_c' };

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templateFile = path.join(pluginRoot, 'templates/pages/home-page', PAGE_FILE);

const repoRoot = process.cwd();
const uiRoot = path.join(repoRoot, 'metacode/ui/ui_main_c');
const xconfigPath = path.join(uiRoot, 'xconfig.json');

function fail(message) {
    console.error(`scaffold-page: ${message}`);
    process.exit(1);
}

// 1. Write the page from the bundled template.
const pageDir = path.join(repoRoot, PAGE_DIR_REL);
mkdirSync(pageDir, { recursive: true });
copyFileSync(templateFile, path.join(pageDir, PAGE_FILE));
console.info(`scaffold-page: wrote ${PAGE_DIR_REL}/${PAGE_FILE}`);

// 2. Register the route in xconfig.json (idempotent).
let xconfig;
try {
    xconfig = JSON.parse(readFileSync(xconfigPath, 'utf8'));
} catch (err) {
    fail(`could not read ${xconfigPath}: ${err.message}`);
}

xconfig.routing = xconfig.routing || {};
if (!xconfig.routing['base-url-path-part']) {
    xconfig.routing['base-url-path-part'] = 'company-aspen';
}
const routes = Array.isArray(xconfig.routing.routes) ? xconfig.routing.routes : [];
if (routes.some((r) => r && r.name === ROUTE.name)) {
    console.info(`scaffold-page: route "${ROUTE.name}" already present; left xconfig.json unchanged.`);
} else {
    routes.push(ROUTE);
    xconfig.routing.routes = routes;
    writeFileSync(xconfigPath, JSON.stringify(xconfig, null, 4) + '\n');
    console.info(`scaffold-page: added route "${ROUTE.name}" (${ROUTE.path}) to xconfig.json`);
}

console.info('scaffold-page: done. Build/deploy with `npm run deploy`.');
