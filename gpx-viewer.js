(function (root) {
  "use strict";
  const defaults = [
    { id: "day1", label: "1일차", title: "제주항 → 카이리조트", fileName: "제주항_카이리조트.gpx", url: "assets/gpx/day1-jeju-kai.gpx", color: "#f97316" },
    { id: "day2", label: "2일차", title: "카이리조트 → 더베이제주리조트", fileName: "카이리조트_더베이제주리조트.gpx", url: "assets/gpx/day2-kai-thebay.gpx", color: "#2563eb" },
    { id: "day3", label: "3일차", title: "더베이제주리조트 → 아쿠아뷰티크", fileName: "더베이제주리조트_아쿠아뷰티크.gpx", url: "assets/gpx/day3-thebay-aqua.gpx", color: "#16a34a" },
    { id: "day4", label: "4일차", title: "아쿠아뷰티크 → 제주항", fileName: "아쿠아뷰티크_제주항.gpx", url: "assets/gpx/day4-aqua-jeju.gpx", color: "#9333ea" }
  ];
  const stopLabels = root.JejuCourseStopLabels || {};
  const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const finite = Number.isFinite;
  const value = (n, unit = "", digits = 1) => finite(n) ? n.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits }) + unit : "기록 없음";
  const clock = (seconds) => {
    if (!finite(seconds)) return "기록 없음";
    const n = Math.max(0, Math.round(seconds));
    return [Math.floor(n / 3600), Math.floor(n % 3600 / 60), n % 60].map((v) => String(v).padStart(2, "0")).join(":");
  };
  const timestamp = (t) => finite(t) ? new Date(t).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false }) : "시간 기록 없음";
  const metrics = [
    { key: "distanceM", title: "거리", unit: "km", color: "#f97316", scale: .001 },
    { key: "speedKmh", title: "속도", unit: "km/h", color: "#38a9ef", scale: 1 },
    { key: "elevation", title: "고도", unit: "m", color: "#4bd568", scale: 1 },
    { key: "heartRate", title: "심박", unit: "bpm", color: "#f43f5e", scale: 1 },
    { key: "cadence", title: "케이던스", unit: "rpm", color: "#8b5cf6", scale: 1 },
    { key: "power", title: "파워", unit: "W", color: "#eab308", scale: 1 }
  ];
  function createStore() {
    let opening;
    function open() {
      if (!opening) opening = new Promise((resolve, reject) => {
        if (!root.indexedDB) { reject(new Error("기기 저장소 없음")); return; }
        const request = root.indexedDB.open("jeju-tour-course-gpx", 1);
        const timer = root.setTimeout(() => reject(new Error("저장소 응답 없음")), 5000);
        request.onupgradeneeded = () => request.result.createObjectStore("files", { keyPath: "day" });
        request.onsuccess = () => { root.clearTimeout(timer); request.result.onversionchange = () => { request.result.close(); opening = null; }; resolve(request.result); };
        request.onerror = request.onblocked = () => { root.clearTimeout(timer); reject(new Error("기기 저장소 접근 실패")); };
      });
      return opening;
    }
    async function operation(mode, action) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("files", mode), request = action(tx.objectStore("files"));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = tx.onabort = () => reject(new Error("기기 저장 실패"));
      });
    }
    return { all: () => operation("readonly", (s) => s.getAll()), put: (record) => operation("readwrite", (s) => s.put(record)),
      remove: (day) => operation("readwrite", (s) => s.delete(day)) };
  }
  function create({ element, initialDay = "day1", onMessage = () => {} }) {
    if (!element || !root.JejuGpxCore) return null;
    const layout = root.JejuCourseMapLayout;
    const core = root.JejuGpxCore, store = createStore(), records = new Map(), versions = new Map(), layers = new Map(), previousContext = new Map();
    const results = element.querySelector("[data-gpx-results]"), status = element.querySelector("[data-gpx-status]");
    const heading = element.querySelector("[data-gpx-heading]"), meta = element.querySelector("[data-gpx-meta]");
    const input = element.querySelector("[data-gpx-file]"), drop = element.querySelector("[data-gpx-drop]");
    const slot = element.querySelector("[data-course-map-slot]"), sidebar = element.querySelector("[data-gpx-summary]"), legend = element.querySelector("[data-gpx-legend]");
    const dock = element.querySelector("[data-course-analysis-dock]"), dockHome = dock.parentElement, mapCard = element.querySelector(".analysis-map-card"), mapCardHome = mapCard.parentElement;
    const media = root.matchMedia("(max-width: 760px)");
    let mobileScreen = new URLSearchParams(location.search).get("screen") === "analysis" ? "analysis" : "map";
    const shell = element.closest("[data-vworld-route-editor]"), enabled = new Set(["distanceM", "speedKmh", "elevation"]);
    let day = initialDay, map, L, layer, highlight, mapHome, active = false, contextLayers = [];
    let axis = "time", selectedIndex = 0, windowStart = 0, windowEnd = 100, pointerFrame, resizeFrame, playFrame, playing = false, seekCache, roadviewSeekTimer;
    const config = () => defaults.find((item) => item.id === day) || defaults[0];
    const current = () => records.get(day)?.data;
    const axisValue = (point) => axis === "time" ? point.elapsedS : point.distanceM;
    const totalAxis = () => axis === "time" ? current()?.stats.durationS || 0 : current()?.stats.distanceM || 0;
    const message = (text, error = false) => { status.textContent = text; status.classList.toggle("is-error", error); };
    const stopCache = new WeakMap(), restLayers = new Map();
    let minimumStopS = 300, roadviewMarker, journal, popupStop, labelFrame, hoveredStop;
    const stopsFor = (data) => {
      if (!data) return [];
      if (!stopCache.has(data)) stopCache.set(data, core.detectStops(data));
      return stopCache.get(data).filter((stop) => stop.durationS >= minimumStopS);
    };
    function namedStop(stop, id = day) {
      const label = stopLabels[id]?.[stop.number];
      return label && core.distance(stop, label) <= 50 ? label : null;
    }
    function stopTitle(stop, id = day) {
      const label = namedStop(stop, id);
      return label?.name ? "#" + stop.number + " " + label.name : "머문 곳 " + stop.number;
    }
    function stopForPoint(data, point) {
      if (!data || data.points[point.index] !== point) return null;
      stopsFor(data);
      return stopCache.get(data).find((stop) => point.index >= stop.startIndex && point.index <= stop.endIndex);
    }
    function stopContext(stop, id = day) {
      const item = defaults.find((entry) => entry.id === id), point = records.get(id)?.data.points[stop.index], label = namedStop(stop, id);
      const incident = incidentDefinitions.find((entry) => entry.day === id && incidentMatch(entry)?.stop?.startIndex === stop.startIndex);
      return { day: id, dayLabel: item.label, number: stop.number, point, name: label?.name || "머문 곳 " + stop.number,
        title: item.label + " · " + stopTitle(stop, id), address: incident ? incident.address + " · " + incident.positionLabel : label?.address,
        description: incident && label?.address ? "GPX 대표 좌표 주소: " + label.address + ". " + (label.description || "") : label?.description,
        summary: "체류 기록 " + clock(stop.durationS) + " · 누적 " + value(stop.startDistanceM / 1000, " km") + (stop.hasRecordingGap ? " · 기록 공백 포함" : ""),
        timeRange: new Date(stop.startTime).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour12: false }) + " – " +
          new Date(stop.endTime).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour12: false }) };
    }
    function selectedPointTitle(data, point) {
      const stop = stopForPoint(data, point);
      return config().label + " · " + (stop && namedStop(stop) ? stopTitle(stop) : "선택 지점");
    }
    const roadview = root.JejuRoadview?.create({ shell, desktopHost: dock, onLayout(open) {
      if (open) { dock.querySelector('.course-dock-body').scrollTop=0; shell.classList.remove('course-dock-collapsed'); dock.querySelector('[data-course-dock-toggle]').setAttribute('aria-expanded','true'); dock.querySelector('[data-course-dock-toggle]').textContent='분석 접기'; highlight?.closePopup(); }
      root.requestAnimationFrame(() => { if (active) { drawCharts(); centerSelection(); scheduleLabels(); } });
    }, onPosition(point) {
      if (!map || !L) return;
      if (roadviewMarker) { map.removeLayer(roadviewMarker); roadviewMarker = null; }
      if (point && active) roadviewMarker = L.marker([point.lat,point.lng],{pane:'gpxSelectionPane',icon:L.divIcon({className:'gpx-camera-marker',html:'<span aria-hidden="true">▣</span>',iconSize:[24,24],iconAnchor:[12,12]}),title:'로드뷰 촬영 위치',bubblingMouseEvents:false}).bindTooltip('로드뷰 촬영 위치',{direction:'top'}).addTo(map);
    }, onClose() { root.clearTimeout(roadviewSeekTimer); if (active) select(selectedIndex, true); } });
    function showRoadview(point, title, detail) {
      stopPlayback();
      const entry = Array.from(records.entries()).find(([, record]) => record.data.points[point.index] === point);
      if (entry && entry[0] !== day) element.querySelector('[data-map-day="' + entry[0] + '"]')?.click();
      const points = current()?.points || [];
      let heading = null;
      // Look beyond stationary GPS jitter to face along the actual route.
      for (let i = point.index + 1; i < points.length && points[i].segmentIndex === point.segmentIndex; i += 1) {
        if (core.distance(point, points[i]) >= 20) { heading = root.JejuRoadview?.bearing(point, points[i]); break; }
      }
      if (!finite(heading)) for (let i = point.index - 1; i >= 0 && points[i].segmentIndex === point.segmentIndex; i -= 1) {
        if (core.distance(points[i], point) >= 20) { heading = root.JejuRoadview?.bearing(points[i], point); break; }
      }
      roadview?.open(point, { title, detail, heading });
      if (entry) { if (map && active) focusPoint(point, Math.max(17, map.getZoom())); select(point.index, true); }
    }
    const incidentDefinitions = root.JejuCourseIncidents?.locations || [], incidentCache = new WeakMap();
    const incidentSummary = element.querySelector("[data-course-incidents]");
    let incidentLayer;
    const stopCard = root.JejuCourseStopCard?.create({
      onRoadview(context) { showRoadview(context.point, context.title, context.summary); },
      onAddPhotos(context) { highlight?.closePopup(); journal?.composeAt(context); },
      onOpenPhoto(id) { journal?.openDetails(id); },
      onRefreshPhotos() { journal?.refresh(); },
      onLayout() { const popup = highlight?.getPopup(); if (highlight?.isPopupOpen() && popup.getContent()?.matches?.(".gpx-stop-card")) { configurePointPopup(true); popup.update(); } }
    });
    function configurePointPopup(isStop) {
      if (!map || !highlight?.getPopup()) return;
      const padding = mapPadding(), top = padding.paddingTopLeft || padding.padding || [24,24], bottom = padding.paddingBottomRight || padding.padding || [24,24];
      Object.assign(highlight.getPopup().options, { autoPan: isStop, autoPanPaddingTopLeft: top, autoPanPaddingBottomRight: bottom,
        maxWidth: isStop ? Math.max(160, Math.min(340, map.getSize().x - top[0] - bottom[0] - 36)) : 280,
        maxHeight: Math.max(60, map.getSize().y - top[1] - bottom[1] - 70) });
    }
    function refreshStopPhotos() {
      popupStop = null;
      stopCard?.refresh();
      const point = current()?.points[selectedIndex];
      if (point && highlight?.isPopupOpen() && stopForPoint(current(), point)) {
        configurePointPopup(true); highlight.setPopupContent(popup(point, selectedPointTitle(current(), point)));
      }
    }
    function incidentMatch(incident) {
      const data = records.get(incident.day)?.data;
      if (!data) return null;
      if (!incidentCache.has(data)) incidentCache.set(data, new Map());
      const matches = incidentCache.get(data);
      if (!matches.has(incident.id)) matches.set(incident.id, root.JejuCourseIncidents.match(data, incident));
      return matches.get(incident.id);
    }
    function incidentDetails(incident) {
      const related = incidentMatch(incident);
      if (!records.has(incident.day)) return "관련 GPX 기록을 불러오는 중입니다.";
      if (!related) return "이 사고 장소 근처에 연결할 GPX 기록이 없습니다.";
      return "관련 GPX " + clock(related.point.elapsedS) + " · " + value(related.point.distanceM / 1000, " km") +
        (related.stop ? " · 정지 구간 " + clock(related.stop.durationS) + (related.stop.hasRecordingGap ? " (기록 공백 포함)" : "") : " · 인근 주행 지점");
    }
    function renderIncidentSummary() {
      if (!incidentSummary) return;
      incidentSummary.innerHTML = '<h2>⚠ 지정 사고 장소 <small>1일차</small></h2>' + incidentDefinitions.map((incident) =>
        '<article><span class="incident-number">' + incident.number + '</span><div><strong>' + escape(incident.address) + '</strong><small>' +
        escape(incident.positionLabel) + '</small><p>' + escape(incidentDetails(incident)) + '</p><div class="incident-actions"><button type="button" data-gpx-incident="' +
        incident.id + '">지도 · 주행 분석</button><button type="button" data-gpx-incident="' + incident.id + '" data-incident-roadview>로드뷰</button></div></div></article>').join("");
    }
    function incidentPopup(incident) {
      const node = document.createElement("div"); node.className = "gpx-incident-popup";
      const heading = document.createElement("strong"); heading.textContent = incident.number + "번 사고 장소";
      const address = document.createElement("p"); address.textContent = incident.address;
      const source = document.createElement("small"); source.textContent = incident.positionLabel;
      const details = document.createElement("p"); details.textContent = incidentDetails(incident);
      const button = document.createElement("button"); button.type = "button"; button.textContent = "이 사고 장소 로드뷰";
      button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); showIncident(incident.id, true); });
      node.append(heading, address, source, details, button); return node;
    }
    function drawIncidents() {
      if (!incidentLayer) return;
      incidentLayer.clearLayers();
      for (const incident of incidentDefinitions) {
        const icon = L.divIcon({ className: "gpx-incident-pin", html: '<span>⚠<b>' + incident.number + '</b></span>',
          iconSize: [32, 38], iconAnchor: [16, 38], popupAnchor: [0, -32] });
        L.marker([incident.lat, incident.lng], { icon, pane: "courseIncidentPane", title: incident.number + "번 사고 장소 · " + incident.address, bubblingMouseEvents: false })
          .bindTooltip(incident.number + "번 사고 장소", { permanent: false, direction: "top", offset: [0, -38], className: "gpx-incident-label" })
          .bindPopup(incidentPopup(incident), { maxWidth: 310, autoPan: false })
          .on("click", () => showIncident(incident.id, false, true)).addTo(incidentLayer);
      }
    }
    function renderIncidentBar() {
      const items = incidentDefinitions.filter((incident) => incident.day === day);
      return items.length ? '<div class="ride-incident-key"><strong>⚠ 사고 장소</strong>' + items.map((incident) =>
        '<button type="button" data-gpx-incident="' + incident.id + '" title="' + escape(incident.address) + '">' + incident.number + '번 · ' +
        escape(incident.shortAddress) + '</button>').join("") + '<small>빨간 표시: 관련 GPX 지점·정지 구간</small></div>' : "";
    }
    function showIncident(id, openRoadview = false, openDetails = false) {
      const incident = incidentDefinitions.find((item) => item.id === id);
      if (!incident) return;
      stopPlayback();
      if (day !== incident.day) element.querySelector('[data-map-day="' + incident.day + '"]')?.click();
      const related = incidentMatch(incident), data = current();
      if (related && data) {
        if (related.stop && data.stats.timedPairs) {
          axis = "time";
          const total = Math.max(1, data.stats.durationS);
          windowStart = Math.max(0, (related.stop.startElapsedS - 300) / total * 100);
          windowEnd = Math.min(100, (related.stop.endElapsedS + 300) / total * 100);
          render();
        }
        select(related.point.index);
      } else onMessage("이 위치 근처의 GPX 기록이 없습니다. 지정된 사고 장소를 지도에 표시합니다.");
      if (media.matches) {
        mobileScreen = "analysis"; attachContainer();
        const url = new URL(location.href); url.searchParams.set("screen", "analysis"); history.replaceState(history.state, "", url);
      }
      if (openRoadview) roadview?.open(incident, { title: incident.number + "번 사고 장소", detail: incident.address + " · " + incident.positionLabel });
      if (map) {
        map.invalidateSize({ pan: false });
        focusPoint(related?.point || incident, Math.max(17, map.getZoom()));
        for (const marker of incidentLayer?.getLayers() || []) if (marker.options.title?.startsWith(incident.number + "번 ")) {
          const padding = mapPadding(), top = padding.paddingTopLeft || padding.padding || [24,24], bottom = padding.paddingBottomRight || padding.padding || [24,24];
          Object.assign(marker.getPopup().options, { autoPan: true, autoPanPaddingTopLeft: top, autoPanPaddingBottomRight: bottom,
            maxHeight: Math.max(60, map.getSize().y - top[1] - bottom[1] - 70) });
          if (openDetails && !openRoadview) marker.openPopup();
        }
      }
      results.scrollTop = 0;
      if (media.matches) dock.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    function showStop(stop, id = day, openRoadview = true) {
      stopPlayback(); stopCard?.close();
      if (!openRoadview) roadview?.close();
      if (id !== day) element.querySelector('[data-map-day="' + id + '"]')?.click();
      const point = current()?.points[stop.index];
      if (!point) return;
      if (!openRoadview && map && active) focusPoint(point, Math.max(17, map.getZoom()));
      select(stop.index, true, !openRoadview);
      if (openRoadview) showRoadview(point, config().label + " · " + stopTitle(stop, id),
        clock(stop.durationS) + " 체류 후보 · " + value(stop.startDistanceM / 1000, " km") + (stop.hasRecordingGap ? " · 기록 공백 포함" : ""));
    }
    function download(text, name, type) {
      const url = URL.createObjectURL(new Blob([text], { type })), link = document.createElement("a");
      link.href = url; link.download = name; link.click(); root.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function mapPadding() {
      if (!map || (active && media.matches)) return { padding: [24,24] };
      const bounds = map.getContainer().getBoundingClientRect();
      const panel = shell.querySelector("[data-route-panel]").getBoundingClientRect();
      const bottom = active && !media.matches ? dock.getBoundingClientRect().height + 32 : media.matches ? Math.max(0, bounds.bottom-panel.top)+18 : 24;
      return { paddingTopLeft: [media.matches ? 24 : Math.min(Math.max(24,panel.right-bounds.left+20), Math.max(24,bounds.width-120)), 32],
        paddingBottomRight: [media.matches ? 24 : 76,Math.min(bottom,Math.max(24,bounds.height-120))] };
    }
    function focusPoint(point, zoom = map?.getZoom()) {
      if (!map || !active || !point) return;
      const size = map.getSize(), free = layout.visibleRect(size,mapPadding());
      const projected = map.project([point.lat,point.lng],zoom);
      const center = projected.add([size.x/2-free.cx,size.y/2-free.cy]);
      map.setView(map.unproject(center,zoom),zoom,{animate:false});
    }
    function centerSelection() { const point=current()?.points[selectedIndex]; if(point)focusPoint(point); }
    function scheduleLabels() {
      root.cancelAnimationFrame(labelFrame);
      labelFrame=root.requestAnimationFrame(placeStopLabels);
    }
    function placeStopLabels() {
      if (!map || !active || !layout) return;
      const free=layout.visibleRect(map.getSize(),mapPadding()), items=[], blocked=[];
      for(const marker of restLayers.get(day)?.getLayers()||[]) {
        if(!marker._courseStops)continue;
        const p=map.latLngToContainerPoint(marker.getLatLng()),tooltip=marker.getTooltip(),node=tooltip?.getElement();
        blocked.push({id:marker._courseKey,left:p.x-19,right:p.x+19,top:p.y-17,bottom:p.y+17});
        if(!node)continue;
        items.push({id:marker._courseKey,x:p.x,y:p.y,width:node.offsetWidth,height:node.offsetHeight,number:marker._courseStops[0].number,
          priority:hoveredStop===marker?100:marker._courseStops.some(s=>selectedIndex>=s.startIndex&&selectedIndex<=s.endIndex)?10:0,direction:marker._courseDirection});
      }
      if(highlight && active){const p=map.latLngToContainerPoint(highlight.getLatLng()),own=(restLayers.get(day)?.getLayers()||[]).find(m=>m._courseStops?.some(s=>selectedIndex>=s.startIndex&&selectedIndex<=s.endIndex));blocked.push({id:own?._courseKey,left:p.x-22,right:p.x+22,top:p.y-22,bottom:p.y+22});}
      const positions=layout.placeLabels(items,free,blocked);
      for(const marker of restLayers.get(day)?.getLayers()||[]) {
        if(!marker._courseStops)continue;
        const tooltip=marker.getTooltip(),node=tooltip?.getElement();if(!node)continue;
        const placed=positions.get(marker._courseKey);
        const show=Boolean(placed)&&(!media.matches||map.getZoom()>=15);
        node.classList.toggle('is-crowded',!show); node.setAttribute('aria-hidden',String(!show));
        if(placed){tooltip.options.direction=placed.direction;tooltip.options.offset=L.point(placed.direction==='left'?-17:placed.direction==='right'?17:0,placed.direction==='top'?-17:placed.direction==='bottom'?17:0);tooltip.update();}
      }
    }
    function attachContainer() {
      shell.classList.toggle("course-mobile-layout", media.matches);
      shell.classList.toggle("course-mobile-analysis", mobileScreen === "analysis");
      for (const button of element.querySelectorAll("[data-course-mobile-screen]")) button.setAttribute("aria-pressed", String(button.dataset.courseMobileScreen === mobileScreen));
      dock.hidden = !active || (media.matches && mobileScreen !== "analysis");
      if (active && !media.matches && dock.parentElement !== shell) shell.append(dock);
      else if ((!active || media.matches) && dock.parentElement !== dockHome) dockHome.append(dock);
      if (active && media.matches && mobileScreen === "analysis") {
        if (mapCard.parentElement !== dock) dock.insertBefore(mapCard, dock.querySelector(".course-dock-body"));
      } else if (mapCard.parentElement !== mapCardHome) mapCardHome.append(mapCard);
      if (!map) return;
      const container = map.getContainer();
      if (active && media.matches && container.parentElement !== slot) slot.append(container);
      else if ((!active || !media.matches) && container.parentElement !== mapHome) mapHome.insertBefore(container, mapHome.firstChild);
      map.invalidateSize({ pan:false });
    }
    function fit(all = false) {
      if (!map || !layer) return;
      const points = all ? Array.from(records.values()).flatMap((r) => r.data.points) : current()?.points;
      if (!points?.length) return;
      if (!map.hasLayer(layer)) layer.addTo(map);
      attachContainer();
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat,p.lng])), { ...mapPadding(), maxZoom:15, animate:false });
    }
    function popup(point, title, id = day) {
      const stop = stopForPoint(records.get(id)?.data, point);
      if (stop && stopCard) return stopCard.render(stopContext(stop, id));
      const node = document.createElement("div"), strong = document.createElement("strong"), text = document.createElement("p");
      node.className = "gpx-map-popup"; strong.textContent = title;
      text.textContent = clock(point.elapsedS) + " · " + value(point.distanceM / 1000, " km") + " · " + value(point.speedKmh, " km/h") + " · " + value(point.elevation, " m", 0);
      const button = document.createElement("button"); button.type = "button"; button.className = "gpx-roadview-button"; button.textContent = "이 위치 로드뷰";
      button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); showRoadview(point, title, clock(point.elapsedS) + " · " + value(point.distanceM / 1000, " km")); });
      node.append(strong, text, button); return node;
    }
    function select(index, focus = false, open = false) {
      const data = current();
      if (!data) return;
      const previousIndex = selectedIndex;
      selectedIndex = Math.max(0, Math.min(data.points.length - 1, Math.round(index)));
      const point = data.points[selectedIndex], slider = results.querySelector("[data-gpx-position]");
      if (slider) { slider.value = selectedIndex; slider.setAttribute("aria-valuetext", clock(point.elapsedS) + " · " + value(point.distanceM / 1000, " km")); }
      const readout = results.querySelector("[data-gpx-point]");
      if (readout) readout.innerHTML = '<div><span>경과 시간</span><strong>' + clock(point.elapsedS) + '</strong></div><div><span>누적 거리</span><strong>' +
        value(point.distanceM / 1000, " km", 2) + '</strong></div><div><span>현재 속도</span><strong>' + value(point.speedKmh, " km/h") +
        '</strong></div><div><span>현재 고도</span><strong>' + value(point.elevation, " m", 0) + '</strong></div><small>' + timestamp(point.time) +
        " · " + point.lat.toFixed(6) + ", " + point.lng.toFixed(6) + '</small>';
      const x = axisValue(point), total = totalAxis(), start = total * windowStart / 100, span = Math.max(.001, total * (windowEnd - windowStart) / 100);
      for (const svg of results.querySelectorAll("[data-gpx-chart]")) {
        const width = Number(svg.dataset.chartWidth), cursor = svg.querySelector("[data-gpx-chart-cursor]"), cx = 44 + (x - start) / span * (width - 62);
        cursor.style.display = finite(x) && cx >= 44 && cx <= width - 18 ? "" : "none";
        cursor.setAttribute("x1", cx); cursor.setAttribute("x2", cx);
      }
      if (highlight) {
        highlight.setLatLng([point.lat, point.lng]).setOpacity(active ? 1 : 0);
        highlight.getElement()?.style.setProperty("--rider-color",config().color);
        if (focus && !open) highlight.closePopup();
        const stop = stopForPoint(data, point);
        if (!stop || popupStop?.data !== data || popupStop.index !== stop.index) {
          const content = popup(point, selectedPointTitle(data, point));
          if (!highlight.getPopup()) highlight.bindPopup(content, { autoPan: false });
          configurePointPopup(Boolean(stop)); highlight.setPopupContent(content);
          popupStop = stop ? { data, index: stop.index } : null;
        }
        if (focus && active) focusPoint(point);
        scheduleLabels();
        if (open) {
          const stop = stopForPoint(data, point);
          if (media.matches && stop && stopCard) { highlight.closePopup(); stopCard.showMobile(stopContext(stop)); }
          else if (!roadview?.isOpen()) highlight.openPopup();
        }
      }
      if (roadview?.isOpen() && !playing && (open || previousIndex !== selectedIndex)) {
        root.clearTimeout(roadviewSeekTimer);
        const update = () => { if (active && roadview.isOpen() && current()?.points[selectedIndex] === point) roadview.open(point, {
          title: selectedPointTitle(data, point), detail: clock(point.elapsedS) + " · " + value(point.distanceM / 1000, " km") }); };
        if (open) update(); else roadviewSeekTimer = root.setTimeout(update, 400);
      }
    }
    function nearest(target) {
      const data = current();
      if (!data?.points.length) return 0;
      if (!seekCache || seekCache.data !== data || seekCache.axis !== axis) {
        seekCache = { data, axis, points: data.points.filter((point) => finite(axisValue(point))) };
      }
      const points = seekCache.points;
      if (!points.length) return 0;
      let low = 0, high = points.length - 1;
      while (low < high) { const mid = Math.floor((low + high) / 2); if (axisValue(points[mid]) < target) low = mid + 1; else high = mid; }
      if (low && Math.abs(axisValue(points[low - 1]) - target) < Math.abs(axisValue(points[low]) - target)) low -= 1;
      return points[low].index;
    }
    function chartPointer(event, open = false) {
      const svg = event.target.closest("[data-gpx-chart]");
      if (!svg || !current()) return;
      const rect = svg.getBoundingClientRect(), width = Number(svg.dataset.chartWidth);
      const fraction = Math.max(0, Math.min(1, ((event.clientX - rect.left) / rect.width * width - 44) / (width - 62)));
      const target = totalAxis() * (windowStart + fraction * (windowEnd - windowStart)) / 100;
      stopPlayback();
      if (open) select(nearest(target), true, true);
      else { root.cancelAnimationFrame(pointerFrame); pointerFrame = root.requestAnimationFrame(() => select(nearest(target), true)); }
    }
    function chart(metric, width) {
      const data = current(), full = totalAxis(), start = full * windowStart / 100, end = full * windowEnd / 100, runs = [];
      let min = Infinity, max = -Infinity, sum = 0, count = 0;
      for (const segment of data.segments) {
        let run = [];
        for (const point of segment) {
          const px = axisValue(point), py = point[metric.key];
          if (finite(px) && px >= start && px <= end && finite(py)) {
            const scaled = py * metric.scale; min = Math.min(min, scaled); max = Math.max(max, scaled); sum += scaled; count += 1; run.push(point);
          } else if (run.length) { runs.push(run); run = []; }
        }
        if (run.length) runs.push(run);
      }
      const label = metric.title + " (" + metric.unit + ")";
      if (!count) return '<section class="ride-chart-card"><h3>' + label + '</h3><p class="gpx-chart-empty">선택 구간에 기록이 없습니다.</p></section>';
      const base = metric.key === "elevation" ? Math.min(0, min) : 0, ceiling = Math.max(base + 1, max * (max > 0 ? 1.08 : 1));
      const yRange = ceiling - base, span = Math.max(.001, end - start);
      const x = (p) => 44 + (axisValue(p) - start) / span * (width - 62), y = (p) => 18 + (1 - (p[metric.key] * metric.scale - base) / yRange) * 88;
      const shapes = [], step = Math.max(1, Math.ceil(data.points.length / 1800));
      for (const run of runs) {
        const sampled = run.filter((_, i) => i % step === 0 || i === run.length - 1);
        const positions = sampled.map((p) => x(p).toFixed(2) + "," + y(p).toFixed(2)).join(" ");
        if (sampled.length > 1) {
          shapes.push('<polygon points="' + x(sampled[0]).toFixed(2) + ',106 ' + positions + " " + x(sampled.at(-1)).toFixed(2) + ',106" fill="' + metric.color + '" fill-opacity=".2"/>');
          shapes.push('<polyline points="' + positions + '" fill="none" stroke="' + metric.color + '" stroke-width="1.4" vector-effect="non-scaling-stroke"/>');
        } else shapes.push('<circle cx="' + x(sampled[0]).toFixed(2) + '" cy="' + y(sampled[0]).toFixed(2) + '" r="2" fill="' + metric.color + '"/>');
      }
      const stopBands = stopsFor(data).map((stop) => {
        const a = axis === "time" ? stop.startElapsedS : stop.startDistanceM, b = axis === "time" ? stop.endElapsedS : stop.endDistanceM;
        if (!finite(a) || !finite(b) || b < start || a > end) return "";
        const left = 44 + (Math.max(start, a) - start) / span * (width - 62), right = 44 + (Math.min(end, b) - start) / span * (width - 62);
        return '<rect data-gpx-stop="' + stop.startIndex + '" class="ride-stop-band" x="' + left.toFixed(2) + '" y="18" width="' + Math.max(3, right - left).toFixed(2) +
          '" height="88" fill="#f59e0b" fill-opacity=".15"><title>' + escape(stopTitle(stop)) + ' · ' + clock(stop.durationS) + ' · 클릭하여 로드뷰 보기</title></rect>';
      }).join("");
      const incidentMarks = incidentDefinitions.filter((incident) => incident.day === day).map((incident) => {
        const related = incidentMatch(incident), point = related?.point, position = point && axisValue(point);
        if (!finite(position)) return "";
        const px = 44 + (position - start) / span * (width - 62);
        let region = "";
        if (related.stop) {
          const a = axis === "time" ? related.stop.startElapsedS : related.stop.startDistanceM;
          const b = axis === "time" ? related.stop.endElapsedS : related.stop.endDistanceM;
          if (b >= start && a <= end) {
            const left = 44 + (Math.max(a, start) - start) / span * (width - 62), right = 44 + (Math.min(b, end) - start) / span * (width - 62);
            region = '<rect class="ride-incident-stop-band" data-gpx-incident="' + incident.id + '" x="' + left.toFixed(2) + '" y="18" width="' +
              Math.max(3, right - left).toFixed(2) + '" height="88" fill="#ef4444" fill-opacity=".16"><title>' + incident.number + '번 사고 장소 관련 정지 구간</title></rect>';
          }
        }
        return region + (position >= start && position <= end ? '<g class="ride-incident-mark" data-gpx-incident="' + incident.id + '"><line x1="' + px.toFixed(2) +
          '" x2="' + px.toFixed(2) + '" y1="15" y2="108" stroke="#dc2626" stroke-width="2"/><circle cx="' + px.toFixed(2) +
          '" cy="13" r="8" fill="#dc2626"/><text x="' + px.toFixed(2) + '" y="16" text-anchor="middle" fill="#fff" font-size="10">' + incident.number +
          '</text><title>' + incident.number + '번 사고 장소 · ' + escape(incident.address) + '</title></g>' : "");
      }).join("");
      const ticks = [];
      for (let i = 0; i <= 3; i += 1) {
        const py = 18 + i / 3 * 88;
        ticks.push('<line x1="44" x2="' + (width - 18) + '" y1="' + py + '" y2="' + py + '" stroke="#dce4ef" stroke-dasharray="3 3"/><text x="38" y="' + (py + 4) +
          '" text-anchor="end">' + value(ceiling - i / 3 * yRange, "", metric.key === "distanceM" ? 1 : 0) + '</text>');
      }
      for (let i = 0; i <= 5; i += 1) ticks.push('<text x="' + (44 + i / 5 * (width - 62)) + '" y="126" text-anchor="' +
        (i === 0 ? "start" : i === 5 ? "end" : "middle") + '">' + (axis === "time" ? clock(start + span * i / 5).slice(0, 5) : value((start + span * i / 5) / 1000)) + '</text>');
      return '<section class="ride-chart-card"><div class="ride-chart-heading"><h3>' + label + '</h3><span>지점 평균 <b>' + value(sum / count) + '</b></span><span>최고 <b>' +
        value(max) + '</b></span></div><svg viewBox="0 0 ' + width + ' 136" data-chart-width="' + width + '" data-gpx-chart="' + metric.key + '" role="img" aria-label="' +
        (axis === "time" ? "시간" : "거리") + '에 따른 ' + metric.title + ' 그래프"><g class="gpx-chart-axis">' + ticks.join("") + '</g>' + shapes.join("") + stopBands + incidentMarks +
        '<line data-gpx-chart-cursor pointer-events="none" x1="44" x2="44" y1="15" y2="108" stroke="#34445d" stroke-dasharray="3 3"/></svg></section>';
    }
    function drawCharts() {
      const target = results.querySelector("[data-gpx-charts]");
      if (!target || !current()) return;
      const width = Math.max(300, Math.round(target.clientWidth - 32));
      target.innerHTML = metrics.filter((m) => enabled.has(m.key) && (axis === "time" || m.key !== "distanceM")).map((m) => chart(m, width)).join("");
      const label = results.querySelector("[data-gpx-window-label]");
      if (label) label.textContent = axis === "time" ? clock(totalAxis() * windowStart / 100) + " – " + clock(totalAxis() * windowEnd / 100) :
        value(totalAxis() * windowStart / 100000, " km") + " – " + value(totalAxis() * windowEnd / 100000, " km");
      select(selectedIndex);
    }
    function drawDay(id) {
      if (!map || !layer || !records.has(id)) return;
      let group = layers.get(id);
      if (!group) { group = L.layerGroup().addTo(layer); layers.set(id, group); }
      group.clearLayers();
      const data = records.get(id).data, item = defaults.find((entry) => entry.id === id);
      for (const segment of data.segments) {
        if (segment.length < 2) continue;
        const line = L.polyline(segment.map((p) => [p.lat, p.lng]), { pane: "uploadedGpxPane", color: item.color, weight: id === day ? 5 : 3, opacity: id === day ? .95 : .65, bubblingMouseEvents: false }).addTo(group);
        line.bindTooltip(item.label + " · " + item.title + " · " + value(data.stats.distanceM / 1000, " km"), { sticky: true });
        line.on("click", (event) => {
          if (id !== day) element.querySelector('[data-map-day="' + id + '"]')?.click();
          let index = 0, best = Infinity;
          for (const point of data.points) { const delta = core.distance(point, event.latlng); if (delta < best) { index = point.index; best = delta; } }
          select(index, true, true);
        });
      }
      for (const [point, text] of [[data.points[0], "출발"], [data.points.at(-1), "도착"]])
        L.circleMarker([point.lat, point.lng], { pane: "uploadedGpxPane", radius: 5, color: "#fff", weight: 2, fillColor: item.color, fillOpacity: 1, bubblingMouseEvents: false })
          .bindTooltip(item.label + " " + text).bindPopup(popup(point, item.title + " · " + text, id)).addTo(group);
      for (const lap of core.buildLaps(data)) {
        if (lap.distanceM < 4999) continue;
        const point = data.points[lap.endIndex];
        L.circleMarker([point.lat, point.lng], { pane: "uploadedGpxPane", radius: 3, color: item.color, weight: 1, fillColor: "#fff", fillOpacity: 1, bubblingMouseEvents: false })
          .bindTooltip(value(lap.endM / 1000, "", 0), { permanent: true, direction: "top", className: "gpx-distance-label", opacity: 1 })
          .on("click", () => { if (id !== day) element.querySelector('[data-map-day="' + id + '"]')?.click(); select(lap.endIndex, true, true); }).addTo(group);
      }
      drawStops(id); drawIncidents();
      if (!map.hasLayer(layer)) layer.addTo(map);
    }
    function updateDayStyles() {
      if (L) for (const [id, group] of layers) for (const item of group.getLayers()) if (item instanceof L.Polyline) item.setStyle({ weight: id === day ? 5 : 3, opacity: id === day ? .95 : .65 });
      for (const [id,group] of restLayers) {
        if(active && id===day){if(!layer.hasLayer(group))layer.addLayer(group);}
        else if(layer.hasLayer(group))layer.removeLayer(group);
      }
      scheduleLabels();
      legend.innerHTML = defaults.map((item) => '<span class="' + (item.id === day ? "is-selected" : "") + '"><i style="background:' + item.color + '"></i>' +
        item.label + '</span>').join("") + '<span><i style="background:#a1a1aa"></i>기존 코스</span>';
    }
    function renderStopPlace(stop) {
      const label = namedStop(stop);
      if (!label?.address) return "";
      return '<details class="ride-stop-place-details"><summary>장소·주소 확인</summary><p>' + escape(label.address) + '</p><p>' +
        escape(label.description) + '</p><a href="' + escape(label.sourceUrl) + '" target="_blank" rel="noopener noreferrer">카카오맵 기준 장소: ' +
        escape(label.sourceName) + (finite(label.sourceDistanceM) ? ' · 약 ' + label.sourceDistanceM + ' m' : '') + '</a></details>';
    }
    function renderStops(data) {
      const stops = stopsFor(data);
      return '<section class="ride-stops"><div class="ride-section-title"><h2>장시간 머문 곳 <small>' + stops.length + '곳</small></h2><label>최소 시간 <select data-gpx-stop-min aria-label="체류 후보 최소 시간">' +
        [300, 600, 1200].map((seconds) => '<option value="' + seconds + '"' + (minimumStopS === seconds ? ' selected' : '') + '>' + seconds / 60 + '분</option>').join("") +
        '</select></label></div><p class="ride-stop-explanation">첫 지점 반경 40 m 안의 기록을 분석합니다. 기록 공백이 있으면 실제 휴식 여부와 시간은 확인이 필요합니다. 장소 이름은 GPX 좌표와 주변 지도 정보를 대조한 위치 설명입니다.</p><div class="ride-stop-list">' +
        (stops.length ? stops.map((stop) => '<article class="ride-stop-row"><span class="ride-stop-number">Ⅱ ' + stop.number + '</span><div><strong>' + escape(stopTitle(stop)) + '</strong><p>' + clock(stop.durationS) + ' 체류 후보 · ' +
          clock(stop.startElapsedS) + ' – ' + clock(stop.endElapsedS) + ' · ' + value(stop.startDistanceM / 1000, ' km') + '</p><small>' +
          new Date(stop.startTime).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour12: false }) + ' – ' +
          new Date(stop.endTime).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour12: false }) + ' (한국 시간)' +
          (stop.hasRecordingGap ? ' · <b>기록 공백 포함</b>' : ' · 연속 위치 기록') + '</small>' + renderStopPlace(stop) + '</div><button type="button" data-gpx-stop="' +
          stop.startIndex + '" aria-label="' + escape(stopTitle(stop)) + ' 지도와 로드뷰 보기">지도 · 로드뷰</button></article>').join("") :
          '<p class="ride-stop-empty">' + (data.stats.timedPairs ? '선택한 기준에 맞는 체류 후보가 없습니다.' : '시간 기록이 없어 체류 지점을 분석할 수 없습니다.') + '</p>') +
        '</div></section>';
    }
    function drawStops(id) {
      if (!map || !layer || !records.has(id)) return;
      let group = restLayers.get(id);
      if (!group) { group=L.layerGroup();restLayers.set(id,group); }
      group.clearLayers();
      const data=records.get(id).data,item=defaults.find(entry=>entry.id===id);
      const groups=layout.groupStops(stopsFor(data),stop=>map.latLngToContainerPoint([stop.lat,stop.lng]),core.distance);
      for(const stays of groups){
        const stop=stays[0],labels=stays.map(s=>namedStop(s,id)),names=[...new Set(labels.map(l=>l?.name).filter(Boolean))];
        const numbers=stays.map(s=>s.number).join('·'),name=names.join(' / ')||'머문 곳';
        const text='#'+numbers+' '+name,fullTitle=item.label+' · '+text+(stays.length>1?' · '+stays.length+'회 체류':' · '+clock(stop.durationS));
        const point=stays.length===1?data.points[stop.index]:{lat:stays.reduce((sum,s)=>sum+s.lat,0)/stays.length,lng:stays.reduce((sum,s)=>sum+s.lng,0)/stays.length};
        const icon=L.divIcon({className:'gpx-stop-icon',html:'<span class="'+(stays.length>1?'is-group':'')+'" style="--stop-color:'+item.color+'">'+numbers+'</span>',iconSize:[44,44],iconAnchor:[22,22]});
        const choose=()=>{
          if(stays.length===1){showStop(stop,id,false);return;}
          if(id!==day)element.querySelector('[data-map-day="'+id+'"]').click();
          focusPoint(point,Math.max(17,map.getZoom()));
          const node=document.createElement('div');node.className='gpx-stay-group';
          const title=document.createElement('strong');title.textContent=name;
          const hint=document.createElement('p');hint.textContent='같은 장소에 머문 기록을 선택하세요.';node.append(title,hint);
          for(const stay of stays){const button=document.createElement('button');button.type='button';button.textContent='#'+stay.number+' · '+clock(stay.durationS)+' 체류';button.addEventListener('click',()=>{map.closePopup();showStop(stay,id,false)});node.append(button);}
          L.popup({maxWidth:280,autoPan:false}).setLatLng(point).setContent(node).openOn(map);
        };
        const marker=L.marker([point.lat,point.lng],{pane:'gpxStopsPane',icon,title:fullTitle,bubblingMouseEvents:false});
        marker._courseStops=stays;marker._courseDirection=labels.find(Boolean)?.direction;marker._courseKey=id+'-'+numbers;
        marker.on('tooltipopen',event=>{
          const node=event.tooltip.getElement();node.setAttribute('role','button');node.tabIndex=0;node.setAttribute('aria-label',fullTitle+' · 장소와 사진 보기');
          node.onclick=event=>{event.preventDefault();event.stopPropagation();choose()};
          node.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();choose()}};
        }).bindTooltip(escape(text),{pane:'gpxStopLabelsPane',permanent:true,interactive:true,direction:marker._courseDirection||'top',offset:[0,-17],className:'gpx-stop-place-label gpx-stop-place-label-'+id,opacity:1})
          .on('mouseover focus',()=>{hoveredStop=marker;scheduleLabels()}).on('mouseout blur',()=>{if(hoveredStop===marker)hoveredStop=null;scheduleLabels()})
          .on('click',choose).addTo(group);
      }
      if(active && id===day && !layer.hasLayer(group))layer.addLayer(group);
      scheduleLabels();
    }
    function renderLaps(data) {
      return '<section class="ride-laps"><div class="ride-section-title"><h2>구간 기록 <small>5 km마다</small></h2><span>행을 누르면 지도 위치 표시</span></div><div class="ride-table-scroll"><table><thead><tr><th>구간</th><th>시간</th><th>거리</th><th>평균 / 최고 속도</th><th>평균 심박</th><th>평균 케이던스</th><th>상승 / 하강</th></tr></thead><tbody>' +
        core.buildLaps(data).map((lap) => '<tr tabindex="0" role="button" aria-label="' + lap.number + '번째 구간 지도에서 보기" data-gpx-lap="' + lap.endIndex +
          '"><td>' + lap.number + '</td><td>' + clock(lap.durationS) + '</td><td>' + value(lap.distanceM / 1000, " km", 2) + '</td><td>' +
          value(lap.avgSpeedKmh) + " / " + value(lap.maxSpeedKmh) + ' km/h</td><td>' + value(lap.avgHeartRate, " bpm", 0) + '</td><td>' +
          value(lap.avgCadence, " rpm", 0) + '</td><td>' + value(lap.ascentM, "", 0) + " / " + value(lap.descentM, "", 0) + ' m</td></tr>').join("") + '</tbody></table></div></section>';
    }
    function render() {
      const item = config(), record = records.get(day), data = record?.data;
      renderIncidentSummary();
      heading.textContent = item.title; heading.style.setProperty("--ride-day-color", item.color);
      meta.textContent = data ? item.label + " · " + timestamp(data.points[0].time) + " · " + data.fileName : item.label + " · 기록을 불러오는 중입니다.";
      if (!data) { results.innerHTML = '<div class="ride-empty">이 일차의 GPX 기록을 불러오는 중입니다.</div>'; sidebar.innerHTML = ""; updateDayStyles(); return; }
      if (!data.stats.timedPairs && axis === "time") axis = "distance";
      const available = new Set(metrics.filter((m) => data.points.some((p) => finite(p[m.key]))).map((m) => m.key));
      results.innerHTML = '<div class="ride-analysis-toolbar"><h2>주행 분석 <small>Track Analysis</small></h2><div class="ride-axis-switch" role="group" aria-label="그래프 가로축"><button type="button" data-gpx-axis="time" aria-pressed="' +
        (axis === "time") + '"' + (!data.stats.timedPairs ? " disabled" : "") + '>시간</button><button type="button" data-gpx-axis="distance" aria-pressed="' + (axis === "distance") +
        '">거리</button></div></div><div class="ride-metric-toggles">' + metrics.map((m) => '<label style="--metric-color:' + m.color +
          '"><input type="checkbox" data-gpx-metric="' + m.key + '"' + (enabled.has(m.key) ? " checked" : "") +
          (!available.has(m.key) || (axis === "distance" && m.key === "distanceM") ? " disabled" : "") + '><span>' + m.title + '</span></label>').join("") +
        '</div>' + renderIncidentBar() + '<p class="ride-stop-chart-key"><i></i> 노란 구간: 장시간 체류 후보 · 지도와 로드뷰로 확인</p><div class="ride-charts" data-gpx-charts></div><div class="ride-brush"><label for="gpxWindowStart">분석 구간 시작</label><input id="gpxWindowStart" type="range" min="0" max="99" step=".1" value="' +
        windowStart + '" data-gpx-window-start><label for="gpxWindowEnd">분석 구간 끝</label><input id="gpxWindowEnd" type="range" min="1" max="100" step=".1" value="' +
        windowEnd + '" data-gpx-window-end><div><span data-gpx-window-label></span><button type="button" data-gpx-reset-window>↻ 전체 구간</button></div></div>' +
        '<section class="ride-position"><div class="ride-position-heading"><label for="gpxPosition">시간별 위치 살펴보기</label><div class="ride-position-actions"><button type="button" data-gpx-roadview>⌖ 선택 지점 로드뷰</button><button type="button" data-gpx-play>▶ 30초 요약 재생</button></div></div><input id="gpxPosition" type="range" min="0" max="' +
        (data.points.length - 1) + '" value="' + selectedIndex + '" data-gpx-position><div data-gpx-point class="ride-point-readout"></div></section>' + renderStops(data) + renderLaps(data) +
        '<div class="ride-file-actions"><button type="button" class="btn light small" data-gpx-download>GPX 원본</button><button type="button" class="btn light small" data-gpx-csv>기록 CSV</button><button type="button" class="btn light small" data-gpx-restore' +
        (!record.custom ? " disabled" : "") + '>첨부 코스로 복구</button></div><details class="ride-calculation"><summary>기록 정보와 계산 기준</summary><p>시간은 한국 시간입니다. 속도는 파일의 기록을 우선 사용하고, 없으면 좌표 간 거리와 시간으로 계산합니다. 이동 기준은 1 km/h이며 평균 속도에는 정지 시간이 포함됩니다. 분리된 구간 사이의 거리·시간은 제외합니다. 고도와 누적 상승·하강은 원본 GPS 기록 기준입니다.</p><p>' +
        data.points.length.toLocaleString("ko-KR") + '개 지점 · ' + data.segments.length + '개 구간 · 첫 기록 ' + timestamp(data.points[0].time) + ' · 마지막 기록 ' + timestamp(data.points.at(-1).time) +
        '</p></details>' + (data.warnings.length ? '<ul class="gpx-warnings">' + data.warnings.map((text) => '<li>' + escape(text) + '</li>').join("") + '</ul>' : "");
      const s = data.stats, stat = (label, text, icon = "") => '<div><dt><span>' + icon + '</span>' + label + '</dt><dd>' + text + '</dd></div>';
      sidebar.innerHTML = '<dl class="ride-summary-grid">' + stat("거리", value(s.distanceM / 1000, '<small> km</small>', 2), "⚑") +
        stat("기록 시간", clock(s.durationS), "◷") + stat("평균 속도 · 정지 포함", value(s.avgSpeedKmh, '<small> km/h</small>'), "◴") +
        stat("누적 상승", value(s.ascentM, '<small> m</small>', 0), "↗") + stat("최고 속도", value(s.maxSpeedKmh, '<small> km/h</small>'), "↝") +
        stat("누적 하강", value(s.descentM, '<small> m</small>', 0), "↘") + '</dl><dl class="ride-secondary-grid">' +
        stat("이동 시간", clock(s.movingS)) + stat("정지 시간", clock(s.stoppedS)) + stat("이동 평균 속도", value(s.movingSpeedKmh, " km/h")) +
        stat("고도 범위", value(s.minElevationM, "", 0) + " ~ " + value(s.maxElevationM, " m", 0)) + '</dl>';
      updateDayStyles(); drawCharts(); select(selectedIndex);
    }
    function stopPlayback() {
      playing = false; root.cancelAnimationFrame(playFrame); root.cancelAnimationFrame(pointerFrame); root.clearTimeout(roadviewSeekTimer);
      const button = results.querySelector("[data-gpx-play]");
      if (button) { button.textContent = "▶ 30초 요약 재생"; button.setAttribute("aria-pressed", "false"); }
    }
    function startPlayback() {
      if (playing) { stopPlayback(); return; }
      if (!current() || !totalAxis()) return;
      root.clearTimeout(roadviewSeekTimer); playing = true;
      const start = performance.now(), initial = windowStart, end = windowEnd;
      let last = 0;
      const button = results.querySelector("[data-gpx-play]");
      button.textContent = "Ⅱ 재생 멈추기"; button.setAttribute("aria-pressed", "true");
      function frame(now) {
        if (!playing || !active || document.hidden) { stopPlayback(); return; }
        const progress = Math.min(1, (now - start) / 30000);
        if (now - last > 50 || progress === 1) { select(nearest(totalAxis() * (initial + progress * (end - initial)) / 100), true); last = now; }
        if (progress === 1) stopPlayback(); else playFrame = root.requestAnimationFrame(frame);
      }
      playFrame = root.requestAnimationFrame(frame);
    }
    async function loadDefault(item, version = versions.get(item.id) || 0) {
      const response = await fetch(item.url, { cache: "no-cache" });
      if (!response.ok) throw new Error(item.label + " GPX 파일을 불러오지 못했습니다.");
      const text = await response.text(), data = core.parse(text, item.fileName);
      if ((versions.get(item.id) || 0) !== version) return;
      records.set(item.id, { data, text, custom: false }); drawDay(item.id);
      if (item.id === day) { roadview?.close(); render(); if (active) root.requestAnimationFrame(() => fit()); }
    }
    async function upload(file) {
      if (!file) return;
      if (!/\.gpx$/i.test(file.name)) { input.value = ""; message(".gpx 파일을 선택해 주세요.", true); return; }
      if (file.size > core.MAX_FILE_BYTES) { input.value = ""; message("GPX 파일은 최대 20MB까지 지원합니다.", true); return; }
      const id = day, item = config(), version = (versions.get(id) || 0) + 1;
      versions.set(id, version); input.value = ""; stopPlayback(); message(item.label + " 파일을 분석하고 있습니다.");
      try {
        const text = await file.text(), data = core.parse(text, file.name);
        if (versions.get(id) !== version) return;
        records.set(id, { data, text, custom: true }); drawDay(id);
        if (id === day) { stopCard?.close(); roadview?.close(); selectedIndex = 0; windowStart = 0; windowEnd = 100; render(); fit(); }
        onMessage(item.label + " GPX 기록을 반영했습니다.");
        try { await store.put({ day: id, text, fileName: file.name }); if (versions.get(id) === version) message(item.label + " · 이 기기에 변경한 GPX 파일을 저장했습니다."); }
        catch { if (versions.get(id) === version) message(item.label + " · 현재 화면에 반영했습니다. 기기 저장소를 이용할 수 없습니다."); }
      } catch (error) {
        if (versions.get(id) === version) {
          if (!records.has(id)) { try { await loadDefault(item, version); } catch {} }
          message(error.message, true);
        }
      }
    }
    input.addEventListener("change", () => upload(input.files[0]));
    drop.addEventListener("dragover", (event) => { event.preventDefault(); drop.classList.add("is-dragging"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("is-dragging"));
    drop.addEventListener("drop", (event) => { event.preventDefault(); drop.classList.remove("is-dragging"); upload(event.dataTransfer.files[0]); });
    element.querySelector("[data-gpx-fit]")?.addEventListener("click", () => fit());
    element.querySelector("[data-gpx-fit-all]")?.addEventListener("click", () => fit(true));
    incidentSummary?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-gpx-incident]");
      if (button) showIncident(button.dataset.gpxIncident, button.hasAttribute("data-incident-roadview"));
    });
    results.addEventListener("pointermove", (event) => { if (event.pointerType !== "touch") chartPointer(event); });
    results.addEventListener("click", async (event) => {
      const incidentButton = event.target.closest("[data-gpx-incident]");
      if (incidentButton) { showIncident(incidentButton.dataset.gpxIncident, incidentButton.hasAttribute("data-incident-roadview")); return; }
      const stopButton = event.target.closest("[data-gpx-stop]");
      if (stopButton) { const stop = stopsFor(current()).find((item) => item.startIndex === Number(stopButton.dataset.gpxStop)); if (stop) showStop(stop); return; }
      if (event.target.closest("[data-gpx-roadview]")) { const point = current()?.points[selectedIndex]; if (point) showRoadview(point, selectedPointTitle(current(), point), clock(point.elapsedS) + " · " + value(point.distanceM / 1000, " km")); }
      const button = event.target.closest("[data-gpx-axis]");
      if (button) { stopPlayback(); axis = button.dataset.gpxAxis; windowStart = 0; windowEnd = 100; render(); }
      if (event.target.closest("[data-gpx-chart]")) chartPointer(event, true);
      if (event.target.closest("[data-gpx-play]")) startPlayback();
      if (event.target.closest("[data-gpx-reset-window]")) { windowStart = 0; windowEnd = 100; render(); }
      const lap = event.target.closest("[data-gpx-lap]");
      if (lap) { stopPlayback(); select(Number(lap.dataset.gpxLap), true, true); }
      const record = records.get(day);
      if (record && event.target.closest("[data-gpx-download]")) download(record.text, record.data.fileName, "application/gpx+xml");
      if (record && event.target.closest("[data-gpx-csv]")) download(core.toCsv(record.data), record.data.fileName.replace(/\.gpx$/i, "") + "-기록.csv", "text/csv;charset=utf-8");
      if (event.target.closest("[data-gpx-restore]")) {
        const item = config(), version = (versions.get(item.id) || 0) + 1;
        versions.set(item.id, version); stopPlayback();
        try { await loadDefault(item, version); selectedIndex = 0; windowStart = 0; windowEnd = 100; render(); fit(); await store.remove(item.id); message(item.label + " 첨부 GPX 코스로 복구했습니다."); }
        catch (error) { message(error.message, true); }
      }
    });
    results.addEventListener("keydown", (event) => { const lap = event.target.closest("[data-gpx-lap]"); if (lap && ["Enter", " "].includes(event.key)) { event.preventDefault(); select(Number(lap.dataset.gpxLap), true, true); } });
    results.addEventListener("input", (event) => {
      if (event.target.matches("[data-gpx-position]")) { stopPlayback(); select(Number(event.target.value), true); }
      if (event.target.matches("[data-gpx-window-start]")) { stopPlayback(); windowStart = Math.min(Number(event.target.value), windowEnd - 1); event.target.value = windowStart; drawCharts(); }
      if (event.target.matches("[data-gpx-window-end]")) { stopPlayback(); windowEnd = Math.max(Number(event.target.value), windowStart + 1); event.target.value = windowEnd; drawCharts(); }
    });
    results.addEventListener("change", (event) => {
      if (event.target.matches("[data-gpx-stop-min]")) { minimumStopS = Number(event.target.value); results.querySelector(".ride-stops").outerHTML = renderStops(current()); for (const id of records.keys()) drawStops(id); drawCharts(); return; }
      if (event.target.matches("[data-gpx-metric]")) { if (event.target.checked) enabled.add(event.target.dataset.gpxMetric); else enabled.delete(event.target.dataset.gpxMetric); drawCharts(); }
    });
    const resize = new ResizeObserver(() => { root.cancelAnimationFrame(resizeFrame); resizeFrame = root.requestAnimationFrame(() => { if (active) { map?.invalidateSize({ pan: false }); drawCharts(); scheduleLabels(); } }); });
    resize.observe(element);
    resize.observe(dock);
    media.addEventListener("change", () => { stopCard?.close(); attachContainer(); updateDayStyles(); if (active) root.requestAnimationFrame(() => { fit(); drawCharts(); }); });
    element.querySelector(".course-mobile-nav").addEventListener("click", (event) => {
      const button = event.target.closest("[data-course-mobile-screen]");
      if (!button) return;
      mobileScreen = button.dataset.courseMobileScreen; stopPlayback(); attachContainer();
      const url = new URL(location.href); url.searchParams.set("screen",mobileScreen); history.replaceState(history.state,"",url);
      element.scrollTo({top:0,behavior:"instant"});
      root.requestAnimationFrame(() => { fit(); drawCharts(); });
    });
    dock.querySelector("[data-course-dock-toggle]").addEventListener("click", (event) => {
      const collapsed = shell.classList.toggle("course-dock-collapsed");
      event.target.setAttribute("aria-expanded",String(!collapsed));
      event.target.textContent = collapsed ? "주행 분석 펼치기" : "분석 접기";
      root.setTimeout(() => { if (active) fit(); },100);
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stopPlayback(); });
    root.addEventListener("pagehide", stopPlayback);
    for (const button of element.querySelectorAll("[data-gpx-fit], [data-gpx-fit-all]")) button.disabled = true;
    render();
    async function initialize() {
      const savedPromise = store.all().catch(() => []);
      await Promise.all(defaults.map(async (item) => { try { await loadDefault(item); } catch (error) { message(error.message, true); } }));
      for (const saved of await savedPromise) {
        if (!defaults.some((item) => item.id === saved.day) || versions.get(saved.day)) continue;
        try { records.set(saved.day, { data: core.parse(saved.text, saved.fileName), text: saved.text, custom: true }); drawDay(saved.day); } catch {}
      }
      render(); if (active) fit(); message(records.size + "일차 GPX 기록을 불러왔습니다. 기존 코스는 회색으로 표시합니다.");
    }
    initialize();
    return {
      attachMap(options) {
        map = options.map; L = options.L; mapHome = map.getContainer().parentElement;
        for (const button of element.querySelectorAll("[data-gpx-fit], [data-gpx-fit-all]")) button.disabled = false;
        map.createPane("uploadedGpxPane"); map.getPane("uploadedGpxPane").style.zIndex = "450";
        map.createPane("gpxStopsPane"); map.getPane("gpxStopsPane").style.zIndex = "695";
        map.createPane("gpxStopLabelsPane"); map.getPane("gpxStopLabelsPane").style.zIndex = "690";
        map.createPane("gpxSelectionPane"); map.getPane("gpxSelectionPane").style.zIndex = "698";
        layer = L.layerGroup().addTo(map);
        map.createPane("courseIncidentPane"); map.getPane("courseIncidentPane").style.zIndex = "660";
        incidentLayer = L.layerGroup();
        if (active) incidentLayer.addTo(map);
        drawIncidents();
        for (const id of records.keys()) drawDay(id);
        const bicycle = '<span class="gpx-rider-badge"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="7" cy="23" r="5.5"/><circle cx="25" cy="23" r="5.5"/><path d="M7 23l6-12 7 12H7l9-9h6l3 9M11 11h5M21 14l-2-7h-4"/><circle class="rider-head" cx="19" cy="4" r="2"/></svg></span>';
        highlight = L.marker([33.5,126.5],{pane:'gpxSelectionPane',icon:L.divIcon({className:'gpx-rider-marker',html:bicycle,iconSize:[44,44],iconAnchor:[22,22],popupAnchor:[0,-22]}),title:'주행분석 선택 위치 · 자전거',opacity:0,bubblingMouseEvents:false,zIndexOffset:1000}).addTo(layer);
        map.on("zoomend", () => { drawStops(day); updateDayStyles(); });
        map.on("moveend resize",scheduleLabels);
        attachContainer(); updateDayStyles(); select(selectedIndex); return layer;
      },
      showMapError(text) {
        const error = document.createElement("p"); error.className = "map-load-error"; error.textContent = text;
        slot.replaceChildren(error);
      },
      setJournal(value) { journal = value; stopCard?.setJournal(value); refreshStopPhotos(); },
      refreshStopPhotos,
      setContextLayers(items) { contextLayers = items.filter(Boolean); },
      setActive(next) {
        const changed = active !== next; active = next; shell.classList.toggle("course-analysis-active", next);
        if (map) {
          attachContainer();
          if (changed && next) { for (const item of contextLayers) { previousContext.set(item, map.hasLayer(item)); if (map.hasLayer(item)) map.removeLayer(item); } }
          else if (changed) { for (const [item, shown] of previousContext) if (shown && !map.hasLayer(item)) item.addTo(map); previousContext.clear(); }
          if (next) root.setTimeout(() => { if (active) fit(); }, 100);
        }
        for (const group of restLayers.values()) { if (next && group===restLayers.get(day) && !layer?.hasLayer(group)) layer?.addLayer(group); else if (!next && layer?.hasLayer(group)) layer.removeLayer(group); }
        if (map && incidentLayer) { if (next && !map.hasLayer(incidentLayer)) incidentLayer.addTo(map); else if (!next && map.hasLayer(incidentLayer)) map.removeLayer(incidentLayer); }
        if (!next) { stopPlayback(); stopCard?.close(); roadview?.close(); highlight?.closePopup(); } select(selectedIndex);
      },
      setDay(id) { if (!defaults.some((item) => item.id === id)) return; stopCard?.close(); roadview?.close(); highlight?.closePopup(); day = id; selectedIndex = 0; windowStart = 0; windowEnd = 100; stopPlayback(); render(); if (active) fit(); },
      hasDay(id) { return records.has(id); }, fit,
      getSelectedPoint() { return current()?.points[selectedIndex]; },
      getMapPadding: mapPadding,
      showMapPage() { mobileScreen = "map"; attachContainer(); },
      isEditing() { return !!element.querySelector("[data-legacy-course-editor]")?.open; }
    };
  }
  root.JejuGpxViewer = { create, defaults };
})(typeof window !== "undefined" ? window : globalThis);
