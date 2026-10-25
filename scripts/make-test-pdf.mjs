// Generates a minimal valid PDF with extractable text (dev/test utility).
// Content stream length is measured automatically so text can be edited freely.
import { writeFileSync } from "node:fs";

const lines = [
  "Photosynthesis converts sunlight into chemical energy in plants.",
  "Chlorophyll inside the chloroplasts absorbs red and blue light.",
  "The reactions split water molecules, releasing oxygen gas.",
  "Carbon dioxide is fixed into glucose during the Calvin cycle.",
  "Almost all life on Earth depends on this process for food and oxygen.",
];

// One text line per PDF line, using simple Helvetica with leading.
let stream = "BT\n/F1 14 Tf\n1 1 1 rg\n72 720 Td\n18 TL\n";
for (const line of lines) {
  // Escape PDF string delimiters.
  const safe = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  stream += `(${safe}) Tj\nT*\n`;
}
stream += "ET";

const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];

let pdf = "%PDF-1.4\n";
const offsets = [];
objects.forEach((body, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefStart = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const offset of offsets) {
  pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

writeFileSync("tests/fixtures/sample.pdf", Buffer.from(pdf, "latin1"));
console.log("wrote tests/fixtures/sample.pdf", pdf.length, "bytes;", lines.join(" ").length, "chars of text");
