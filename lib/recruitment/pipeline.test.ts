import { describe, expect, it } from "vitest";
import {
  CANDIDATE_STAGES,
  canTransition,
  isValidStage,
} from "@/lib/recruitment/pipeline";

describe("candidate pipeline", () => {
  it("accepts only declared stages", () => {
    expect(isValidStage("applied")).toBe(true);
    expect(isValidStage("screening")).toBe(true);
    expect(isValidStage("interview")).toBe(true);
    expect(isValidStage("offer")).toBe(true);
    expect(isValidStage("hired")).toBe(true);
    expect(isValidStage("rejected")).toBe(true);
    expect(isValidStage("deleted")).toBe(false);
  });
  it("allows only declared transitions", () => {
    expect(canTransition("applied", "screening")).toBe(true);
    expect(canTransition("screening", "interview")).toBe(true);
    expect(canTransition("interview", "offer")).toBe(true);
    expect(canTransition("offer", "hired")).toBe(true);
    expect(canTransition("applied", "rejected")).toBe(true);
    expect(canTransition("applied", "hired")).toBe(false);
    expect(canTransition("hired", "rejected")).toBe(false);
  });
  it("terminal stages have no outgoing transitions", () => {
    expect(canTransition("hired", "applied")).toBe(false);
    expect(canTransition("rejected", "screening")).toBe(false);
  });
  it("stages is the union", () => {
    expect(CANDIDATE_STAGES).toEqual([
      "applied",
      "screening",
      "interview",
      "offer",
      "hired",
      "rejected",
    ]);
  });
});
