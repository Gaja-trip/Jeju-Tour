import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
globalThis.JejuGpxCore = require("../gpx-core.js");
const { recordsNear } = require("../route-journal.js");
const point = { lat: 33.55698, lng: 126.8015016 };
const record = (id, day = "day3", lat = point.lat, lng = point.lng) => ({ id, day, latitude: lat, longitude: lng, photos: [{ url: "/api/route-photos/" + id }] });
test("a stop gallery uses only records from its day and nearby physical location", () => {
  const entries = [record("at-stop"), record("nearby", "day3", point.lat + .00027), record("other-day", "day4"), record("far-away", "day3", point.lat + .0007)];
  assert.deepEqual(recordsNear(entries, "day3", point).map((item) => item.id), ["at-stop", "nearby"]);
});
test("the 50 m gallery boundary uses geographic distance and honors an explicit radius", () => {
  const entries = [record("inside", "day3", point.lat + .00044), record("outside", "day3", point.lat + .00046)];
  assert.deepEqual(recordsNear(entries, "day3", point).map((item) => item.id), ["inside"]);
  assert.deepEqual(recordsNear(entries, "day3", point, 0), []);
});
test("malformed coordinates and incomplete server records cannot appear in a stop gallery", () => {
  const entries = [record("valid"), record("invalid-lat", "day3", 95), record("invalid-lng", "day3", point.lat, NaN), { ...record("no-photos"), photos: null }, null];
  assert.deepEqual(recordsNear(entries, "day3", point).map((item) => item.id), ["valid"]);
  for (const p of [null, {lat:95,lng:126}, {lat:33,lng:190}, {lat:NaN,lng:126}]) assert.deepEqual(recordsNear(entries, "day3", p), []);
  assert.deepEqual(recordsNear(entries, "day5", point), []);
  assert.deepEqual(recordsNear(entries, "day3", point, -1), []);
});