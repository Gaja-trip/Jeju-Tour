(function (root) {
  "use strict";
  const MAX_AGE_MS = 120000;

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

  const api = { MAX_AGE_MS, positionPayload, freshLocation, LocationPublisher };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.JejuLocationCore = api;
})(globalThis);
