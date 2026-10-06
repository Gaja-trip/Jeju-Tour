import test from "node:test";
import assert from "node:assert/strict";
import core from "../live-location-core.js";
import personal from "../my-location.js";

function fixture(options = {}) {
  const calls = { watch: [], clear: [], view: [], state: [], message: [] };
  const nodes = new Set();
  let success, error;
  const layer = { addTo() { return this; }, clearLayers() { nodes.clear(); } };
  const node = () => ({ addTo() { nodes.add(this); return this; }, setLatLng(point) { this.point = point; return this; },
    setRadius(radius) { this.radius = radius; return this; }, bindPopup(popup) { this.popup = popup; return this; } });
  const geolocation = { watchPosition(ok, fail, config) { success = ok; error = fail; calls.watch.push(config); return 0; },
    clearWatch(id) { calls.clear.push(id); } };
  const tracker = personal.createTracker({
    map: { setView(point, zoom) { calls.view.push({ point, zoom }); }, getZoom() { return 10; } },
    L: { layerGroup: () => layer, circle: node, circleMarker: node },
    geolocation, secure: true, validate: core.positionPayload,
    document: { createElement() { return {}; } },
    onState: (state) => calls.state.push(state), onMessage: (message) => calls.message.push(message), ...options
  });
  return { tracker, calls, nodes, position(latitude = 33.5, timestamp = Date.now()) {
    success({ timestamp, coords: { latitude, longitude: 126.5, accuracy: 12 } });
  }, error(code) { error({ code }); } };
}

test("personal GPS does not start until the user turns it on", () => {
  const f = fixture();
  assert.equal(f.calls.watch.length, 0);
  assert.equal(f.nodes.size, 0);
  f.tracker.toggle();
  assert.equal(f.calls.watch.length, 1);
  assert.deepEqual(f.calls.state.at(-1), { active: true, waiting: true });
  f.tracker.stop();
});
test("shows position and accuracy, focusing only the first fix", () => {
  const f = fixture();
  try {
    f.tracker.start(); f.tracker.start(); f.position(); f.position(33.6);
    assert.equal(f.calls.watch.length, 1);
    assert.equal(f.nodes.size, 2);
    assert.equal(f.calls.view.length, 1);
    assert.equal(f.calls.view[0].zoom, 15);
    assert.deepEqual(f.calls.state.at(-1), { active: true, waiting: false });
    for (const node of f.nodes) assert.equal(node.point[0], 33.6);
  } finally { f.tracker.stop(); }
});
test("turning off cancels watch ID zero and clears the private position", () => {
  const f = fixture();
  f.tracker.start(); f.position(); f.tracker.toggle();
  assert.deepEqual(f.calls.clear, [0]);
  assert.equal(f.nodes.size, 0);
  assert.deepEqual(f.calls.state.at(-1), { active: false, waiting: false });
});
test("late GPS callbacks cannot revive a disabled personal marker", () => {
  const f = fixture();
  f.tracker.start(); f.tracker.stop(); f.position();
  assert.equal(f.nodes.size, 0);
  assert.equal(f.calls.view.length, 0);
});
test("denied permission turns the control off", () => {
  const f = fixture();
  f.tracker.start(); f.error(1);
  assert.deepEqual(f.calls.clear, [0]);
  assert.equal(f.calls.state.at(-1).active, false);
  assert.match(f.calls.message.at(-1), /권한/);
});
test("a GPS timeout can recover without adding another watch", () => {
  const f = fixture();
  try {
    f.tracker.start(); f.error(3); f.position();
    assert.equal(f.calls.watch.length, 1);
    assert.equal(f.calls.state.at(-1).waiting, false);
  } finally { f.tracker.stop(); }
});
test("insecure contexts and unsupported devices never start GPS", () => {
  for (const options of [{ secure: false }, { geolocation: null }]) {
    const f = fixture(options); f.tracker.start();
    assert.equal(f.calls.watch.length, 0);
    assert.match(f.calls.message.at(-1), /HTTPS/);
  }
});
test("invalid and stale fixes are not shown", () => {
  const f = fixture();
  try {
    f.tracker.start(); f.position(100); f.position(33.5, Date.now() - 120001);
    assert.equal(f.nodes.size, 0);
    assert.equal(f.calls.view.length, 0);
  } finally { f.tracker.stop(); }
});
