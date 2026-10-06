import assert from "node:assert/strict";

const base = process.env.JEJU_SITE_URL || "https://jeju-gaja.vercel.app";
async function get(path) {
  return fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) });
}
const page = await get("/course.html?panel=participants");
assert.equal(page.status, 200);
assert.match(await page.text(), /data-panel-view="participants"/);
assert.match(page.headers.get("permissions-policy") || "", /geolocation=\(self\)/);
const config = await get("/live-location-config.js");
const source = await config.text();
assert.equal(config.status, 200);
assert.match(source, /rcsbfdnzxlihxngytwfa\.supabase\.co/);
assert.match(source, /sb_publishable_/);
assert.match(source, /authMode:\s*"invite"/);
assert.doesNotMatch(source, /sb_secret_|service_role|tamna/);
for (const path of ["/live-location-core.js", "/live-location.js", "/invitation-core.js", "/my-location.js", "/assets/icons/locate-fixed.svg", "/assets/notices/jeju-riding-gathering-guide.png"]) {
  assert.equal((await get(path)).status, 200, path);
}
for (const path of ["/supabase/README.md", "/supabase/migrations/20261006124303_jeju_participant_live_locations.sql", "/server/config.json", "/.env.local", "/.private/manifest.json", "/scripts/create-invitations.mjs"]) {
  assert.equal((await get(path)).status, 404, "Private source must not be served: " + path);
}
console.log("PASS: production location screen, public configuration, GPS policy and preserved notice image.");
console.log("PASS: database source, server configuration and credentials are not public assets.");
