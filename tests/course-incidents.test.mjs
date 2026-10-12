import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import gpx from "../gpx-core.js";
import incidents from "../course-incidents.js";

const point = (lng, time, speed = null) => ({ lat: 0, lng, time, recordedSpeedKmh: speed, elevation: null });
test("confirmed incident 1 uses the CU-front GPS coordinate rather than the parcel centroid", () => {
  const [first, second] = incidents.locations;
  assert.equal(first.lat, 33.4970366);
  assert.equal(first.lng, 126.4519783);
  assert.ok(gpx.distance(first, first.addressPosition) > 200);
  assert.equal(first.address, "제주시 이호일동 1962번지");
  assert.equal(second.address, "제주시 한림읍 귀덕리 3025-4번지");
  assert.deepEqual(incidents.locations.map(p => p.number), [1, 2]);
});

test("the related stop prefers a stationary source sample over a closer moving approach", () => {
  const data = gpx.analyzeSegments([[point(0, 0, 15), point(.00002, 1000, 10),
    point(.00005, 301000, 0), point(.00007, 302000, 0), point(.01, 303000, 30)]]);
  const match = incidents.match(data, { lat: 0, lng: 0 });
  assert.equal(match.point.index, 2);
  assert.equal(match.point.speedKmh, 0);
  assert.equal(match.stop.durationS, 302);
  assert.ok(match.offsetM < 10);
});

test("a nearby passing track remains a passing track when no stop was recorded", () => {
  const data = gpx.analyzeSegments([[point(0, 0), point(.001, 60000)]]);
  const match = incidents.match(data, { lat: 0, lng: .00001 });
  assert.equal(match.point.index, 0);
  assert.equal(match.stop, null);
});

test("missing time does not invent a stop and distant replacement tracks cannot be linked", () => {
  const data = gpx.analyzeSegments([[point(0, null), point(.001, null)]]);
  assert.equal(incidents.match(data, { lat: 0, lng: 0 }).stop, null);
  assert.equal(incidents.match(data, { lat: 33, lng: 126 }), null);
  assert.equal(incidents.match(null, incidents.locations[0]), null);
  assert.equal(incidents.match(data, { lat: NaN, lng: 0 }), null);
});

test("split segments cannot create an accident stop across a recording gap", () => {
  const data = gpx.analyzeSegments([[point(0, 0), point(0, 1000)], [point(0, 3600000), point(0, 3601000)]]);
  assert.equal(incidents.match(data, { lat: 0, lng: 0 }).stop, null);
});

test("the actual day 1 recording links both numbered incidents to stopped samples", () => {
  const xml = readFileSync(new URL("../assets/gpx/day1-jeju-kai.gpx", import.meta.url), "utf8");
  const raw = Array.from(xml.matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)">([\s\S]*?)<\/trkpt>/g),
    m => ({ lat: +m[1], lng: +m[2], time: Date.parse(m[3].match(/<time>([^<]+)</)[1]), elevation: null, recordedSpeedKmh: null }));
  const data = gpx.analyzeSegments([raw]), [first, second] = incidents.locations.map(p => incidents.match(data, p));
  assert.equal(first.point.index, 3482);
  assert.equal(first.point.elapsedS, 8237);
  assert.equal(first.stop.durationS, 1462);
  assert.equal(second.stop.startIndex, 8184);
  assert.equal(second.stop.durationS, 993);
  for (const related of [first, second]) {
    assert.ok(related.point.speedKmh <= 1);
    assert.ok(related.offsetM < 80);
    assert.equal(related.stop.hasRecordingGap, true);
  }
});
