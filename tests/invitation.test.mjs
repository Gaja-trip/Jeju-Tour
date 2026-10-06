import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
const { tokenFrom, takeFromLocation } = createRequire(import.meta.url)("../invitation-core.js");
const token = "A".repeat(43);
const origin = "https://jeju-gaja.vercel.app";
test("personal tokens and exact-site fragment links are accepted", () => {
  assert.equal(tokenFrom(token, origin), token);
  assert.equal(tokenFrom(`${origin}/course.html?panel=participants#invite=${token}`, origin), token);
});
test("foreign origins, query tokens, duplicate fragments and malformed tokens are rejected", () => {
  for (const value of ["A".repeat(42), token + "!", `${origin}/course.html?invite=${token}`,
    `https://evil.invalid/course.html#invite=${token}`, `${origin}/course.html#invite=${token}&invite=${token}`,
    `${origin}/other.html#invite=${token}`, `${origin}.evil.invalid/course.html#invite=${token}`]) {
    assert.equal(tokenFrom(value, origin), "");
  }
});
test("invitation secrets are removed from browser history even when invalid", () => {
  for (const value of [token, "wrong"]) {
    const location = new URL(`${origin}/course.html?panel=participants#invite=${value}`);
    let replacement;
    const history = { state: { panel: 1 }, replaceState(state, title, path) { replacement = { state, path }; } };
    assert.equal(takeFromLocation(location, history), value === token ? token : "");
    assert.deepEqual(replacement, { state: history.state, path: "/course.html?panel=participants" });
  }
});
