import { describe, expect, it } from "vitest";
import { GENERATION_STAGES, stageForElapsed } from "@/components/create/generation-progress";

describe("generation progress stage timing", () => {
  it("starts on the upload stage", () => {
    expect(stageForElapsed(0)).toBe(0);
    expect(GENERATION_STAGES[0]).toBe("Uploading your PDF");
  });

  it("moves through the stages at the configured thresholds", () => {
    expect(stageForElapsed(4)).toBe(0);
    expect(stageForElapsed(5)).toBe(1);
    expect(stageForElapsed(11)).toBe(1);
    expect(stageForElapsed(12)).toBe(2);
    expect(stageForElapsed(24)).toBe(2);
    expect(stageForElapsed(25)).toBe(3);
  });

  it("never advances past the final stage, even on long runs", () => {
    expect(stageForElapsed(49)).toBe(3);
    expect(stageForElapsed(120)).toBe(GENERATION_STAGES.length - 1);
  });
});
