import { describe, expect, it } from "vitest";
import { isValidPayRunStatus, PAY_RUN_STATUS } from "@/lib/payroll/types";

describe("payRun status", () => {
  it("accepts only the four statuses", () => {
    expect(isValidPayRunStatus("draft")).toBe(true);
    expect(isValidPayRunStatus("running")).toBe(true);
    expect(isValidPayRunStatus("done")).toBe(true);
    expect(isValidPayRunStatus("locked")).toBe(true);
    expect(isValidPayRunStatus("deleted")).toBe(false);
  });
  it("PAY_RUN_STATUS is the union", () => {
    expect(PAY_RUN_STATUS).toEqual(["draft", "running", "done", "locked"]);
  });
});
