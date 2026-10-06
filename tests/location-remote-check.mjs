import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const context = { window: {} };
vm.runInNewContext(await readFile(new URL("../live-location-config.js", import.meta.url), "utf8"), context);
const config = context.window.JEJU_LIVE_CONFIG;
assert.ok(config.publishableKey.startsWith("sb_publishable_"), "Use a public publishable key");

async function request(path, options = {}) {
  const response = await fetch(new URL(path, config.supabaseUrl), {
    ...options,
    headers: { apikey: config.publishableKey, "Content-Type": "application/json",
      Origin: "https://jeju-gaja.vercel.app", ...options.headers },
    signal: AbortSignal.timeout(15000)
  });
  return { response, data: await response.json() };
}

const settings = await request("/auth/v1/settings");
assert.equal(settings.response.status, 200, "Project and public key must be reachable");
if (config.authMode === "invite") {
  assert.equal(settings.data.external?.anonymous_users, true, "Invitation device login must be enabled");
  console.log("PASS: project/public key reachable, invitation device login enabled.");
} else {
  assert.equal(settings.data.external?.email, true, "Email authentication must be enabled");
  console.log("PASS: project/public key reachable, email provider enabled (delivery not tested).");
}

for (const table of ["jeju_participants", "jeju_live_locations"]) {
  const { response, data } = await request(`/rest/v1/${table}?select=*&limit=1`);
  assert.ok([401, 403].includes(response.status), `${table}: anonymous read must be denied`);
  assert.equal(data.code, "42501", `${table}: must be a permission denial, not a missing table`);
  console.log(`PASS: anonymous read denied for ${table}.`);
}

const rpc = await request("/rest/v1/rpc/jeju_start_sharing", {
  method: "POST", body: JSON.stringify({ p_trip_id: config.tripId })
});
assert.ok([401, 403].includes(rpc.response.status), "Anonymous location writes must be denied");
assert.equal(rpc.data.code, "42501", "RPC must exist but deny anonymous execution");
console.log("PASS: anonymous sharing denied. No accounts, emails or locations were created.");
