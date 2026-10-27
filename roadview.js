(function (root) {
  "use strict";
  const valid = (p) => p && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180;
  function linkUrl(point) {
    return valid(point) ? "https://map.kakao.com/link/roadview/" + point.lat.toFixed(7) + "," + point.lng.toFixed(7) : "";
  }
  function bearing(from, to) {
    const r = Math.PI / 180, a = from.lat * r, b = to.lat * r, d = (to.lng - from.lng) * r;
    return (Math.atan2(Math.sin(d) * Math.cos(b), Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(d)) / r + 360) % 360;
  }
  let loading;
  function loadSdk() {
    if (root.kakao?.maps?.Roadview) return Promise.resolve(root.kakao.maps);
    const key = String(root.JEJU_KAKAO_JAVASCRIPT_KEY || "").trim();
    if (!key) return Promise.reject(new Error("unconfigured"));
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=" + encodeURIComponent(key);
      script.referrerPolicy = "strict-origin-when-cross-origin";
      let done = false;
      const timer = root.setTimeout(() => finish(new Error("sdk-timeout")), 15000);
      function finish(error) {
        if (done) return; done = true; root.clearTimeout(timer);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve(root.kakao.maps);
      }
      script.onerror = () => finish(new Error("sdk-error"));
      script.onload = () => {
        if (!root.kakao?.maps?.load) { finish(new Error("sdk-error")); return; }
        try { root.kakao.maps.load(() => finish(root.kakao.maps.Roadview ? null : new Error("sdk-error"))); }
        catch { finish(new Error("sdk-error")); }
      };
      document.head.append(script);
    }).catch((error) => { loading = null; throw error; });
    return loading;
  }
  function create({ shell, desktopHost, onPosition = () => {}, onClose = () => {}, onLayout = () => {} }) {
    if (!shell) return null;
    const panel = document.createElement("dialog");
    panel.className = "course-roadview"; panel.setAttribute("aria-labelledby", "courseRoadviewTitle");
    panel.innerHTML = '<header class="roadview-heading"><div><span>카카오맵 · 로드뷰</span><h2 id="courseRoadviewTitle" data-roadview-title>선택 지점</h2></div><button type="button" data-roadview-close aria-label="로드뷰 닫기">✕</button></header>' +
      '<p class="roadview-point" data-roadview-point></p><div class="roadview-content"><div class="roadview-panorama" data-roadview-panorama hidden></div><div class="roadview-placeholder" data-roadview-placeholder><span aria-hidden="true">⌖</span><p>해당 위치의 주변 도로를 확인하세요.</p></div></div>' +
      '<p class="roadview-status" data-roadview-status role="status" aria-live="polite"></p><footer><a data-roadview-link target="_blank" rel="noopener noreferrer">카카오맵에서 로드뷰 보기 ↗</a><button type="button" data-roadview-retry>다시 불러오기</button></footer>';
    shell.append(panel);
    const viewport = panel.querySelector("[data-roadview-panorama]"), placeholder = panel.querySelector("[data-roadview-placeholder]");
    const status = panel.querySelector("[data-roadview-status]"), link = panel.querySelector("[data-roadview-link]");
    const media = root.matchMedia("(max-width: 760px)");
    let maps, viewer, client, token = 0, target, opener, requestedPano, readyTimer, align = false;
    function clear() { root.clearTimeout(readyTimer); readyTimer = null; }
    function show() {
      if (panel.open) return;
      opener = document.activeElement;
      const host = media.matches ? shell : desktopHost || shell;
      if (panel.parentElement !== host) host.append(panel);
      if (media.matches) panel.showModal(); else panel.show();
      shell.classList.add("course-roadview-open");
      onLayout(true);
      panel.querySelector("[data-roadview-close]").focus({ preventScroll: true });
    }
    function fail(message) {
      clear(); viewport.hidden = true; placeholder.hidden = false;
      status.textContent = message; onPosition(null);
    }
    function updated() {
      if (!panel.open || requestedPano === null || !viewer) return;
      if (requestedPano !== undefined && String(viewer.getPanoId()) !== String(requestedPano)) return;
      const position = viewer.getPosition();
      if (!position) return;
      const p = { lat: position.getLat(), lng: position.getLng() };
      if (!valid(p)) return;
      if (align) {
        align = false;
        const d = root.JejuGpxCore?.distance(p, target.point) || 0;
        if (d >= 1) viewer.setViewpoint({ pan: bearing(p, target.point), tilt: 0, zoom: 0 });
        else if (Number.isFinite(target.heading)) viewer.setViewpoint({ pan: target.heading, tilt: 0, zoom: 0 });
      }
      requestedPano = undefined; clear();
      viewport.style.visibility = "visible"; placeholder.hidden = true;
      const d = root.JejuGpxCore?.distance(p, target.point);
      status.textContent = "로드뷰 촬영 위치" + (Number.isFinite(d) ? " · 선택 좌표에서 " + Math.round(d) + " m" : "") + " · 촬영 당시 모습입니다.";
      onPosition(p);
    }
    function lookup(position, radius) {
      return new Promise((resolve, reject) => {
        let settled = false;
        const timer = root.setTimeout(() => { settled = true; reject(new Error("lookup-timeout")); }, 8000);
        client.getNearestPanoId(position, radius, (id) => { if (!settled) { settled = true; root.clearTimeout(timer); resolve(id); } });
      });
    }
    async function open(point, options = {}) {
      if (!valid(point)) return false;
      const retainView = panel.open && viewer && !viewport.hidden;
      const own = ++token;
      clear(); requestedPano = null; onPosition(null);
      target = { point: { ...point }, ...options };
      panel.querySelector("[data-roadview-title]").textContent = options.title || "선택 지점";
      panel.querySelector("[data-roadview-point]").textContent = (options.detail ? options.detail + " · " : "") + point.lat.toFixed(6) + ", " + point.lng.toFixed(6);
      link.href = linkUrl(point); show();
      if (!retainView) { viewport.hidden = true; placeholder.hidden = false; }
      status.textContent = "가까운 로드뷰를 찾는 중입니다.";
      try {
        maps = await loadSdk();
        if (own !== token || !panel.open) return false;
        viewport.hidden = false; if (!retainView) viewport.style.visibility = "hidden";
        if (!viewer) {
          viewer = new maps.Roadview(viewport); client = new maps.RoadviewClient();
          for (const event of ["init", "panoid_changed", "position_changed"]) maps.event.addListener(viewer, event, updated);
        }
        viewer.relayout();
        const position = new maps.LatLng(point.lat, point.lng);
        let id = await lookup(position, 50);
        if (own !== token || !panel.open) return false;
        if (!id) id = await lookup(position, 100);
        if (own !== token || !panel.open) return false;
        if (!id) { fail("주변 100 m 안에 로드뷰가 없습니다. 카카오맵에서 주변 도로를 확인하세요."); return false; }
        requestedPano = id; align = true;
        readyTimer = root.setTimeout(() => { if (own === token) fail("로드뷰를 불러오지 못했습니다. 카카오맵에서 해당 위치를 확인하세요."); }, 15000);
        viewer.setPanoId(id, position);
        // Selecting the same panorama may not fire an initialization event.
        if (String(viewer.getPanoId()) === String(id) && viewer.getPosition()) updated();
        return true;
      } catch (error) {
        if (own === token && panel.open) fail(error.message === "unconfigured" ?
          "화면 내 로드뷰 연결이 준비되지 않았습니다. 카카오맵에서 이 위치의 로드뷰를 확인하세요." :
          "로드뷰를 불러오지 못했습니다. 카카오맵에서 해당 위치를 확인하거나 다시 시도하세요.");
        return false;
      }
    }
    function close() { if (panel.open) panel.close(); }
    panel.querySelector("[data-roadview-close]").addEventListener("click", close);
    panel.querySelector("[data-roadview-retry]").addEventListener("click", () => { if (target) open(target.point, target); });
    panel.addEventListener("close", () => { if (panel.open) return; ++token; clear(); shell.classList.remove("course-roadview-open"); onPosition(null); onLayout(false); onClose(); if (opener?.isConnected) opener.focus({ preventScroll: true }); });
    panel.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); close(); } });
    media.addEventListener("change", () => { if (!panel.open) return; panel.close(); show(); viewer?.relayout(); });
    new ResizeObserver(() => { if (panel.open && viewer) viewer.relayout(); }).observe(viewport);
    return { open, close, isOpen: () => panel.open, getElement: () => panel };
  }
  const api = { create, linkUrl, bearing };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.JejuRoadview = api;
})(typeof window !== "undefined" ? window : globalThis);
