(function (root) {
  "use strict";
  const RADIUS_M = 10;
  const MAX_ACCURACY_M = 15;
  const MAX_AGE_MS = 15000;
  const REARM_M = 30;
  const REARM_MS = 30000;

  function validPoint(point) {
    return point && Number.isFinite(point.lat) && Number.isFinite(point.lng)
      && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
  }

  function distanceMeters(a, b) {
    const radians = Math.PI / 180;
    const dLat = (b.lat - a.lat) * radians;
    const dLng = (b.lng - a.lng) * radians;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * radians)
      * Math.cos(b.lat * radians) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
  }

  function targetsForDay({ routes, plan, dayId }) {
    const saved = plan[dayId];
    let points = routes[dayId]?.points || [];
    if (saved?.mapRoute) {
      const waypoints = Array.isArray(saved.waypoints) ? saved.waypoints : [];
      const path = Array.isArray(saved.path) ? saved.path : [];
      const endpoint = (point, fallback, name) => ({
        lat: point?.actualLat ?? point?.lat ?? fallback?.lat,
        lng: point?.actualLng ?? point?.lng ?? fallback?.lng,
        name: name || point?.placeName || point?.name || fallback?.name
      });
      points = [
        endpoint(saved.startPoint, waypoints[0] || path[0], saved.startName),
        ...waypoints.slice(1, -1).filter((point) => !/^주 경로 (접속|이탈)/.test(point.name || "")),
        endpoint(saved.endPoint, waypoints.at(-1) || path.at(-1), saved.endName)
      ];
    }
    const unique = new Map();
    for (const point of points) {
      if (!validPoint(point)) continue;
      const key = `${dayId}|${point.lat.toFixed(6)}|${point.lng.toFixed(6)}`;
      if (!unique.has(key)) unique.set(key, { ...point, key, dayId, name: point.name || "저장 지점" });
    }
    return [...unique.values()];
  }

  function createMonitor({ getTargets, onArrival, onQuality = () => {}, now = Date.now }) {
    const visits = new Map();
    let lastTimestamp = -Infinity;
    return {
      update(position) {
        const time = now();
        const { latitude, longitude, accuracy } = position?.coords || {};
        const point = { lat: latitude, lng: longitude };
        if (!validPoint(point) || !Number.isFinite(accuracy) || accuracy < 0
          || !Number.isFinite(position.timestamp) || position.timestamp < time - MAX_AGE_MS
          || position.timestamp > time + 1000 || position.timestamp <= lastTimestamp) return;
        lastTimestamp = position.timestamp;
        onQuality(accuracy <= MAX_ACCURACY_M, accuracy);
        if (accuracy > MAX_ACCURACY_M) return;
        const arrivals = [];
        for (const target of getTargets()) {
          if (!validPoint(target)) continue;
          const distance = distanceMeters(point, target);
          const visit = visits.get(target.key);
          if (visit) {
            // Re-arm only after two confident outside fixes, not boundary jitter.
            if (distance - accuracy > REARM_M && time - visit.at >= REARM_MS) {
              visit.outside += 1;
              if (visit.outside >= 2) visits.delete(target.key);
            } else visit.outside = 0;
            continue;
          }
          if (distance <= RADIUS_M) arrivals.push({ ...target, distance });
        }
        // Co-located start/end and sight markers produce one three-tone signal.
        if (arrivals.length && onArrival(arrivals) !== false) {
          for (const target of arrivals) visits.set(target.key, { at: time, outside: 0 });
        }
      }
    };
  }

  function createBeeper({ AudioContext = root.AudioContext || root.webkitAudioContext,
    onUnavailable = () => {}, onPlaying = () => {} } = {}) {
    let context, generation = 0;
    const voices = new Set();
    function stop() {
      generation += 1;
      for (const voice of voices) {
        voice.oscillator.onended = null;
        try { voice.oscillator.stop(); } catch { /* Already ended. */ }
        voice.oscillator.disconnect();
        voice.gain.disconnect();
      }
      voices.clear();
      onPlaying(false);
    }
    function release() {
      stop();
      const previous = context;
      context = null;
      if (previous && previous.state !== "closed") previous.close().catch(() => {});
    }
    return {
      async unlock() {
        if (!AudioContext) throw new Error("audio_unavailable");
        if (!context || context.state === "closed") context = new AudioContext();
        const current = context;
        await current.resume();
        if (current !== context || current.state !== "running") throw new Error("audio_blocked");
        current.onstatechange = () => {
          if (current === context && current.state !== "running") {
            stop();
            onUnavailable();
          }
        };
      },
      play() {
        if (voices.size) return false;
        if (!context || context.state !== "running") { onUnavailable(); return false; }
        const run = ++generation;
        try {
          for (let index = 0; index < 3; index += 1) {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const voice = { oscillator, gain };
            voices.add(voice);
            const start = context.currentTime + .03 + index * .45;
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(880, start);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(.22, start + .015);
            gain.gain.setValueAtTime(.22, start + .17);
            gain.gain.linearRampToValueAtTime(0, start + .22);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.onended = () => {
              oscillator.disconnect(); gain.disconnect(); voices.delete(voice);
              if (run === generation && !voices.size) onPlaying(false);
            };
            oscillator.start(start);
            oscillator.stop(start + .23);
          }
          onPlaying(true);
          return true;
        } catch { stop(); onUnavailable(); return false; }
      },
      stop, release
    };
  }

  function createController({ getTargets, onEnable = () => {}, onState = () => {},
    onMessage = () => {}, isVisible = () => !root.document?.hidden, now = Date.now,
    beeperFactory = createBeeper }) {
    let enabled = false, pending = false, playing = false, generation = 0, monitor, qualityMessage = "";
    const state = () => onState({ enabled, pending, playing });
    const beeper = beeperFactory({
      onPlaying(value) { playing = value; state(); },
      onUnavailable() {
        stop();
        onMessage("알림 소리가 중단되었습니다. 종 아이콘을 눌러 다시 켜 주세요.");
      }
    });
    function stop() {
      generation += 1;
      enabled = pending = playing = false;
      monitor = null;
      beeper.release();
      state();
    }
    async function start() {
      if (enabled || pending) return;
      if (!getTargets().length) { onMessage("먼저 출발·도착 지점이 있는 코스를 저장해 주세요."); return; }
      const run = ++generation;
      pending = true;
      state();
      try {
        // Audio is unlocked here, directly from the user's bell-button click.
        await beeper.unlock();
        if (run !== generation) return;
        enabled = true;
        pending = false;
        qualityMessage = "";
        monitor = createMonitor({ getTargets, now,
          onQuality(good, accuracy) {
            const message = good ? "" : `도착 알림 대기 · GPS 오차 약 ${Math.round(accuracy)}m`;
            if (message && message !== qualityMessage) onMessage(message);
            if (good && qualityMessage) onMessage("GPS 신호 정상 · 10m 도착 알림 대기");
            qualityMessage = message;
          },
          onArrival(targets) {
            if (!beeper.play()) return false;
            onMessage(`${[...new Set(targets.map((target) => target.name))].join(" · ")} · 10m 이내 도착`);
            return true;
          }
        });
        state();
        onMessage("도착 알림을 켰습니다. 1~4일차 저장 지점에 10m 이내 접근하면 3회 울립니다.");
        onEnable();
      } catch {
        if (run !== generation) return;
        stop();
        onMessage("알림 소리를 켜지 못했습니다. 종 아이콘을 다시 눌러 주세요.");
      }
    }
    return {
      start, stop,
      pause() { beeper.stop(); },
      update(position) { if (enabled && isVisible()) monitor?.update(position); },
      toggle() {
        if (enabled || pending) { stop(); onMessage("도착 알림을 껐습니다."); }
        else return start();
      }
    };
  }

  const api = { RADIUS_M, MAX_ACCURACY_M, MAX_AGE_MS, REARM_M, REARM_MS, distanceMeters, targetsForDay,
    createMonitor, createBeeper, createController };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.JejuArrivalAlarm = api;
})(globalThis);
