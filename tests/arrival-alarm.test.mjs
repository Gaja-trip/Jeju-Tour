import test from "node:test";
import assert from "node:assert/strict";
import arrival from "../arrival-alarm.js";

const origin = { lat: 33.5, lng: 126.5, name: "별표 지점", key: "day1|star" };
const moved = (meters) => ({ ...origin, lat: origin.lat + meters / 6371000 * 180 / Math.PI });
function fixture() {
  let time = 100000, targets = [origin], accepted = true;
  const arrivals = [], quality = [];
  const monitor = arrival.createMonitor({ getTargets: () => targets, now: () => time,
    onArrival(points) { if (accepted) arrivals.push(points); return accepted; },
    onQuality(...args) { quality.push(args); }
  });
  return { arrivals, quality,
    targets(value) { targets = value; }, accept(value) { accepted = value; },
    advance(ms) { time += ms; },
    fix(meters, options = {}) {
      time += 1000;
      monitor.update({ timestamp: time, coords: { latitude: moved(meters).lat,
        longitude: origin.lng, accuracy: 5 }, ...options });
    }
  };
}

test("10m radius uses geographic distance, not the GPS uncertainty circle", () => {
  assert.ok(Math.abs(arrival.distanceMeters(origin, moved(10)) - 10) < .000001);
  const f = fixture();
  f.fix(11); assert.equal(f.arrivals.length, 0);
  f.fix(9.99); assert.equal(f.arrivals.length, 1);
});
test("remaining at the point and 9m/11m jitter do not repeat the alarm", () => {
  const f = fixture();
  for (const meters of [9, 0, 11, 9, 12, 8, 0]) f.fix(meters);
  assert.equal(f.arrivals.length, 1);
});
test("re-entry requires 30s and two accurate fixes safely outside 30m", () => {
  const f = fixture(); f.fix(0); f.fix(45); f.fix(45); f.fix(0);
  assert.equal(f.arrivals.length, 1);
  f.advance(30000); f.fix(34); f.fix(34); f.fix(0);
  assert.equal(f.arrivals.length, 1);
  f.fix(45); f.fix(0); f.fix(45); f.fix(45); f.fix(0);
  assert.equal(f.arrivals.length, 2);
});
test("inaccurate, stale, future, invalid and duplicate fixes never cause an arrival", () => {
  const f = fixture();
  f.fix(0, { coords: { latitude: origin.lat, longitude: origin.lng, accuracy: 16 } });
  f.fix(0, { timestamp: 10000 });
  f.fix(0, { timestamp: 150000 });
  f.fix(0, { coords: { latitude: 100, longitude: origin.lng, accuracy: 5 } });
  f.fix(0, { coords: { latitude: origin.lat, longitude: origin.lng, accuracy: NaN } });
  assert.equal(f.arrivals.length, 0);
  assert.deepEqual(f.quality, [[false, 16]]);
  f.fix(0); assert.equal(f.arrivals.length, 1);
});

