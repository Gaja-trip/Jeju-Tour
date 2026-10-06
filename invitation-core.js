(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.JejuInvitation = api;
})(typeof window === "object" ? window : globalThis, function () {
  "use strict";
  function tokenFrom(value, origin) {
    const text = String(value || "").trim();
    if (/^[A-Za-z0-9_-]{43}$/.test(text)) return text;
    try {
      const url = new URL(text);
      if (url.origin !== origin || url.pathname !== "/course.html") return "";
      const tokens = new URLSearchParams(url.hash.slice(1)).getAll("invite");
      return tokens.length === 1 && /^[A-Za-z0-9_-]{43}$/.test(tokens[0]) ? tokens[0] : "";
    } catch { return ""; }
  }
  function takeFromLocation(location, history) {
    const token = tokenFrom(location.href, location.origin);
    if (new URLSearchParams(location.hash.slice(1)).has("invite")) {
      history.replaceState(history.state, "", location.pathname + location.search);
    }
    return token;
  }
  return { tokenFrom, takeFromLocation };
});
