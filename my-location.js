(function (root) {
  "use strict";

  function controlLayout({ mapBounds, panelBounds, bottomSheet }) {
    const height = Math.max(0, mapBounds.bottom - mapBounds.top);
    const coveredHeight = bottomSheet && panelBounds
      ? Math.min(height, Math.max(0, mapBounds.bottom - Math.max(mapBounds.top, panelBounds.top))) : 0;
    const visibleHeight = height - coveredHeight;
    return { coveredHeight, visibleHeight, bottomOffset: bottomSheet ? coveredHeight + 12 : 0,
      compact: bottomSheet && coveredHeight > 54 && visibleHeight < 330 };
  }

  function createTracker({ map, L, geolocation, secure, validate, document: doc = root.document, onState = () => {}, onMessage = () => {}, onPosition = () => {}, focus }) {
    const layer = L.layerGroup().addTo(map);
    let active = false, waiting = false, watch = null, marker, accuracy, expiry;
    let generation = 0, firstFix = true;
    const state = () => onState({ active, waiting });
    function clearPosition() {
      clearTimeout(expiry);
      layer.clearLayers();
      marker = accuracy = null;
    }
    function stop() {
      generation += 1;
      active = waiting = false;
      if (watch !== null) geolocation.clearWatch(watch);
      watch = null;
      clearPosition();
      state();
    }
    function start() {
      if (active) return;
      if (!secure || !geolocation) {
        onMessage("내 위치 보기는 HTTPS 접속과 기기의 위치 기능이 필요합니다.");
        return;
      }
      active = waiting = firstFix = true;
      const run = ++generation;
      state();
      onMessage("내 위치를 확인하고 있습니다.");
      try {
        const id = geolocation.watchPosition((position) => {
          if (!active || run !== generation) return;
          const point = validate(position);
          if (!point) return;
          const latlng = [point.p_latitude, point.p_longitude];
          if (!marker) {
            accuracy = L.circle(latlng, { radius: point.p_accuracy, color: "#2768d0", weight: 1,
              fillColor: "#2768d0", fillOpacity: .1, interactive: false }).addTo(layer);
            marker = L.circleMarker(latlng, { radius: 8, color: "#ffffff", weight: 3,
              fillColor: "#2768d0", fillOpacity: 1, bubblingMouseEvents: false }).addTo(layer);
          }
          marker.setLatLng(latlng);
          accuracy.setLatLng(latlng).setRadius(point.p_accuracy);
          const popup = doc.createElement("span");
          popup.textContent = `내 위치 · 정확도 ${Math.round(point.p_accuracy)}m`;
          marker.bindPopup(popup);
          waiting = false;
          state();
          if (firstFix) {
            firstFix = false;
            if (focus) focus(latlng);
            else map.setView(latlng, Math.max(map.getZoom(), 15));
            onMessage("내 위치 보기를 켰습니다.");
          }
          clearTimeout(expiry);
          expiry = setTimeout(() => {
            if (!active || run !== generation) return;
            clearPosition();
            waiting = true;
            state();
            onMessage("위치가 갱신되지 않아 표시를 숨겼습니다. 새 위치 신호를 기다립니다.");
          }, Math.max(0, 120000 - (Date.now() - position.timestamp)));
          onPosition(position);
        }, (error) => {
          if (!active || run !== generation) return;
          if (error.code === 1) {
            stop();
            onMessage("위치 권한이 꺼져 있습니다. 브라우저 설정에서 위치를 허용한 뒤 다시 켜 주세요.");
          } else onMessage("위치 신호를 기다리고 있습니다. 기기의 위치 설정을 확인해 주세요.");
        }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
        if (active && run === generation) watch = id;
        else geolocation.clearWatch(id);
      } catch {
        stop();
        onMessage("내 위치를 확인하지 못했습니다. 기기의 위치 설정을 확인해 주세요.");
      }
    }
    return { start, stop, toggle() { if (active) { stop(); onMessage("내 위치 보기를 껐습니다."); } else start(); } };
  }

  function attach({ map, L, onMessage, getArrivalTargets = () => [] }) {
    const panel = document.querySelector("[data-route-panel]");
    const shell = document.querySelector("[data-vworld-route-editor]");
    const sheetMedia = root.matchMedia("(max-width: 680px)");
    const mobile = () => sheetMedia.matches;
    const layout = () => controlLayout({ mapBounds: map.getContainer().getBoundingClientRect(),
      panelBounds: panel?.getBoundingClientRect(), bottomSheet: mobile() });
    const coveredHeight = () => layout().coveredHeight;
    function updateOffset() {
      const bounds = layout();
      const target = map.getContainer();
      target.style.setProperty("--map-controls-bottom", `${bounds.bottomOffset}px`);
      target.style.setProperty("--map-visible-height", `${bounds.visibleHeight}px`);
      target.classList.toggle("map-controls-compact", bounds.compact);
    }
    let frame = null;
    const transitions = new Set();
    function followPanel() {
      frame = null;
      updateOffset();
      if (transitions.size) frame = root.requestAnimationFrame(followPanel);
    }
    function startTransition(event) {
      if (event.target !== panel) return;
      // ResizeObserver does not report the panel's sliding transform.
      transitions.add(event.propertyName);
      if (frame === null) frame = root.requestAnimationFrame(followPanel);
    }
    function endTransition(event) {
      if (event.target !== panel) return;
      transitions.delete(event.propertyName);
      if (!transitions.size && frame !== null) { root.cancelAnimationFrame(frame); frame = null; }
      updateOffset();
    }
    const container = L.DomUtil.create("div", "leaflet-control my-location-control");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "my-location-toggle";
    button.dataset.myLocation = "";
    button.innerHTML = '<span class="my-location-icon" aria-hidden="true"></span>';
    const status = document.createElement("span");
    status.className = "my-location-status";
    status.setAttribute("role", "status");
    container.append(button, status);
    const alarmButton = document.createElement("button");
    alarmButton.type = "button";
    alarmButton.className = "my-location-toggle arrival-alarm-toggle";
    alarmButton.dataset.arrivalAlarm = "";
    alarmButton.innerHTML = '<span class="arrival-alarm-icon" aria-hidden="true"></span>';
    const announce = (text) => { status.textContent = text; onMessage?.(text); };
    const alarm = root.JejuArrivalAlarm?.createController({
      getTargets: getArrivalTargets,
      onEnable: () => tracker.start(),
      onMessage: announce,
      onState: ({ enabled, pending, playing }) => {
        const name = enabled || pending ? "10m 도착 알림 끄기" : "10m 도착 알림 켜기 (3회)";
        alarmButton.setAttribute("aria-label", name);
        alarmButton.setAttribute("aria-pressed", String(enabled || pending));
        alarmButton.setAttribute("aria-busy", String(pending));
        alarmButton.title = name;
        alarmButton.classList.toggle("is-active", enabled);
        alarmButton.classList.toggle("is-locating", pending);
        alarmButton.classList.toggle("is-ringing", playing);
      }
    });
    if (alarm) container.append(alarmButton);
    const tracker = createTracker({ map, L, geolocation: root.navigator.geolocation, secure: root.isSecureContext,
      validate: root.JejuLocationCore.positionPayload,
      onState: ({ active, waiting }) => {
        const name = active ? "내 위치 보기 끄기" : "내 위치 보기 켜기";
        button.setAttribute("aria-label", name);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("aria-busy", String(waiting));
        button.title = name;
        button.classList.toggle("is-active", active);
        button.classList.toggle("is-locating", waiting);
        if (!active) alarm?.stop();
      },
      onMessage: announce,
      onPosition: (position) => alarm?.update(position),
      focus: (latlng) => {
        map.setView(latlng, Math.max(map.getZoom(), 15));
        const side = panel?.getBoundingClientRect();
        const bounds = map.getContainer().getBoundingClientRect();
        const width = side ? Math.max(0, side.right - Math.max(bounds.left, side.left)) : 0;
        map.panBy(mobile() ? [0, coveredHeight() / 2] : [-width / 2, 0], { animate: false });
      }
    });
    button.addEventListener("click", () => tracker.toggle());
    alarmButton.addEventListener("click", () => alarm?.toggle());
    const pauseAlarm = () => { if (document.hidden) alarm?.pause(); };
    document.addEventListener("visibilitychange", pauseAlarm);
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    const control = L.control({ position: "bottomright" });
    control.onAdd = () => container;
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateOffset);
    if (panel) resize?.observe(panel);
    const mutation = typeof MutationObserver === "undefined" ? null : new MutationObserver(updateOffset);
    if (shell) mutation?.observe(shell, { attributes: true, attributeFilter: ["class"] });
    root.addEventListener("resize", updateOffset);
    root.addEventListener("pagehide", tracker.stop);
    sheetMedia.addEventListener?.("change", updateOffset);
    panel?.addEventListener("transitionrun", startTransition);
    panel?.addEventListener("transitionend", endTransition);
    panel?.addEventListener("transitioncancel", endTransition);
    control.onRemove = () => {
      tracker.stop(); resize?.disconnect(); mutation?.disconnect();
      if (frame !== null) root.cancelAnimationFrame(frame);
      transitions.clear();
      root.removeEventListener("resize", updateOffset);
      root.removeEventListener("pagehide", tracker.stop);
      document.removeEventListener("visibilitychange", pauseAlarm);
      sheetMedia.removeEventListener?.("change", updateOffset);
      panel?.removeEventListener("transitionrun", startTransition);
      panel?.removeEventListener("transitionend", endTransition);
      panel?.removeEventListener("transitioncancel", endTransition);
    };
    tracker.stop();
    control.addTo(map);
    updateOffset();
    return tracker;
  }

  const api = { attach, createTracker, controlLayout };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.JejuMyLocation = api;
})(globalThis);
