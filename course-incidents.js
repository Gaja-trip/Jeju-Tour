(function (root) {
  "use strict";
  // Addresses supplied by the user. Coordinates checked with Kakao Geocoder on 2026-10-12.
  // Incident 1 follows the CU-front GPX stop, as explicitly confirmed by the user.
  const locations = [
    { id: "incident1", number: 1, day: "day1", address: "제주시 이호일동 1962번지", shortAddress: "이호일동 1962",
      lat: 33.4970366, lng: 126.4519783, positionLabel: "CU 앞 GPX 정지 지점 기준",
      addressPosition: { lat: 33.4972467700035, lng: 126.449510974237 } },
    { id: "incident2", number: 2, day: "day1", address: "제주시 한림읍 귀덕리 3025-4번지", shortAddress: "귀덕리 3025-4",
      lat: 33.442234993172, lng: 126.289658570096, positionLabel: "지정 주소 기준",
      addressPosition: { lat: 33.442234993172, lng: 126.289658570096 } }
  ];
  const cache = new WeakMap();
  function match(data, location, maxDistanceM = 80) {
    const core = root.JejuGpxCore;
    if (!core || !data?.points?.length || !Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return null;
    let nearest = null, nearestM = Infinity;
    for (const p of data.points) {
      const d = core.distance(p, location);
      if (d < nearestM) { nearest = p; nearestM = d; }
    }
    if (!cache.has(data)) cache.set(data, core.detectStops(data));
    let candidate = null, candidateM = Infinity;
    for (const stop of cache.get(data)) {
      let closest = null, closestM = Infinity, stationary = null, stationaryM = Infinity;
      for (let i = stop.startIndex; i <= stop.endIndex; i += 1) {
        const p = data.points[i], d = core.distance(p, location);
        if (d < closestM) { closest = p; closestM = d; }
        if (Number.isFinite(p.speedKmh) && p.speedKmh <= 1 && d < stationaryM) { stationary = p; stationaryM = d; }
      }
      const point = stationaryM <= maxDistanceM ? stationary : closest;
      const offsetM = stationaryM <= maxDistanceM ? stationaryM : closestM;
      if (offsetM <= maxDistanceM && offsetM < candidateM) { candidate = { point, stop, offsetM }; candidateM = offsetM; }
    }
    if (candidate) return candidate;
    return nearestM <= maxDistanceM ? { point: nearest, stop: null, offsetM: nearestM } : null;
  }
  const api = { locations, match };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.JejuCourseIncidents = api;
})(typeof window !== "undefined" ? window : globalThis);
