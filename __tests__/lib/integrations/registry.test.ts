import { describe, expect, it } from "vitest";
import {
  getProvider,
  INTEGRATION_CATALOG,
  isKnownProvider,
  listByCategory,
} from "@/lib/integrations/registry";

describe("integration registry", () => {
  it("catalog has at least 8 providers and each has required fields", () => {
    expect(INTEGRATION_CATALOG.length).toBeGreaterThanOrEqual(8);
    for (const def of INTEGRATION_CATALOG) {
      expect(def.provider).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.authType).toBeTruthy();
    }
  });
  it("getProvider returns def for known provider", () => {
    expect(getProvider("slack").name).toMatch(/Slack/i);
    expect(getProvider("quickbooks").category).toBe("accounting");
  });
  it("getProvider throws for unknown provider", () => {
    expect(() => getProvider("unknown" as any)).toThrow();
  });
  it("isKnownProvider guards correctly", () => {
    expect(isKnownProvider("github")).toBe(true);
    expect(isKnownProvider("not-a-provider")).toBe(false);
  });
  it("listByCategory filters correctly", () => {
    const accounting = listByCategory("accounting");
    expect(accounting.length).toBeGreaterThanOrEqual(2);
    expect(accounting.every((d) => d.category === "accounting")).toBe(true);
  });
  it("catalog covers all categories at least once", () => {
    const cats = new Set(INTEGRATION_CATALOG.map((d) => d.category));
    expect(cats.has("accounting")).toBe(true);
    expect(cats.has("messaging")).toBe(true);
  });
});
