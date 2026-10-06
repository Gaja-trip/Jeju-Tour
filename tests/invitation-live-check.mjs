// Explicit integration check; never consumes real participant invitations or GPS.
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import vm from "node:vm";
const { createClient } = createRequire(import.meta.url)("../.test-output/invite-tools/node_modules/@supabase/supabase-js");
const context = { window: {} };
vm.runInNewContext(await readFile(new URL("../live-location-config.js", import.meta.url), "utf8"), context);
const config = context.window.JEJU_LIVE_CONFIG;
const file = ".private/invite-integration-fixture.json";
const hash = (token) => createHash("sha256").update(token).digest("hex");
const client = () => createClient(config.supabaseUrl, config.publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) }) }
});
if (process.argv.includes("--prepare")) {
  try { await readFile(file); throw new Error("Existing test fixture must be cleaned before preparing another."); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const fixture = { tripId: "invite-check-" + randomBytes(8).toString("hex"), tokens: [randomBytes(32).toString("base64url"), randomBytes(32).toString("base64url")], sessions: [] };
  await mkdir(".private", { recursive: true });
  for (let i = 0; i < 2; i++) {
    const c = client();
    const result = await c.auth.signInAnonymously({ options: { data: { jeju_integration_test: fixture.tripId } } });
    assert.equal(result.error, null);
    fixture.sessions.push(result.data.session);
    await writeFile(file, JSON.stringify(fixture), { mode: 0o600 });
  }
  console.log(`insert into jeju_private.trip_access(trip_id,password_hash,invitation_only) values('${fixture.tripId}', 'unused', true);\ninsert into jeju_private.participant_invitations(trip_id,slot,token_hash,expires_at) values\n('${fixture.tripId}',1,'${hash(fixture.tokens[0])}',now()+interval '1 hour'),\n('${fixture.tripId}',2,'${hash(fixture.tokens[1])}',now()+interval '1 hour');`);
} else if (process.argv.includes("--cleanup-sql")) {
  const f = JSON.parse(await readFile(file, "utf8"));
  assert.match(f.tripId, /^invite-check-[a-f0-9]{16}$/);
  const ids = f.sessions.map(s => { assert.match(s.user.id, /^[a-f0-9-]{36}$/); return `'${s.user.id}'`; }).join(",");
  console.log(`begin;\ndelete from public.jeju_live_locations where trip_id='${f.tripId}';\ndelete from public.jeju_participants where trip_id='${f.tripId}';\ndelete from jeju_private.participant_invitations where trip_id='${f.tripId}';\ndelete from jeju_private.trip_access where trip_id='${f.tripId}';\ndelete from auth.users where id in (${ids}) and is_anonymous and raw_user_meta_data->>'jeju_integration_test'='${f.tripId}';\ncommit;`);
} else if (process.argv.includes("--check")) {
  const f = JSON.parse(await readFile(file, "utf8"));
  const clients = [client(), client()];
  let channel;
  const rpc = async (c, name, args) => { const r = await c.rpc(name, { p_trip_id: f.tripId, ...args }); assert.equal(r.error, null); return r.data; };
  try {
    for (let i = 0; i < 2; i++) {
      const result = await clients[i].auth.setSession(f.sessions[i]); assert.equal(result.error, null);
      const read = await clients[i].from("jeju_live_locations").select("user_id").eq("trip_id", f.tripId);
      assert.equal(read.error, null); assert.equal(read.data.length, 0);
    }
    const claims = await Promise.all(clients.map((c, i) => rpc(c, "jeju_claim_invitation", { p_token: f.tokens[0], p_name: `Integration ${i + 1}` })));
    assert.equal(claims.filter(r => r.ok).length, 1, "concurrent claim must have exactly one winner");
    assert.equal(claims.find(r => !r.ok).reason, "already_used");
    const winner = claims[0].ok ? 0 : 1, other = 1 - winner;
    assert.equal((await rpc(clients[other], "jeju_claim_invitation", { p_token: f.tokens[1], p_name: `Integration ${other + 1}` })).ok, true);
    let received;
    const notification = new Promise(resolve => { received = resolve; });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Realtime subscription timed out")), 25000);
      channel = clients[other].channel("invite-check-realtime")
        .on("system", {}, payload => {
          if (payload.extension === "postgres_changes" && payload.status === "ok") { clearTimeout(timer); resolve(); }
          else if (payload.status === "error") { clearTimeout(timer); reject(new Error("Postgres subscription failed")); }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "jeju_live_locations", filter: `trip_id=eq.${f.tripId}` }, () => received(true))
        .subscribe(state => { if (state === "CHANNEL_ERROR") { clearTimeout(timer); reject(new Error("Realtime connection failed")); } });
    });
    const share = await rpc(clients[winner], "jeju_start_sharing");
    assert.equal(await rpc(clients[winner], "jeju_publish_location", { p_share_id: share, p_latitude: 33.5, p_longitude: 126.5, p_accuracy: 10, p_recorded_at: new Date().toISOString() }), true);
    const realtimeTimeout = new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error("Realtime update timed out")), 25000); timer.unref(); });
    await Promise.race([notification, realtimeTimeout]);
    const read = await clients[other].from("jeju_live_locations").select("user_id,latitude,longitude").eq("trip_id", f.tripId);
    assert.equal(read.error, null); assert.equal(read.data[0].latitude, 33.5);
    assert.equal(await rpc(clients[other], "jeju_publish_location", { p_share_id: share, p_latitude: 34, p_longitude: 127, p_accuracy: 10, p_recorded_at: new Date().toISOString() }), false);
    await rpc(clients[winner], "jeju_stop_sharing", { p_share_id: share });
    const stopped = await clients[other].from("jeju_live_locations").select("latitude,sharing").eq("trip_id", f.tripId);
    assert.equal(stopped.data[0].latitude, null); assert.equal(stopped.data[0].sharing, false);
    await rpc(clients[other], "jeju_leave_trip");
    assert.equal((await rpc(clients[other], "jeju_invitation_status")).ok, false);
    const denied = await clients[other].from("jeju_live_locations").select("user_id").eq("trip_id", f.tripId);
    assert.equal(denied.data.length, 0, "old JWT cannot read after revocation");
    console.log("PASS: two anonymous devices, concurrent single-use claim, Realtime, own-only publishing, stop and old-JWT revocation.");
  } finally {
    if (channel) await clients[0].removeAllChannels();
    await clients[1].removeAllChannels();
    for (const c of clients) {
      await c.auth.signOut({ scope: "global" });
      await c.realtime.disconnect();
    }
  }
} else throw new Error("Use --prepare, --check or --cleanup-sql.");
