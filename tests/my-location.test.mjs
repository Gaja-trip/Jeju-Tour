import test from "node:test";
import assert from "node:assert/strict";
import core from "../live-location-core.js";
import personal from "../my-location.js";

test("expanded bottom sheets dock controls above the panel in compact rows", () => {
  assert.deepEqual(personal.controlLayout({ mapBounds: { top: 0, bottom: 700 },
    panelBounds: { top: 154 }, bottomSheet: true }), {
    coveredHeight: 546, visibleHeight: 154, bottomOffset: 558, compact: true
  });
});

test("collapsed sheets restore vertical controls with a 12px panel gap", () => {
  assert.deepEqual(personal.controlLayout({ mapBounds: { top: 0, bottom: 700 },
    panelBounds: { top: 646 }, bottomSheet: true }), {
    coveredHeight: 54, visibleHeight: 646, bottomOffset: 66, compact: false
  });
});

test("sliding panel geometry, not its collapsed class, selects the control layout", () => {
  const at = top => personal.controlLayout({ mapBounds: { top: 0, bottom: 844 }, panelBounds: { top }, bottomSheet: true });
  assert.equal(at(185).compact, true);
  assert.equal(at(329).compact, true);
  assert.equal(at(330).compact, false);
  assert.equal(at(500).bottomOffset, 356);
});

test("desktop and narrow tablet sidebars do not push controls above the screen", () => {
  assert.deepEqual(personal.controlLayout({ mapBounds: { top: 0, bottom: 700 },
    panelBounds: { top: 18 }, bottomSheet: false }), {
    coveredHeight: 0, visibleHeight: 700, bottomOffset: 0, compact: false
  });
});

test("missing and offscreen panels keep control offsets inside valid map bounds", () => {
  const at = panelBounds => personal.controlLayout({ mapBounds: { top: 50, bottom: 750 }, panelBounds, bottomSheet: true });
  assert.equal(at(null).bottomOffset, 12);
  assert.equal(at({ top: 800 }).coveredHeight, 0);
  assert.equal(at({ top: -100 }).coveredHeight, 700);
  assert.equal(at({ top: 104 }).visibleHeight, 54);
});

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

test("only validated, active local GPS fixes are forwarded to arrival alerts", () => {
  const positions = [];
  const f = fixture({ onPosition: (position) => positions.push(position) });
  try {
    f.tracker.start(); f.position(100); f.position(33.5, Date.now() - 120001);
    assert.equal(positions.length, 0);
    f.position(); assert.equal(positions.length, 1);
    f.tracker.stop(); f.position(); assert.equal(positions.length, 1);
  } finally { f.tracker.stop(); }
});
