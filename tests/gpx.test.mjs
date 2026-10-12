import test from "node:test";
import assert from "node:assert/strict";
import gpx from "../gpx-core.js";

const point = (lng, options = {}) => ({ lat: 0, lng, elevation: null, time: null, recordedSpeedKmh: null, ...options });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.00001, actual + " ≠ " + expected);

test("distance uses coordinates and elapsed seconds, with elevation and grade", () => {
  const { stats, points } = gpx.analyzeSegments([[point(0, { time: 0, elevation: -5 }), point(.01, { time: 60000, elevation: 15 })]]);
  close(stats.distanceM, 1111.9492664455875);
  close(stats.avgSpeedKmh, 66.71695598673524);
  close(stats.movingSpeedKmh, stats.avgSpeedKmh);
  assert.equal(stats.durationS, 60);
  assert.equal(stats.ascentM, 20);
  assert.equal(stats.descentM, 0);
  assert.equal(stats.minElevationM, -5);
  close(points[1].gradePercent, 20 / stats.distanceM * 100);
});

test("separate track segments do not add connecting distance, time, or elevation", () => {
  const { stats, points } = gpx.analyzeSegments([
    [point(0, { time: 0, elevation: 0 }), point(.01, { time: 60000, elevation: 10 })],
    [point(10, { time: 3600000, elevation: 1000 }), point(10.01, { time: 3660000, elevation: 990 })]
  ]);
  close(stats.distanceM, 2223.8985328911513);
  assert.equal(stats.durationS, 120);
  assert.equal(stats.ascentM, 10);
  assert.equal(stats.descentM, 10);
  assert.equal(points[2].speedKmh, null);
  assert.equal(points[2].distanceM, points[1].distanceM);
  assert.equal(stats.segmentCount, 2);
});

test("missing times and elevations remain unavailable rather than zero", () => {
  const { stats } = gpx.analyzeSegments([[point(0), point(.01), point(.02)]]);
  for (const key of ["avgSpeedKmh", "maxSpeedKmh", "durationS", "movingS", "stoppedS", "minElevationM", "maxElevationM", "ascentM", "descentM"]) assert.equal(stats[key], null, key);
  assert.ok(stats.distanceM > 0);
});

test("zero altitude and stationary intervals are valid recordings", () => {
  const { stats } = gpx.analyzeSegments([[point(0, { time: 0, elevation: 0 }), point(0, { time: 60000, elevation: 0 })]]);
  assert.equal(stats.distanceM, 0);
  assert.equal(stats.avgSpeedKmh, 0);
  assert.equal(stats.maxSpeedKmh, 0);
  assert.equal(stats.stoppedS, 60);
  assert.equal(stats.movingS, 0);
  assert.equal(stats.minElevationM, 0);
  assert.equal(stats.ascentM, 0);
});

test("partial and reversed timestamps exclude only invalid intervals from averages", () => {
  const { stats, points } = gpx.analyzeSegments([[point(0, { time: 0 }), point(.01, { time: 60000 }),
    point(.02), point(.03, { time: 10000 }), point(.04, { time: 10000 }), point(.05, { time: 5000 })]]);
  assert.equal(stats.durationS, 60);
  close(stats.timedDistanceM, gpx.distance(points[0], points[1]));
  close(stats.avgSpeedKmh, gpx.distance(points[0], points[1]) / 60 * 3.6);
  assert.equal(stats.invalidTimes, 2);
  assert.equal(points[4].speedKmh, null);
});

test("missing elevation breaks ascent calculations and recorded speeds work without time", () => {
  const { stats, points } = gpx.analyzeSegments([[point(0, { elevation: 10, recordedSpeedKmh: 0 }), point(.01),
    point(.02, { elevation: 100, recordedSpeedKmh: 25 })]]);
  assert.equal(stats.ascentM, null);
  assert.equal(stats.descentM, null);
  assert.equal(stats.maxSpeedKmh, 25);
  assert.equal(stats.avgSpeedKmh, null);
  assert.equal(points[0].speedKmh, 0);
  assert.equal(points[2].gradePercent, null);
});

test("sensor averages and CSV preserve zero and missing values", () => {
  const data = gpx.analyzeSegments([[point(0, { time: 0, heartRate: 140, cadence: 0 }), point(.01, { heartRate: 160, cadence: 80 })]]);
  assert.equal(data.stats.avgHeartRate, 150);
  assert.equal(data.stats.avgCadence, 40);
  const csv = gpx.toCsv(data);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"1970-01-01T00:00:00.000Z"'));
  assert.equal(csv.includes('"null"'), false);
  assert.equal(csv.includes('"undefined"'), false);
  assert.equal(csv.split("\r\n").length, 3);
});

test("large supported recordings analyze without argument or stack overflow", () => {
  const data = gpx.analyzeSegments([Array.from({ length: gpx.MAX_POINTS }, (_, i) => point(i / 100000, { elevation: i % 200 }))]);
  assert.equal(data.stats.pointCount, 150000);
  assert.equal(data.stats.maxElevationM, 199);
  assert.ok(data.stats.distanceM > 0);
});