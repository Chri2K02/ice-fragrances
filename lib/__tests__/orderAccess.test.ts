import { describe, it, expect } from "vitest";
import {
  signOrderAccess,
  verifyOrderAccess,
  addOrderToCookie,
  hasOrderAccess,
} from "@/lib/orderAccess";

// Fixed test secret injected through the seam — never the real prod secret.
const SECRET = "test-secret-orderaccess";

describe("orderAccess", () => {
  it("round-trips a signed id list", () => {
    const cookie = signOrderAccess([1, 2, 3], SECRET);
    expect(verifyOrderAccess(cookie, SECRET)).toEqual([1, 2, 3]);
  });

  it("returns [] for missing / empty / malformed values", () => {
    expect(verifyOrderAccess(undefined, SECRET)).toEqual([]);
    expect(verifyOrderAccess("", SECRET)).toEqual([]);
    expect(verifyOrderAccess("no-dot-here", SECRET)).toEqual([]);
    expect(verifyOrderAccess("a.b.c", SECRET)).toEqual([]);
  });

  it("returns [] when the value is tampered with", () => {
    const cookie = signOrderAccess([7, 8], SECRET);
    // Flip the first char of the payload half (keeps length, breaks signature).
    const flipped = (cookie[0] === "x" ? "y" : "x") + cookie.slice(1);
    expect(verifyOrderAccess(flipped, SECRET)).toEqual([]);
  });

  it("returns [] when verified with the wrong secret", () => {
    const cookie = signOrderAccess([42], SECRET);
    expect(verifyOrderAccess(cookie, "a-different-secret")).toEqual([]);
  });

  it("addOrderToCookie unions and dedupes, keeping most-recent last", () => {
    let cookie = signOrderAccess([1, 2], SECRET);
    cookie = addOrderToCookie(cookie, 3, SECRET);
    expect(verifyOrderAccess(cookie, SECRET)).toEqual([1, 2, 3]);
    // Re-adding an existing id moves it to most-recent, no duplicate.
    cookie = addOrderToCookie(cookie, 1, SECRET);
    expect(verifyOrderAccess(cookie, SECRET)).toEqual([2, 3, 1]);
  });

  it("addOrderToCookie starts fresh from an undefined/tampered cookie", () => {
    const fromUndefined = addOrderToCookie(undefined, 5, SECRET);
    expect(verifyOrderAccess(fromUndefined, SECRET)).toEqual([5]);
    const fromGarbage = addOrderToCookie("garbage.sig", 9, SECRET);
    expect(verifyOrderAccess(fromGarbage, SECRET)).toEqual([9]);
  });

  it("addOrderToCookie caps to the most-recent 50 ids", () => {
    let cookie: string | undefined;
    for (let i = 1; i <= 60; i++) cookie = addOrderToCookie(cookie, i, SECRET);
    const ids = verifyOrderAccess(cookie, SECRET);
    expect(ids).toHaveLength(50);
    // Oldest 10 dropped; most-recent kept in order.
    expect(ids[0]).toBe(11);
    expect(ids[ids.length - 1]).toBe(60);
  });

  it("fails closed in production when no secret is configured", () => {
    const prevNode = process.env.NODE_ENV;
    const prevSecret = process.env.BETTER_AUTH_SECRET;
    try {
      // @ts-expect-error NODE_ENV is typed readonly; override for the test
      process.env.NODE_ENV = "production";
      delete process.env.BETTER_AUTH_SECRET;
      // No secret + prod + no BETTER_AUTH_SECRET → throw, never sign with a
      // predictable fallback.
      expect(() => signOrderAccess([1])).toThrow(/BETTER_AUTH_SECRET/);
      // An explicitly injected secret still works even in production.
      expect(verifyOrderAccess(signOrderAccess([1], SECRET), SECRET)).toEqual([
        1,
      ]);
    } finally {
      // @ts-expect-error restore
      process.env.NODE_ENV = prevNode;
      if (prevSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
      else process.env.BETTER_AUTH_SECRET = prevSecret;
    }
  });

  it("hasOrderAccess reflects membership", () => {
    const cookie = signOrderAccess([100, 200], SECRET);
    expect(hasOrderAccess(cookie, 100, SECRET)).toBe(true);
    expect(hasOrderAccess(cookie, 999, SECRET)).toBe(false);
    expect(hasOrderAccess(undefined, 100, SECRET)).toBe(false);
  });
});
