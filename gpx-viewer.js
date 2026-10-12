(function (root) {
  "use strict";

  const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const value = (number, unit = "", digits = 1) => Number.isFinite(number) ? number.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits }) + unit : "기록 없음";
  const duration = (seconds) => {
    if (!Number.isFinite(seconds)) return "기록 없음";
    const total = Math.round(seconds), hours = Math.floor(total / 3600), minutes = Math.floor(total % 3600 / 60);
    return (hours ? hours + "시간 " : "") + minutes + "분 " + total % 60 + "초";
  };
  const timestamp = (time) => Number.isFinite(time) ? new Date(time).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false }) : "기록 없음";

  function createStore() {
    let database;
    function open() {
      if (database) return database;
      database = new Promise((resolve, reject) => {
        if (!root.indexedDB) { reject(new Error("저장소 없음")); return; }
        const request = root.indexedDB.open("jeju-tour-gpx", 1);
        const timer = root.setTimeout(() => reject(new Error("저장소 응답 없음")), 5000);
        request.onupgradeneeded = () => request.result.createObjectStore("files");
        request.onerror = request.onblocked = () => { root.clearTimeout(timer); reject(new Error("저장소 접근 실패")); };
        request.onsuccess = () => {
          root.clearTimeout(timer);
          request.result.onversionchange = () => { request.result.close(); database = null; };
          resolve(request.result);
        };
      });
      return database;
    }
    async function operation(mode, action) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("files", mode);
        const request = action(transaction.objectStore("files"));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = transaction.onabort = () => reject(new Error("저장 실패"));
      });
    }
    return { get: () => operation("readonly", (store) => store.get("latest")),
      put: (record) => operation("readwrite", (store) => store.put(record, "latest")),
      remove: () => operation("readwrite", (store) => store.delete("latest")) };
  }

  function chart(data, key, label, unit, color) {
    let min = Infinity, max = -Infinity;
    for (const point of data.points) if (Number.isFinite(point[key])) { min = Math.min(min, point[key]); max = Math.max(max, point[key]); }
    if (min === Infinity) return '<section class="gpx-chart-card"><h2>' + label + '</h2><p class="gpx-chart-empty">이 파일에 ' + label + ' 기록이 없습니다.</p></section>';
    const total = Math.max(1, data.stats.distanceM), range = Math.max(1, max - min);
    const x = (point) => 44 + point.distanceM / total * 344;
    const y = (point) => 22 + (1 - (point[key] - min) / range) * 104;
    const paths = [];
    // Preserve gaps and segment breaks; bound rendered samples for large files.
    const step = Math.max(1, Math.ceil(data.points.length / 1200));
    for (const segment of data.segments) {
      let run = [];
      const flush = () => {
        if (!run.length) return;
        const selected = run.filter((point, index) => index % step === 0 || index === run.length - 1);
        if (selected.length === 1) paths.push('<circle cx="' + x(selected[0]).toFixed(2) + '" cy="' + y(selected[0]).toFixed(2) + '" r="2.5" fill="' + color + '"/>');
        else paths.push('<polyline points="' + selected.map((point) => x(point).toFixed(2) + "," + y(point).toFixed(2)).join(" ") + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round"/>');
        run = [];
      };
      for (const point of segment) {
        if (Number.isFinite(point[key])) run.push(point);
        else flush();
      }
      flush();
    }
    return '<section class="gpx-chart-card"><h2>' + label + ' <small>' + unit + '</small></h2>' +
      '<svg viewBox="0 0 408 158" data-gpx-chart="' + key + '" role="img" aria-label="누적 거리별 ' + label + ' 그래프">' +
      '<path d="M44 22V126H388" fill="none" stroke="#cedbdc"/><path d="M44 74H388M44 22H388" stroke="#e4eded" stroke-dasharray="3 4"/>' +
      '<g class="gpx-chart-axis"><text x="38" y="26" text-anchor="end">' + value(max, "", 0) + '</text><text x="38" y="129" text-anchor="end">' + value(min, "", 0) + '</text>' +
      '<text x="44" y="149">0 km</text><text x="388" y="149" text-anchor="end">' + value(data.stats.distanceM / 1000, " km") + '</text></g>' +
      paths.join("") + '<line data-gpx-chart-cursor x1="44" x2="44" y1="18" y2="128" stroke="#183847" stroke-dasharray="4 3"/>' +
      '</svg></section>';
  }

  function create({ element, onMessage = () => {} }) {
    if (!element || !root.JejuGpxCore) return null;
    const core = root.JejuGpxCore, store = createStore();
    const input = element.querySelector("[data-gpx-file]");
    const drop = element.querySelector("[data-gpx-drop]");
    const status = element.querySelector("[data-gpx-status]");
    const results = element.querySelector("[data-gpx-results]");
    const empty = element.querySelector("[data-gpx-empty]");
    let data = null, original = "", map, L, layer, highlight, active = false, visible = true;
    let generation = 0, selectedIndex = 0, colorMode = "route", frame = null;

    function message(text, error = false) {
      status.textContent = text;
      status.classList.toggle("is-error", error);
    }
    function download(text, name, type) {
      const url = URL.createObjectURL(new Blob([text], { type }));
      const link = document.createElement("a");
      link.href = url; link.download = name; link.click();
      root.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function mapPadding() {
      const panel = element.closest("[data-route-panel]")?.getBoundingClientRect();
      const mobile = root.matchMedia("(max-width: 760px)").matches;
      const covered = mobile && panel ? Math.max(0, root.innerHeight - panel.top) : 0;
      return { paddingTopLeft: [mobile ? 24 : Math.max(24, (panel?.right || 0) + 20), 35],
        paddingBottomRight: [28, Math.min(covered + 30, root.innerHeight - 140)] };
    }
    function fit() {
      if (!data || !map || !layer) return;
      visible = true;
      if (!map.hasLayer(layer)) layer.addTo(map);
      syncVisibility();
      const bounds = L.latLngBounds(data.points.map((point) => [point.lat, point.lng]));
      map.invalidateSize();
      map.fitBounds(bounds, { ...mapPadding(), maxZoom: 16 });
    }
    function syncVisibility() {
      const checkbox = results.querySelector("[data-gpx-visible]");
      if (checkbox) checkbox.checked = visible;
    }
    function popup(point, title) {
      const content = document.createElement("div");
      content.className = "gpx-map-popup";
      const heading = document.createElement("strong");
      heading.textContent = title;
      const details = document.createElement("p");
      details.textContent = value(point.distanceM / 1000, " km") + " · 고도 " + value(point.elevation, " m", 0) + " · 속도 " + value(point.speedKmh, " km/h");
      content.append(heading, details);
      return content;
    }
    function select(index, pan = false) {
      if (!data) return;
      selectedIndex = Math.max(0, Math.min(data.points.length - 1, Math.round(index)));
      const point = data.points[selectedIndex];
      const slider = results.querySelector("[data-gpx-position]");
      if (slider) { slider.value = selectedIndex; slider.setAttribute("aria-valuetext", value(point.distanceM / 1000, " km") + ", 고도 " + value(point.elevation, " m", 0)); }
      const readout = results.querySelector("[data-gpx-point]");
      if (readout) readout.innerHTML = '<strong>구간 ' + (point.segmentIndex + 1) + ' · ' + (selectedIndex + 1).toLocaleString("ko-KR") + '번째 지점</strong>' +
        '<div class="gpx-point-values"><span>거리 <b>' + value(point.distanceM / 1000, " km", 2) + '</b></span><span>고도 <b>' + value(point.elevation, " m", 0) +
        '</b></span><span>속도 <b>' + value(point.speedKmh, " km/h") + '</b></span><span>경사 <b>' + value(point.gradePercent, " %") + '</b></span>' +
        (Number.isFinite(point.heartRate) ? '<span>심박 <b>' + value(point.heartRate, " bpm", 0) + '</b></span>' : "") +
        (Number.isFinite(point.cadence) ? '<span>케이던스 <b>' + value(point.cadence, " rpm", 0) + '</b></span>' : "") +
        '</div><small>' + timestamp(point.time) + ' · ' + point.lat.toFixed(6) + ', ' + point.lng.toFixed(6) + '</small>';
      const chartX = 44 + point.distanceM / Math.max(1, data.stats.distanceM) * 344;
      for (const cursor of results.querySelectorAll("[data-gpx-chart-cursor]")) { cursor.setAttribute("x1", chartX); cursor.setAttribute("x2", chartX); }
      if (highlight) {
        highlight.setLatLng([point.lat, point.lng]).bindPopup(popup(point, "선택한 GPX 지점"));
        if (pan && visible) { map.panInside([point.lat, point.lng], mapPadding()); highlight.openPopup(); }
      }
    }
    function closestDistance(target) {
      let low = 0, high = data.points.length - 1;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (data.points[mid].distanceM < target) low = mid + 1;
        else high = mid;
      }
      if (low && Math.abs(data.points[low - 1].distanceM - target) < Math.abs(data.points[low].distanceM - target)) low -= 1;
      return low;
    }
    function chartPointer(event, pan) {
      const svg = event.target.closest("[data-gpx-chart]");
      if (!svg || !data) return;
      const rect = svg.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, ((event.clientX - rect.left) / rect.width * 408 - 44) / 344));
      const index = closestDistance(fraction * data.stats.distanceM);
      if (pan) select(index, true);
      else {
        root.cancelAnimationFrame(frame);
        frame = root.requestAnimationFrame(() => select(index));
      }
    }
    function color(point) {
      if (colorMode === "route") return "#7c3aed";
      const metric = colorMode === "speed" ? point.speedKmh : point.elevation;
      if (!Number.isFinite(metric)) return "#94a3b8";
      const min = colorMode === "speed" ? 0 : data.stats.minElevationM;
      const max = colorMode === "speed" ? data.stats.maxSpeedKmh : data.stats.maxElevationM;
      const fraction = Math.max(0, Math.min(1, (metric - min) / Math.max(1, max - min)));
      return "hsl(" + Math.round(220 - fraction * 220) + ", 80%, 47%)";
    }
    function draw() {
      if (!map || !layer || !data) return;
      layer.clearLayers();
      highlight = null;
      // Keep every original coordinate in the route; group adjacent color bands.
      for (const segment of data.segments) {
        if (segment.length === 1) {
          L.circleMarker([segment[0].lat, segment[0].lng], { pane: "uploadedGpxPane", radius: 4, color: color(segment[0]) }).addTo(layer);
          continue;
        }
        let run = [], runColor;
        const colorStep = Math.max(1, Math.ceil(data.points.length / 1200));
        const flush = () => {
          if (run.length < 2) return;
          const line = L.polyline(run.map((point) => [point.lat, point.lng]), { pane: "uploadedGpxPane", color: runColor, weight: 5, opacity: .9, bubblingMouseEvents: false }).addTo(layer);
          line.on("click", (event) => {
            let best = 0, nearest = Infinity;
            for (const point of data.points) {
              const d = core.distance(point, { lat: event.latlng.lat, lng: event.latlng.lng });
              if (d < nearest) { best = point.index; nearest = d; }
            }
            select(best, true);
          });
        };
        for (let i = 1; i < segment.length; i += 1) {
          const nextColor = color(segment[Math.min(segment.length - 1, Math.floor((i - 1) / colorStep) * colorStep + 1)]);
          if (nextColor !== runColor) { flush(); run = [segment[i - 1]]; runColor = nextColor; }
          run.push(segment[i]);
        }
        flush();
      }
      const first = data.points[0], last = data.points.at(-1);
      for (const [point, title, markerColor] of [[first, "GPX 출발", "#087c65"], [last, "GPX 도착", "#dc2626"]]) {
        L.circleMarker([point.lat, point.lng], { pane: "uploadedGpxPane", radius: 7, color: "#fff", weight: 2, fillColor: markerColor, fillOpacity: 1, bubblingMouseEvents: false })
          .bindTooltip(title).bindPopup(popup(point, title)).addTo(layer);
      }
      for (const waypoint of data.waypoints.slice(0, 500)) {
        const content = document.createElement("span");
        content.textContent = waypoint.name || "GPX 경유지";
        L.circleMarker([waypoint.lat, waypoint.lng], { pane: "uploadedGpxPane", radius: 5, color: "#b45309", fillOpacity: .8, bubblingMouseEvents: false }).bindPopup(content).addTo(layer);
      }
      highlight = L.circleMarker([first.lat, first.lng], { pane: "uploadedGpxPane", radius: 8, color: "#142f3e", weight: 3, fillColor: "#fff", fillOpacity: 1, bubblingMouseEvents: false }).addTo(layer);
      if (visible && !map.hasLayer(layer)) layer.addTo(map);
      select(selectedIndex);
    }
    function render() {
      results.hidden = !data;
      empty.hidden = !!data;
      if (!data) { results.replaceChildren(); return; }
      const s = data.stats;
      const metric = (label, number, suffix = "", digits = 1) => '<div><dt>' + label + '</dt><dd>' + value(number, suffix, digits) + '</dd></div>';
      const timeMetric = (label, seconds) => '<div><dt>' + label + '</dt><dd>' + duration(seconds) + '</dd></div>';
      results.innerHTML = '<article class="gpx-file-card"><span class="tag">' + data.source + '</span><h2>' + escape(data.name) + '</h2><p>' + escape(data.fileName) + '</p>' +
        (data.description ? '<p>' + escape(data.description) + '</p>' : "") + '<small>' + s.pointCount.toLocaleString("ko-KR") + '개 지점 · ' + s.segmentCount + '개 구간 · ' + data.waypoints.length + '개 경유지</small></article>' +
        '<dl class="gpx-stat-grid">' + metric("총 거리", s.distanceM / 1000, " km", 2) + metric("평균 속도", s.avgSpeedKmh, " km/h") +
        metric("이동 평균 속도", s.movingSpeedKmh, " km/h") + metric("최고 속도", s.maxSpeedKmh, " km/h") +
        timeMetric("기록 시간", s.durationS) + timeMetric("이동 시간", s.movingS) + timeMetric("정지 시간", s.stoppedS) +
        metric("누적 상승", s.ascentM, " m", 0) + metric("누적 하강", s.descentM, " m", 0) +
        metric("최저 고도", s.minElevationM, " m", 0) + metric("최고 고도", s.maxElevationM, " m", 0) +
        (s.avgHeartRate !== null ? metric("평균 심박", s.avgHeartRate, " bpm", 0) : "") +
        (s.avgCadence !== null ? metric("평균 케이던스", s.avgCadence, " rpm", 0) : "") + '</dl>' +
        '<div class="gpx-map-tools"><label class="gpx-visible"><input type="checkbox" data-gpx-visible' + (visible ? " checked" : "") + '>지도에 GPX 표시</label>' +
        '<button type="button" class="btn dark small" data-gpx-fit' + (!map ? " disabled" : "") + '>전체 경로 보기</button>' +
        '<label class="gpx-color-label">경로 색상<select data-gpx-color><option value="route">보라색 경로</option><option value="speed">속도별 색상</option><option value="elevation">고도별 색상</option></select></label>' +
        '<p class="gpx-legend" data-gpx-legend>초록: 출발 · 빨강: 도착 · 흰색: 선택 지점</p></div>' +
        chart(data, "elevation", "고도", "m", "#087c83") + chart(data, "speedKmh", "속도", "km/h", "#7c3aed") +
        '<div class="gpx-point-card"><label for="gpxPosition">기록 지점 살펴보기</label><input id="gpxPosition" type="range" min="0" max="' + (data.points.length - 1) + '" value="0" data-gpx-position>' +
        '<div data-gpx-point></div><p>그래프를 누르거나 슬라이더를 움직이면 지도에서 해당 지점을 확인합니다.</p></div>' +
        '<div class="gpx-file-actions"><button type="button" class="btn light small" data-gpx-download>GPX 다운로드</button><button type="button" class="btn light small" data-gpx-csv>기록 CSV</button>' +
        '<button type="button" class="btn light small" data-gpx-remove>파일 삭제</button></div>' +
        '<details class="gpx-calculation"><summary>기록 정보와 계산 기준</summary><p>시간은 한국 시간으로 표시합니다. 이동 시간은 좌표 간 속도가 1 km/h 이상인 구간입니다. 평균 속도는 유효한 시간 구간의 거리 ÷ 시간으로 계산합니다. 분리된 구간 사이의 거리와 시간은 합산하지 않습니다.</p>' +
        '<p>지점 속도는 파일의 속도 기록을 우선 사용하며, 없으면 거리와 시간으로 계산합니다. 고도와 누적 상승·하강은 GPX 원본 기록 기준이며 GPS 오차가 반영될 수 있습니다.</p>' +
        '<p>첫 지점: ' + timestamp(data.points[0].time) + '<br>마지막 지점: ' + timestamp(data.points.at(-1).time) + '</p></details>' +
        (data.warnings.length ? '<ul class="gpx-warnings">' + data.warnings.map((warning) => '<li>' + escape(warning) + '</li>').join("") + '</ul>' : "");
      colorMode = "route";
      select(selectedIndex);
    }

    async function loadFile(file) {
      if (!file) return;
      const run = ++generation;
      element.removeAttribute("aria-busy");
      input.value = "";
      if (!/\.gpx$/i.test(file.name)) { message(".gpx 파일을 선택해 주세요.", true); return; }
      if (file.size > core.MAX_FILE_BYTES) { message("GPX 파일은 최대 20MB까지 불러올 수 있습니다.", true); return; }
      message("GPX 파일을 분석하고 있습니다.");
      element.setAttribute("aria-busy", "true");
      try {
        const text = await file.text();
        if (run !== generation) return;
        const parsed = core.parse(text, file.name);
        data = parsed; original = text; selectedIndex = 0; visible = true;
        render(); draw();
        root.requestAnimationFrame(fit);
        message(file.name + " 분석 완료 · 이 기기에 저장 중입니다.");
        onMessage("GPX 경로와 기록을 불러왔습니다.");
        try {
          await store.put({ text, fileName: file.name });
          if (run === generation) message(file.name + " · 이 기기에 저장했습니다. 다시 접속하면 복원됩니다.");
        } catch {
          if (run === generation) message(file.name + " 분석 완료 · 기기 저장이 불가능하여 현재 화면에서만 이용할 수 있습니다.");
        }
      } catch (error) {
        if (run === generation) message(error.message || "파일을 불러오지 못했습니다.", true);
      } finally {
        if (run === generation) element.removeAttribute("aria-busy");
      }
    }
    input.addEventListener("change", () => loadFile(input.files[0]));
    for (const type of ["dragenter", "dragover"]) drop.addEventListener(type, (event) => { event.preventDefault(); drop.classList.add("is-dragging"); });
    for (const type of ["dragleave", "drop"]) drop.addEventListener(type, (event) => { event.preventDefault(); drop.classList.remove("is-dragging"); });
    drop.addEventListener("drop", (event) => loadFile(event.dataTransfer.files[0]));
    results.addEventListener("pointermove", (event) => { if (event.pointerType !== "touch") chartPointer(event, false); });
    results.addEventListener("click", async (event) => {
      if (event.target.closest("[data-gpx-chart]")) chartPointer(event, true);
      if (event.target.closest("[data-gpx-fit]")) fit();
      if (event.target.closest("[data-gpx-download]") && data) download(original, data.fileName, "application/gpx+xml");
      if (event.target.closest("[data-gpx-csv]") && data) download(core.toCsv(data), data.fileName.replace(/\.gpx$/i, "") + "-기록.csv", "text/csv;charset=utf-8");
      if (event.target.closest("[data-gpx-remove]")) {
        const run = ++generation;
        data = null; original = ""; selectedIndex = 0;
        root.cancelAnimationFrame(frame);
        layer?.clearLayers(); highlight = null;
        if (map && layer && map.hasLayer(layer)) map.removeLayer(layer);
        element.removeAttribute("aria-busy"); render(); message("GPX 파일을 삭제했습니다.");
        try { await store.remove(); } catch { if (run === generation) message("화면에서 삭제했습니다. 기기 저장소에 접근할 수 없어 저장된 파일 삭제는 완료하지 못했습니다.", true); }
      }
    });
    results.addEventListener("input", (event) => {
      if (event.target.matches("[data-gpx-position]")) select(Number(event.target.value), true);
    });
    results.addEventListener("change", (event) => {
      if (event.target.matches("[data-gpx-visible]")) {
        visible = event.target.checked;
        if (map && layer) { if (visible) layer.addTo(map); else map.removeLayer(layer); }
      }
      if (event.target.matches("[data-gpx-color]")) {
        colorMode = event.target.value; draw();
        const legend = results.querySelector("[data-gpx-legend]");
        legend.textContent = colorMode === "route" ? "초록: 출발 · 빨강: 도착 · 흰색: 선택 지점" :
          "파랑(낮음) → 빨강(높음) · 회색: 기록 없음 · " + (colorMode === "speed" ? "0 ~ " + value(data.stats.maxSpeedKmh, " km/h") : value(data.stats.minElevationM, " m", 0) + " ~ " + value(data.stats.maxElevationM, " m", 0));
      }
    });
    const restoreRun = generation;
    store.get().then((record) => {
      if (!record || generation !== restoreRun) return;
      try {
        data = core.parse(record.text, record.fileName); original = record.text;
        render(); draw(); message(record.fileName + " · 이 기기에 저장된 파일을 복원했습니다.");
        if (active) root.requestAnimationFrame(fit);
      } catch { message("저장된 GPX 파일을 복원할 수 없습니다. 파일을 다시 선택해 주세요.", true); }
    }).catch(() => { if (generation === restoreRun) message("기기 저장소를 이용할 수 없습니다. GPX 파일을 선택하면 현재 화면에서 분석할 수 있습니다."); });

    return {
      attachMap(options) {
        map = options.map; L = options.L;
        map.createPane("uploadedGpxPane");
        map.getPane("uploadedGpxPane").style.zIndex = "450";
        layer = L.layerGroup();

        map.on("overlayadd overlayremove", (event) => {
          if (event.layer === layer) { visible = map.hasLayer(layer); syncVisibility(); }
        });
        render(); draw();
        if (active && data) root.requestAnimationFrame(fit);
        return layer;
      },
      setActive(next) {
        const entering = next && !active;
        active = next;
        if (entering && data) root.setTimeout(() => { if (active) fit(); }, 100);
      }
    };
  }

  root.JejuGpxViewer = { create };
})(typeof window !== "undefined" ? window : globalThis);