test("15m GPS accuracy is accepted without expanding the 10m arrival radius", () => {
  assert.equal(arrival.MAX_ACCURACY_M, 15);
  assert.equal(arrival.RADIUS_M, 10);
  const f = fixture();
  const coords = { latitude: origin.lat, longitude: origin.lng, accuracy: 15.01 };
  f.fix(0, { coords }); assert.equal(f.arrivals.length, 0);
  f.fix(11, { coords: { ...coords, latitude: moved(11).lat, accuracy: 15 } });
  assert.equal(f.arrivals.length, 0);
  f.fix(0, { coords: { ...coords, accuracy: 15 } });
  assert.equal(f.arrivals.length, 1);
  assert.deepEqual(f.quality, [[false, 15.01], [true, 15], [true, 15]]);
});
test("co-located targets share one signal and refused playback is retried", () => {
  const f = fixture(); f.targets([origin, { ...origin, name: "도착지", key: "end" }]);
  f.accept(false); f.fix(0); assert.equal(f.arrivals.length, 0);
  f.accept(true); f.fix(0); assert.equal(f.arrivals.length, 1);
  assert.equal(f.arrivals[0].length, 2);
  f.fix(0); assert.equal(f.arrivals.length, 1);
});
test("changing the day or saved coordinates updates live targets without reviving an old visit", () => {
  const f = fixture(); f.fix(0);
  f.targets([{ ...origin, key: "day2|start" }]); f.fix(0);
  assert.equal(f.arrivals.length, 2);
  f.targets([origin]); f.fix(0); assert.equal(f.arrivals.length, 2);
  f.targets([{ ...moved(80), key: "day1|new" }]); f.fix(80);
  assert.equal(f.arrivals.length, 3);
});
test("default star points and start/finish are selected by day", () => {
  const routes = { day1: { points: [origin, moved(50), moved(100)] }, day2: { points: [moved(200)] } };
  const points = arrival.targetsForDay({ routes, plan: {}, dayId: "day1" });
  assert.equal(points.length, 3);
  assert.ok(points.every((p) => p.dayId === "day1"));
});
test("saved accommodation coordinates take priority over GPX-snapped coordinates", () => {
  const routes = { day1: { points: [moved(400)] } };
  const plan = { day1: { mapRoute: true, startName: "숙소 출발", endName: "항구 도착",
    startPoint: { ...moved(800), actualLat: origin.lat, actualLng: origin.lng },
    endPoint: moved(100), waypoints: [moved(800), { ...moved(20), name: "주 경로 접속(숙소)" },
      { ...moved(50), name: "관광지" }, moved(100)] } };
  const targets = arrival.targetsForDay({ routes, plan, dayId: "day1" });
  assert.equal(targets.length, 3);
  assert.equal(targets[0].lat, origin.lat);
  assert.equal(targets[0].name, "숙소 출발");
  assert.equal(targets[1].name, "관광지");
  assert.equal(targets[2].name, "항구 도착");
});
test("invalid targets are removed and identical start/end coordinates are deduplicated", () => {
  const targets = arrival.targetsForDay({ routes: { day1: { points: [origin, origin, { lat: NaN, lng: 0 }] } },
    plan: {}, dayId: "day1" });
  assert.equal(targets.length, 1);
});

function audioFixture() {
  const nodes = [], changes = [], contexts = [];
  class AudioContext {
    state = "suspended"; currentTime = 10; destination = {};
    constructor() { contexts.push(this); }
    async resume() { this.state = "running"; }
    async close() { this.state = "closed"; }
    createOscillator() {
      const node = { starts: [], stops: [], disconnects: 0, frequency: { setValueAtTime() {} },
        connect() {}, disconnect() { this.disconnects++; },
        start(at) { this.starts.push(at); }, stop(at) { this.stops.push(at); } };
      nodes.push(node); return node;
    }
    createGain() { return { connect() {}, disconnect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {} } }; }
  }
  let unavailable = 0;
  const beeper = arrival.createBeeper({ AudioContext, onPlaying: (playing) => changes.push(playing),
    onUnavailable: () => unavailable++ });
  return { beeper, nodes, changes, contexts, unavailable: () => unavailable };
}
test("audio is not created before opt-in and schedules exactly three finite tones", async () => {
  const f = audioFixture(); assert.equal(f.contexts.length, 0);
  await f.beeper.unlock(); assert.equal(f.beeper.play(), true);
  assert.equal(f.nodes.length, 3);
  for (const node of f.nodes) {
    assert.equal(node.starts.length, 1); assert.equal(node.stops.length, 1);
    assert.ok(Math.abs(node.stops[0] - node.starts[0] - .23) < .000001);
  }
  assert.equal(f.beeper.play(), false); assert.equal(f.nodes.length, 3);
  for (const node of f.nodes) node.onended();
  assert.equal(f.changes.at(-1), false);
  assert.ok(f.nodes.every((node) => node.disconnects === 1));
  f.beeper.release(); assert.equal(f.contexts[0].state, "closed");
});
test("switch-off cancels all scheduled tones and interruption never reports successful playback", async () => {
  const f = audioFixture(); await f.beeper.unlock(); f.beeper.play();
  f.beeper.stop();
  assert.ok(f.nodes.every((node) => node.stops.length === 2 && node.onended === null));
  f.contexts[0].state = "interrupted";
  assert.equal(f.beeper.play(), false); assert.equal(f.unavailable(), 1);
  f.beeper.release();
});

