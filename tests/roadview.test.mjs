import test from "node:test";
import assert from "node:assert/strict";
import gpx from "../gpx-core.js";
import roadview from "../roadview.js";

const point = (lng, time, extra = {}) => ({ lat: 0, lng, time, elevation: null, recordedSpeedKmh: null, ...extra });
const analyze = (...segments) => gpx.analyzeSegments(segments);
const stationary = (duration, offset = 0) => Array.from({ length: duration / 30 + 1 }, (_, i) => point(offset + i % 2 * .00002, i * 30000));

test("sustained nearby positions yield duration and a recorded representative point", () => {
  const data = analyze(stationary(600));
  const [stop] = gpx.detectStops(data);
  assert.equal(stop.durationS, 600);
  assert.equal(stop.startIndex, 0);
  assert.equal(stop.endIndex, 20);
  assert.equal(stop.sampleCount, 21);
  assert.equal(stop.hasRecordingGap, false);
  assert.ok(stop.index >= stop.startIndex && stop.index <= stop.endIndex);
  assert.equal(gpx.detectStops(data, { minDurationS: 601 }).length, 0);
});

test("slow travel cannot be interpreted as one long stop merely from low speed", () => {
  const points = Array.from({ length: 31 }, (_, i) => point(i * .0001, i * 60000));
  assert.ok(analyze(points).stats.avgSpeedKmh < 1);
  assert.equal(gpx.detectStops(analyze(points)).length, 0);
});

test("a long sample gap at the same location is a candidate with explicit uncertainty", () => {
  const [stop] = gpx.detectStops(analyze([point(0, 0), point(.00003, 1800000)]));
  assert.equal(stop.durationS, 1800);
  assert.equal(stop.maxGapS, 1800);
  assert.equal(stop.hasRecordingGap, true);
});

test("a long recording gap with distant endpoints does not create a stop", () => {
  assert.equal(gpx.detectStops(analyze([point(0, 0), point(.01, 3600000)])).length, 0);
});

test("separate segments, missing timestamps and reversed time break stop continuity", () => {
  assert.equal(gpx.detectStops(analyze([point(0, 0), point(0, 180000)], [point(0, 240000), point(0, 420000)])).length, 0);
  assert.equal(gpx.detectStops(analyze([point(0, 0), point(0, 180000), point(0, null), point(0, 300000), point(0, 480000)])).length, 0);
  assert.equal(gpx.detectStops(analyze([point(0, 0), point(0, 180000), point(0, 120000), point(0, 300000)])).length, 0);
});

test("duplicate time does not join incomplete stationary periods", () => {
  assert.equal(gpx.detectStops(analyze([point(0, 0), point(0, 180000), point(0, 180000), point(0, 360000)])).length, 0);
});

test("a single point or missing time cannot yield an invented rest", () => {
  assert.equal(gpx.detectStops(analyze([point(0, 0)])).length, 0);
  assert.equal(gpx.detectStops(analyze([point(0, null), point(0, null)])).length, 0);
});

test("multiple stops preserve source indices and independent durations", () => {
  const a = stationary(300), b = stationary(600, .1).map((p) => ({ ...p, time: p.time + 900000 }));
  const data = analyze([...a, ...b]), stops = gpx.detectStops(data);
  assert.deepEqual(stops.map((p) => p.durationS), [300, 600]);
  assert.deepEqual(stops.map((p) => p.number), [1, 2]);
  assert.equal(stops[1].startIndex, a.length);
  assert.throws(() => gpx.detectStops(data, { radiusM: 0 }));
});

test("official roadview link preserves latitude and longitude and rejects invalid coordinates", () => {
  assert.equal(roadview.linkUrl({ lat: 33.4970366, lng: 126.4519783 }), "https://map.kakao.com/link/roadview/33.4970366,126.4519783");
  assert.equal(roadview.linkUrl({ lat: 91, lng: 126 }), "");
  assert.equal(roadview.linkUrl({ lat: "33", lng: 126 }), "");
  assert.equal(roadview.linkUrl(null), "");
  assert.equal(roadview.linkUrl({ lat: 33, lng: NaN }), "");
});

test("view direction faces the selected GPS coordinate from the panorama position", () => {
  assert.equal(roadview.bearing({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }), 90);
  assert.equal(roadview.bearing({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }), 0);
  assert.equal(roadview.bearing({ lat: 0, lng: 0 }, { lat: 0, lng: -1 }), 270);
});
