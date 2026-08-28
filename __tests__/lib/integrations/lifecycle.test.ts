import { describe, expect, it } from "vitest";
import {
  CONNECTION_STATUS,
  canTransitionConnection,
  canTransitionSync,
  isValidConnectionStatus,
  isValidSyncStatus,
  nextRetryAt,
  SYNC_STATUS,
} from "@/lib/integrations/lifecycle";

describe("connection lifecycle", () => {
  it("accepts only declared connection statuses", () => {
    expect(isValidConnectionStatus("disconnected")).toBe(true);
    expect(isValidConnectionStatus("pending")).toBe(true);
    expect(isValidConnectionStatus("connected")).toBe(true);
    expect(isValidConnectionStatus("error")).toBe(true);
    expect(isValidConnectionStatus("deleted")).toBe(false);
  });
  it("allows only declared connection transitions", () => {
    expect(canTransitionConnection("disconnected", "pending")).toBe(true);
    expect(canTransitionConnection("pending", "connected")).toBe(true);
    expect(canTransitionConnection("connected", "error")).toBe(true);
    expect(canTransitionConnection("error", "disconnected")).toBe(true);
    expect(canTransitionConnection("connected", "pending")).toBe(false);
    expect(canTransitionConnection("connected", "disconnected")).toBe(false);
  });
  it("sync statuses are the union", () => {
    expect(SYNC_STATUS).toEqual(["pending", "running", "success", "failed"]);
  });
  it("failed sync schedules retry with backoff", () => {
    const base = new Date("2026-01-01T00:00:00.000Z");
    const n1 = nextRetryAt(1, base);
    const n2 = nextRetryAt(2, base);
    expect(n1.getTime()).toBeGreaterThan(base.getTime());
    expect(n2.getTime()).toBeGreaterThan(n1.getTime());
  });
  it("success is terminal", () => {
    expect(canTransitionSync("success", "pending")).toBe(false);
    expect(canTransitionSync("success", "failed")).toBe(false);
  });
  it("connection status is the union", () => {
    expect(CONNECTION_STATUS).toEqual([
      "disconnected",
      "pending",
      "connected",
      "error",
    ]);
  });
  it("rejects unknown sync status", () => {
    expect(isValidSyncStatus("unknown")).toBe(false);
  });
});
