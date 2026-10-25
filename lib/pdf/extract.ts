import { PDFParse } from "pdf-parse";
// Statically import the pdfjs worker so the bundler includes it in the server
// chunk. We then register it on globalThis as the in-process ("fake") worker.
// Without this, pdfjs falls back to a dynamic `import("./pdf.worker.mjs")`,
// which (a) cannot be statically traced into the serverless output and
// (b) fails when the worker file is absent from the deployment.
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

declare global {
  var pdfjsWorker: { WorkerMessageHandler?: unknown } | undefined;
}

if (!globalThis.pdfjsWorker?.WorkerMessageHandler) {
  globalThis.pdfjsWorker = pdfjsWorker;
}

/**
 * Extracts text from a PDF held entirely in memory.
 * The buffer is never written to disk or object storage — after this function
 * returns, the caller drops its reference and the PDF is gone.
 */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const parser = new PDFParse({ data: bytes });
  try {
    const result = await parser.getText();
    return (result.text ?? "").trim();
  } finally {
    await parser.destroy();
  }
}

/** True when the first four bytes are the %PDF magic number. */
export function isPdfBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 // F
  );
}
