export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, exponent);
  const raw =
    exponent === 0 || value >= 10 ? String(Math.round(value)) : value.toFixed(1);
  // Whole values read as "2 KB", sub-whole values keep one decimal ("1.5 MB").
  const rounded = raw.endsWith(".0") ? raw.slice(0, -2) : raw;
  return `${rounded} ${units[exponent]}`;
}

export function formatScoreDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
