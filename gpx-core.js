(function (root) {
  "use strict";

  const MAX_FILE_BYTES = 20 * 1024 * 1024;
  const MAX_POINTS = 150000;
  const finite = (value) => typeof value === "number" && Number.isFinite(value);
  const number = (value) => value !== null && String(value).trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
  const children = (node, name) => Array.from(node?.children || []).filter((child) => child.localName === name && child.namespaceURI === node.namespaceURI);
  const childText = (node, name) => children(node, name)[0]?.textContent.trim() || "";

  function distance(a, b) {
    const radians = Math.PI / 180;
    const lat = (b.lat - a.lat) * radians;
    const lng = (b.lng - a.lng) * radians;
    const h = Math.sin(lat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(lng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
  }

  function analyzeSegments(segments) {
    const points = [];
    const analyzed = [];
    let distanceM = 0, timedDistanceM = 0, durationS = 0, movingS = 0, movingDistanceM = 0;
    let ascentM = 0, descentM = 0, elevationPairs = 0, timedPairs = 0, invalidTimes = 0;
    let minElevationM = null, maxElevationM = null, maxSpeedKmh = null;
    let heartRateTotal = 0, heartRateCount = 0, cadenceTotal = 0, cadenceCount = 0;
    let elevationCount = 0, timeCount = 0;
    for (const segment of segments) {
      const result = [];
      let previous = null;
      for (const raw of segment) {
        const point = { ...raw, index: points.length, segmentIndex: analyzed.length, distanceM, speedKmh: null, gradePercent: null };
        if (finite(point.elevation)) {
          elevationCount += 1;
          minElevationM = minElevationM === null ? point.elevation : Math.min(minElevationM, point.elevation);
          maxElevationM = maxElevationM === null ? point.elevation : Math.max(maxElevationM, point.elevation);
        }
        if (finite(point.time)) timeCount += 1;
        if (finite(point.heartRate)) { heartRateTotal += point.heartRate; heartRateCount += 1; }
        if (finite(point.cadence)) { cadenceTotal += point.cadence; cadenceCount += 1; }
        if (finite(point.recordedSpeedKmh) && point.recordedSpeedKmh >= 0) point.speedKmh = point.recordedSpeedKmh;
        if (previous) {
          const legM = distance(previous, point);
          distanceM += legM;
          point.distanceM = distanceM;
          if (finite(previous.elevation) && finite(point.elevation)) {
            const delta = point.elevation - previous.elevation;
            ascentM += Math.max(0, delta);
            descentM += Math.max(0, -delta);
            elevationPairs += 1;
            if (legM >= 1) point.gradePercent = delta / legM * 100;
          }
          if (finite(previous.time) && finite(point.time)) {
            const seconds = (point.time - previous.time) / 1000;
            if (seconds > 0) {
              const calculatedSpeed = legM / seconds * 3.6;
              if (point.speedKmh === null) point.speedKmh = calculatedSpeed;
              durationS += seconds;
              timedDistanceM += legM;
              timedPairs += 1;
              // Moving intervals require displacement and at least 1 km/h.
              if (calculatedSpeed >= 1) { movingS += seconds; movingDistanceM += legM; }
            } else { invalidTimes += 1; }
          }
        }
        if (point.speedKmh !== null) maxSpeedKmh = maxSpeedKmh === null ? point.speedKmh : Math.max(maxSpeedKmh, point.speedKmh);
        result.push(point);
        points.push(point);
        previous = point;
      }
      if (result.length) analyzed.push(result);
    }
    return { segments: analyzed, points, stats: {
      distanceM, timedDistanceM, durationS: timedPairs ? durationS : null,
      movingS: timedPairs ? movingS : null, stoppedS: timedPairs ? durationS - movingS : null,
      avgSpeedKmh: timedPairs ? timedDistanceM / durationS * 3.6 : null,
      movingSpeedKmh: movingS > 0 ? movingDistanceM / movingS * 3.6 : null,
      maxSpeedKmh, ascentM: elevationPairs ? ascentM : null, descentM: elevationPairs ? descentM : null,
      minElevationM, maxElevationM, elevationCount, timeCount, timedPairs, invalidTimes,
      avgHeartRate: heartRateCount ? heartRateTotal / heartRateCount : null,
      avgCadence: cadenceCount ? cadenceTotal / cadenceCount : null,
      pointCount: points.length, segmentCount: analyzed.length
    } };
  }

  function readPoint(element) {
    const lat = number(element.getAttribute("lat")), lng = number(element.getAttribute("lon"));
    if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    const timeText = childText(element, "time");
    // GPX timestamps are ISO 8601; do not interpret arbitrary text as a date.
    const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.test(timeText) ? Date.parse(timeText) : NaN;
    const extensions = children(element, "extensions")[0];
    const extensionNodes = extensions ? Array.from(extensions.getElementsByTagName("*")) : [];
    const speedElement = children(element, "speed")[0] || extensionNodes.find((node) => node.localName.toLowerCase() === "speed");
    let speed = speedElement ? number(speedElement.textContent) : null;
    const unit = (speedElement?.getAttribute("unit") || speedElement?.getAttribute("units") || "m/s").toLowerCase();
    if (speed !== null) {
      if (["m/s", "mps", "meters/second"].includes(unit)) speed *= 3.6;
      else if (!["km/h", "kmh", "kph"].includes(unit)) speed = null;
    }
    const sensor = (names) => {
      const node = extensionNodes.find((item) => names.includes(item.localName.toLowerCase()));
      const value = node ? number(node.textContent) : null;
      return value !== null && value >= 0 ? value : null;
    };
    return { lat, lng, elevation: number(childText(element, "ele")), time: Number.isFinite(timestamp) ? timestamp : null,
      recordedSpeedKmh: speed !== null && speed >= 0 ? speed : null,
      heartRate: sensor(["hr", "heartrate"]), cadence: sensor(["cad", "cadence"]), name: childText(element, "name").slice(0, 200) };
  }

  function parse(text, fileName = "route.gpx", Parser = root.DOMParser) {
    if (typeof text !== "string" || !text.trim()) throw new Error("빈 GPX 파일입니다.");
    if (new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw new Error("GPX 파일은 최대 20MB까지 불러올 수 있습니다.");
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("외부 엔티티를 포함한 XML은 불러올 수 없습니다.");
    if (!Parser) throw new Error("이 브라우저에서 GPX 분석을 지원하지 않습니다.");
    const doc = new Parser().parseFromString(text, "application/xml");
    if (doc.getElementsByTagName("parsererror").length || doc.documentElement?.localName !== "gpx") {
      throw new Error("올바른 GPX XML 파일이 아닙니다. 파일 내용을 확인하세요.");
    }
    const gpx = doc.documentElement;
    const tracks = children(gpx, "trk"), routes = children(gpx, "rte");
    const containers = tracks.flatMap((track) => children(track, "trkseg"));
    let invalidPoints = 0, examined = 0;
    function readContainers(nodes, tag) {
      const result = [];
      for (const container of nodes) {
        let segment = [];
        for (const element of children(container, tag)) {
          if (++examined > MAX_POINTS) throw new Error("기록 지점은 최대 150,000개까지 지원합니다. GPX 파일을 나누어 주세요.");
          const point = readPoint(element);
          if (point) segment.push(point);
          else {
            invalidPoints += 1;
            if (segment.length) result.push(segment);
            segment = [];
          }
        }
        if (segment.length) result.push(segment);
      }
      return result;
    }
    let segments = readContainers(containers, "trkpt");
    const hasTrack = segments.some((segment) => segment.length >= 2);
    if (!hasTrack) segments = readContainers(routes, "rtept");
    if (!segments.some((segment) => segment.length >= 2)) throw new Error("연속된 유효 좌표가 2개 이상 있는 트랙 또는 경로가 필요합니다.");
    const waypoints = [];
    for (const element of children(gpx, "wpt")) {
      if (++examined > MAX_POINTS) throw new Error("기록 지점은 최대 150,000개까지 지원합니다.");
      const point = readPoint(element);
      if (point) waypoints.push(point);
    }
    const data = analyzeSegments(segments), metadata = children(gpx, "metadata")[0];
    const warnings = [];
    if (invalidPoints) warnings.push("잘못된 좌표 " + invalidPoints + "개를 제외하고 해당 위치에서 구간을 나누었습니다.");
    if (hasTrack && routes.length) warnings.push("트랙과 경로가 함께 있어 트랙 기준으로 분석했습니다.");
    if (data.stats.elevationCount < data.points.length) warnings.push("고도가 없는 지점은 고도·경사 계산에서 제외합니다.");
    if (!data.stats.timedPairs) warnings.push("연속된 시간 기록이 없어 시간과 평균 속도를 계산할 수 없습니다.");
    else if (data.stats.timeCount < data.points.length) warnings.push("일부 시간 기록이 없어 시간·평균 속도는 기록된 구간만 계산합니다.");
    if (data.stats.invalidTimes) warnings.push("시간이 같거나 역순인 구간 " + data.stats.invalidTimes + "개를 시간·평균 속도 계산에서 제외합니다.");
    return { ...data, waypoints, warnings, fileName, name: (childText(metadata || gpx, "name") || childText(hasTrack ? tracks[0] : routes[0], "name") || fileName).slice(0, 200),
      description: childText(metadata || gpx, "desc").slice(0, 2000), source: hasTrack ? "트랙" : "경로" };
  }

  function toCsv(data) {
    const quote = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
    const rows = [["구간", "지점", "위도", "경도", "누적 거리(km)", "고도(m)", "속도(km/h)", "경사(%)", "시간(UTC)", "심박(bpm)", "케이던스(rpm)"]];
    for (const point of data.points) rows.push([point.segmentIndex + 1, point.index + 1, point.lat, point.lng, (point.distanceM / 1000).toFixed(4),
      point.elevation, point.speedKmh?.toFixed(2), point.gradePercent?.toFixed(2), finite(point.time) ? new Date(point.time).toISOString() : "", point.heartRate, point.cadence]);
    return "\uFEFF" + rows.map((row) => row.map(quote).join(",")).join("\r\n");
  }

  const api = { parse, analyzeSegments, distance, toCsv, MAX_FILE_BYTES, MAX_POINTS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.JejuGpxCore = api;
})(typeof window !== "undefined" ? window : globalThis);
