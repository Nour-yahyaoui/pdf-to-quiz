import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractPdfText, isPdfBytes } from "@/lib/pdf/extract";

const samplePath = join(__dirname, "fixtures", "sample.pdf");

describe("isPdfBytes", () => {
  it("recognises the %PDF magic number", () => {
    const bytes = new Uint8Array(readFileSync(samplePath));
    expect(isPdfBytes(bytes)).toBe(true);
  });

  it("rejects non-PDF bytes", () => {
    expect(isPdfBytes(new TextEncoder().encode("not a pdf"))).toBe(false);
    expect(isPdfBytes(new Uint8Array([0x25, 0x50]))).toBe(false);
  });
});

describe("extractPdfText", () => {
  it("extracts readable text from a real PDF in memory", async () => {
    const bytes = new Uint8Array(readFileSync(samplePath));
    const text = await extractPdfText(bytes);

    expect(text).toContain("Photosynthesis");
    expect(text).toContain("chemical energy");
    // The fixture must stay above the route's 100-char EMPTY_PDF gate.
    expect(text.length).toBeGreaterThan(100);
  });

  it("registers the in-process pdfjs worker so extraction needs no worker file", async () => {
    // Regression: in serverless builds pdf.worker.mjs is not traced onto the
    // filesystem; the fake worker must be supplied via globalThis instead.
    expect(globalThis.pdfjsWorker?.WorkerMessageHandler).toBeDefined();

    const bytes = new Uint8Array(readFileSync(samplePath));
    const text = await extractPdfText(bytes);
    expect(text.length).toBeGreaterThan(100);
  });
});
