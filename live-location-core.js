(function (root) {
  "use strict";
  const MAX_AGE_MS = 120000;
  const PARTICIPANT_COLORS = Object.freeze([
    { name: "빨강", fillColor: "#e53935" },
    { name: "주황", fillColor: "#f58220" },
    { name: "노랑", fillColor: "#f6d32d" },
    { name: "초록", fillColor: "#159447" },
    { name: "파랑", fillColor: "#2475e8" },
    { name: "남색", fillColor: "#283593" },
    { name: "보라", fillColor: "#8e44ad" },
    { name: "흰색", fillColor: "#ffffff" }
  ].map(Object.freeze));
  const UNKNOWN_COLOR = Object.freeze({ name: "미지정", fillColor: "#69757c" });

  function participantStyle(slot) {
    const color = Number.isInteger(slot) && slot >= 1 && slot <= 8
      ? PARTICIPANT_COLORS[slot - 1] : UNKNOWN_COLOR;
    return { ...color, color: "#263238", weight: 3, fillOpacity: 1 };
  }

  function positionPayload(position, now = Date.now()) {
    const { latitude, longitude, accuracy } = position.coords || {};
    if (![latitude, longitude, accuracy, position.timestamp].every(Number.isFinite)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
      || accuracy < 0 || accuracy > 10000
      || position.timestamp < now - MAX_AGE_MS || position.timestamp > now + 30000) return null;
    return { p_latitude: latitude, p_longitude: longitude, p_accuracy: accuracy,
      p_recorded_at: new Date(position.timestamp).toISOString() };
  }

  function freshLocation(row, now = Date.now()) {
    const updated = Date.parse(row.updated_at);
    return row.sharing === true && Number.isFinite(row.latitude) && Number.isFinite(row.longitude)
      && Math.abs(row.latitude) <= 90 && Math.abs(row.longitude) <= 180
      && Number.isFinite(updated) && updated > now - MAX_AGE_MS && updated <= now + 30000;
  }

  class LocationPublisher {
    constructor({ rpc, tripId, onResult = () => {}, now = Date.now, interval = 10000 }) {
      Object.assign(this, { rpc, tripId, onResult, now, interval });
      this.shareId = null;
      this.lastSent = -Infinity;
      this.pending = null;
      this.inFlight = null;
      this.timer = null;
    }

    activate(shareId) {
      this.cancel();
      this.shareId = shareId;
      this.lastSent = -Infinity;
    }

    enqueue(position) {
      if (!this.shareId) return;
      const payload = positionPayload(position, this.now());
      if (!payload) return;
      if (this.pending && this.pending.p_recorded_at >= payload.p_recorded_at) return;
      this.pending = payload;
      this.flush();
    }

    flush() {
      if (!this.shareId || !this.pending || this.inFlight) return;
      const wait = this.interval - (this.now() - this.lastSent);
      if (wait > 0) {
        if (!this.timer) this.timer = setTimeout(() => { this.timer = null; this.flush(); }, wait);
        return;
      }
      const shareId = this.shareId;
      const payload = this.pending;
      this.pending = null;
      this.lastSent = this.now();
      this.inFlight = Promise.resolve().then(() => this.rpc("jeju_publish_location", {
        p_trip_id: this.tripId, p_share_id: shareId, ...payload
      })).then((result) => {
        if (this.shareId === shareId) this.onResult(result);
      }, (error) => {
        if (this.shareId === shareId) this.onResult({ error });
      }).finally(() => {
        this.inFlight = null;
        this.flush();
      });
    }

    cancel() {
      this.shareId = null;
      this.pending = null;
      clearTimeout(this.timer);
      this.timer = null;
    }

    async stop() {
      const shareId = this.shareId;
      this.cancel();
      // The server also rejects delayed packets using the ended sharing session ID.
      if (shareId) return this.rpc("jeju_stop_sharing", { p_trip_id: this.tripId, p_share_id: shareId });
      return { error: null };
    }
  }

  const api = { MAX_AGE_MS, PARTICIPANT_COLORS, participantStyle, positionPayload, freshLocation, LocationPublisher };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.JejuLocationCore = api;
})(globalThis);
