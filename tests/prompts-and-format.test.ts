import { describe, expect, it } from "vitest";
import { buildUserPrompt, truncateForModel, MAX_TEXT_CHARS } from "@/lib/groq/prompts";
import { formatBytes } from "@/lib/format";

describe("truncateForModel", () => {
  it("leaves short text untouched", () => {
    const text = "short document";
    expect(truncateForModel(text)).toBe(text);
  });

  it("cuts oversized text on a word boundary and marks it", () => {
    const text = `${"word ".repeat(6000)}end`;
    const result = truncateForModel(text);
    expect(result.length).toBeLessThanOrEqual(MAX_TEXT_CHARS + 1);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("buildUserPrompt", () => {
  it("embeds difficulty guidance, the source text and the JSON contract", () => {
    const prompt = buildUserPrompt("source text here", "hard");
    expect(prompt).toContain("hard difficulty");
    expect(prompt).toContain("source text here");
    expect(prompt).toContain('"questions"');
  });

  it("adds stricter instructions on retry", () => {
    const strict = buildUserPrompt("text", "easy", true);
    expect(strict).toContain("not valid JSON");
  });
});

describe("formatBytes", () => {
  it("formats byte sizes with sensible units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });
});
