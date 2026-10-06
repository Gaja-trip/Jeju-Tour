import test from "node:test";
import assert from "node:assert/strict";
import core from "../live-location-core.js";
const { freshLocation, positionPayload, LocationPublisher } = core;
const now = Date.now();
const gps = (latitude = 33.5, timestamp = now) => ({ timestamp, coords: { latitude, longitude: 126.5, accuracy: 10 } });
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("only valid and recent coordinates are accepted", () => {
  assert.equal(positionPayload(gps(), now).p_latitude, 33.5);
  assert.equal(positionPayload(gps(91), now), null);
  assert.equal(positionPayload(gps(NaN), now), null);
  assert.equal(positionPayload(gps(33.5, now + 30001), now), null);
  assert.equal(positionPayload(gps(33.5, now - 120001), now), null);
});
test("stopped or stale positions cannot appear as live markers", () => {
  const row = { sharing: true, latitude: 33.5, longitude: 126.5, updated_at: new Date(now).toISOString() };
  assert.equal(freshLocation(row, now), true);
  assert.equal(freshLocation({ ...row, sharing: false }, now), false);
  assert.equal(freshLocation({ ...row, latitude: null }, now), false);
  assert.equal(freshLocation({ ...row, latitude: 100 }, now), false);
  assert.equal(freshLocation(row, now + 120001), false);
});
test("publishing serializes requests and retains newest pending GPS", async () => {
  let release;
  const calls = [];
  const publisher = new LocationPublisher({ tripId: "test", now: () => now, interval: 0,
    rpc: (_name, args) => { calls.push(args); return calls.length === 1 ? new Promise((resolve) => { release = resolve; }) : Promise.resolve({ data: true }); } });
  publisher.activate("session-a"); publisher.enqueue(gps()); await tick();
  publisher.enqueue(gps(33.6, now + 1)); publisher.enqueue(gps(33.7, now + 2));
  assert.equal(calls.length, 1);
  release({ data: true }); await tick();
  assert.equal(calls.length, 2); assert.equal(calls[1].p_latitude, 33.7);
  publisher.cancel();
});
test("stop cancels pending GPS and ignores late responses", async () => {
  let release;
  const calls = [], results = [];
  const publisher = new LocationPublisher({ tripId: "test", now: () => now, interval: 0,
    onResult: (result) => results.push(result), rpc: (name) => { calls.push(name);
      return name === "jeju_publish_location" ? new Promise((resolve) => { release = resolve; }) : Promise.resolve({}); } });
  publisher.activate("session-a"); publisher.enqueue(gps()); await tick();
  publisher.enqueue(gps(33.6, now + 1)); await publisher.stop();
  release({ data: true }); await tick();
  assert.deepEqual(calls, ["jeju_publish_location", "jeju_stop_sharing"]);
  assert.equal(results.length, 0);
});
test("a failed publish does not leave the queue stuck", async () => {
  let count = 0;
  const publisher = new LocationPublisher({ tripId: "test", now: () => now, interval: 0,
    rpc: async () => { if (++count === 1) throw new Error("offline"); return { data: true }; } });
  publisher.activate("session-a"); publisher.enqueue(gps()); await tick();
  publisher.enqueue(gps(33.6, now + 1)); await tick();
  assert.equal(count, 2); publisher.cancel();
});
