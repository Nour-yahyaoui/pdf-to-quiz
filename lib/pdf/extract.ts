import { PDFParse } from "pdf-parse";

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
    bytes[3] === 0x46    // F
  );
}
