// The skills teach REST operations the hosted server runs. A mistyped path in a skill is a
// failed call in front of a customer, and nothing else here would notice, so every path a
// skill names is checked against the operations the server listed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(root, 'skills');
const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => ({ dir: e.name, text: readFileSync(join(skillsDir, e.name, 'SKILL.md'), 'utf8') }));
const agents = readdirSync(join(root, 'agents'))
  .map((name) => ({ dir: `agents/${name}`, text: readFileSync(join(root, 'agents', name), 'utf8') }));

// `summarize_api` on a live instance, 2026-10-07. Refresh it when the server's catalog moves.
const OPERATIONS = `
POST /crm/contact/duplicates/search
POST /crm/contact/roles/for-record
POST /crm/merge/contact_p
POST /crm/miner-sync/batch
POST /crm/unmerge/contact_p
POST /data/activity-feed
POST /data/activity-feed/count
POST /data/activity-feed/engaged-contacts
POST /data/audit/count
POST /data/audit/query
POST /data/count
POST /data/files
GET /data/files/{file_id}
GET /data/instant-search
POST /data/instant-search
POST /data/query
POST /data/search
POST /data/search/account_p
POST /data/search/case_p
POST /data/search/contact_p
POST /data/search/lead_p
POST /data/search/opportunity_p
POST /data/search/team_p
DELETE /data/{object_name}
PATCH /data/{object_name}
POST /data/{object_name}
POST /describe/config_p
GET /describe/me
POST /describe/layout_p
POST /describe/lifecycle_p.state_p
POST /describe/list_view_p
POST /describe/object_p
POST /describe/picklist_p
POST /describe/record/layout_p
POST /describe/record/object_p
POST /describe/tab_collection_p
POST /describe/tab_p
`.trim().split('\n').map((line) => {
  const [method, path] = line.split(' ');
  return { method, segments: path.split('/').slice(1) };
});
for (const component of ['codefile_p', 'config_p', 'config_var_p', 'field_p', 'layout_p', 'lifecycle_p',
  'list_view_p', 'object_p', 'object_type_p', 'permission_set_p', 'picklist_filter_p', 'picklist_p',
  'queue_p', 'search_config_p', 'security_profile_p', 'state_type_p', 'tab_collection_p', 'tab_p']) {
  OPERATIONS.push({ method: 'POST', segments: ['describe', 'identifiers', component] });
}

const served = (path) => {
  const segments = path.split('/').slice(1);
  return OPERATIONS.some((op) => op.segments.length === segments.length
    && op.segments.every((s, i) => s === segments[i] || (/^\{.+\}$/.test(s) && /^(<.+>|[a-z0-9_]+)$/.test(segments[i]))));
};

test('every skill declares its own name and a description a host will load', () => {
  for (const { dir, text } of skills) {
    const front = /^---\nname: ([\w-]+)\ndescription: (.+)\n---\n/.exec(text);
    assert.ok(front, `${dir}: frontmatter`);
    assert.equal(front[1], dir);
    assert.ok(front[2].length <= 1024, `${dir}: description is ${front[2].length} chars`);
  }
});

test('every API path a skill names is one the hosted server runs', () => {
  for (const { dir, text } of [...skills, ...agents]) {
    const paths = [...text.matchAll(/\/api\/v24\.3(\/[A-Za-z0-9_.{}<>\/-]+)/g)].map((m) => m[1].replace(/[.]$/, ''));
    for (const path of paths) assert.ok(served(path), `${dir}: ${path} is not a served operation`);
  }
});

test('no skill teaches the retired runtime MCP', () => {
  // The aspen_* tools, their confirmed=true gate, fix_hint and app_url belonged to the
  // retired .mcpb server. Naming them here would send the model after tools it doesn't have.
  const retired = /\baspen_(describe|get_picklist|list|get|search|related|report|query|records_\w+|files_upload)\b|confirmed\s*[=:]\s*true|fix_hint|app_url|CONFIRMATION_REQUIRED|\.mcpb\b/;
  for (const { dir, text } of [...skills, ...agents]) {
    const hit = retired.exec(text);
    assert.equal(hit, null, `${dir} names ${hit?.[0]}`);
  }
});

test('the router routes to every other skill', () => {
  const router = skills.find((s) => s.dir === 'using-aspencrm-ai').text;
  for (const { dir } of skills) {
    if (dir === 'using-aspencrm-ai') continue;
    assert.match(router, new RegExp('`' + dir + '`'), `the router never names ${dir}`);
  }
});
