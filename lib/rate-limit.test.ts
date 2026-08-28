import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimit();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimit();
  });

  it("allows burst up to limit then blocks", () => {
    const key = "ip:1.2.3.4";
    for (let i = 0; i < 20; i++) {
      const r = checkRateLimit(key, 20, 60_000);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(19 - i);
    }
    const blocked = checkRateLimit(key, 20, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("refills after window", () => {
    const key = "ip:1.2.3.4";
    for (let i = 0; i < 20; i++) checkRateLimit(key, 20, 60_000);
    expect(checkRateLimit(key, 20, 60_000).allowed).toBe(false);
    vi.advanceTimersByTime(60_000);
    const refilled = checkRateLimit(key, 20, 60_000);
    expect(refilled.allowed).toBe(true);
    expect(refilled.remaining).toBe(19);
  });

  it("isolates per key (tenant or ip)", () => {
    const a = "tenantA:ip:1";
    const b = "tenantB:ip:1";
    for (let i = 0; i < 20; i++) checkRateLimit(a, 20, 60_000);
    expect(checkRateLimit(a, 20, 60_000).allowed).toBe(false);
    expect(checkRateLimit(b, 20, 60_000).allowed).toBe(true);
  });

  it("respects custom limit and window", () => {
    const key = "custom";
    expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 1000).allowed).toBe(false);
    vi.advanceTimersByTime(1_000);
    expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
  });

  it("returns resetAt in future", () => {
    const now = Date.now();
    const r = checkRateLimit("k", 10, 60_000);
    expect(r.resetAt).toBeGreaterThan(now);
    expect(r.resetAt).toBe(now + 60_000);
  });
});