test("OS audio interruption cancels scheduled tones and reports the bell unavailable immediately", async () => {
  const f = audioFixture(); await f.beeper.unlock(); f.beeper.play();
  f.contexts[0].state = "interrupted"; f.contexts[0].onstatechange();
  assert.equal(f.unavailable(), 1);
  assert.ok(f.nodes.every((node) => node.stops.length === 2 && node.onended === null));
  f.beeper.release();
  f.contexts[0].onstatechange();
  assert.equal(f.unavailable(), 1);
});

function controllerFixture(overrides = {}) {
  const states = [], messages = [], calls = [];
  let callbacks, visible = true;
  const controller = arrival.createController({ getTargets: () => [origin], now: () => 100000,
    onEnable: () => calls.push("gps"), onState: (state) => states.push(state),
    onMessage: (message) => messages.push(message), isVisible: () => visible,
    beeperFactory(config) { callbacks = config; return {
      async unlock() { calls.push("unlock"); },
      play() { calls.push("play"); config.onPlaying(true); return true; },
      stop() { calls.push("stop"); config.onPlaying(false); },
      release() { calls.push("release"); config.onPlaying(false); }
    }; }, ...overrides });
  const position = { timestamp: 100000, coords: { latitude: origin.lat, longitude: origin.lng, accuracy: 5 } };
  return { controller, states, messages, calls, callbacks: () => callbacks,
    visible(value) { visible = value; }, fix(options = {}) { controller.update({ ...position, ...options }); } };
}
test("bell opt-in unlocks sound before GPS and switch-off prevents later arrival callbacks", async () => {
  const f = controllerFixture(); f.fix(); assert.deepEqual(f.calls, []);
  await f.controller.start(); assert.deepEqual(f.calls, ["unlock", "gps"]);
  f.fix(); assert.equal(f.calls.at(-1), "play");
  f.controller.stop(); f.fix({ timestamp: 100001 });
  assert.equal(f.calls.filter((call) => call === "play").length, 1);
  assert.equal(f.states.at(-1).enabled, false);
});
test("background fixes cannot sound and hiding the page cancels pending tones", async () => {
  const f = controllerFixture(); await f.controller.start();
  f.visible(false); f.fix(); assert.ok(!f.calls.includes("play"));
  f.controller.pause(); assert.equal(f.calls.at(-1), "stop");
  f.visible(true); f.fix(); assert.equal(f.calls.at(-1), "play");
  f.controller.stop();
});
test("sound failure disarms the bell instead of silently leaving it enabled", async () => {
  const f = controllerFixture(); await f.controller.start();
  f.callbacks().onUnavailable();
  assert.equal(f.states.at(-1).enabled, false);
  assert.match(f.messages.at(-1), /종 아이콘/);
});
test("cancelling an in-flight sound unlock cannot enable GPS later", async () => {
  let resume;
  const calls = [];
  const f = controllerFixture({ beeperFactory: () => ({ unlock: () => new Promise((resolve) => { resume = resolve; }),
    release() {}, stop() {} }), onEnable: () => calls.push("gps") });
  const start = f.controller.start(); f.controller.stop(); resume(); await start;
  assert.deepEqual(calls, []); assert.equal(f.states.at(-1).enabled, false);
});
test("no targets and unavailable audio cannot start GPS", async () => {
  for (const options of [{ getTargets: () => [] },
    { beeperFactory: () => ({ async unlock() { throw new Error("blocked"); }, release() {} }) }]) {
    const f = controllerFixture(options); await f.controller.start();
    assert.ok(!f.calls.includes("gps")); assert.ok(f.messages.length);
  }
});
