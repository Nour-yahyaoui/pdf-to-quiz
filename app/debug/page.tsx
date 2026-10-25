import type { Metadata } from "next";

// TEMPORARY diagnostics page (v2.0.3), removed with /api/debug-groq once
// the production generation failure is resolved. Runs the checks at
// request time so it reflects the deployed environment, not build time.
// The diagnostics module is imported dynamically so even a failure while
// loading its dependency graph is rendered as a row instead of a 500.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Diagnostics — PDF to Quiz",
  robots: { index: false, follow: false },
};

type Row = { label: string; value: string };

export default async function DebugPage({
  searchParams,
}: {
  searchParams: Promise<{ fast?: string }>;
}) {
  const { fast } = await searchParams;
  let rows: Row[];
  try {
    const diagnostics = await import("@/lib/diagnostics");
    const checks = await diagnostics.buildDiagnostics(fast === "1");
    rows = diagnostics.flattenDiagnostics(checks);
  } catch (error) {
    rows = [
      { label: "moduleLoad", value: "failed" },
      {
        label: "moduleLoad · error",
        value: JSON.stringify(
          error instanceof Error ? error.message.slice(0, 400) : "unknown error",
        ),
      },
      {
        label: "moduleLoad · stack",
        value: JSON.stringify(
          error instanceof Error ? (error.stack ?? "").slice(0, 600) : "",
        ),
      },
    ];
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "3rem auto",
        padding: "0 1.25rem",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1>PDF to Quiz production diagnostics</h1>
      <p>
        Temporary read-only health check. No secret values are shown — only
        presence, lengths, and classified failure reasons.
      </p>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginTop: "1.5rem",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "0.6rem 0.75rem",
                border: "1px solid #cbd5e1",
                background: "#f1f5f9",
              }}
            >
              Check
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "0.6rem 0.75rem",
                border: "1px solid #cbd5e1",
                background: "#f1f5f9",
              }}
            >
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th
                scope="row"
                style={{
                  textAlign: "left",
                  fontWeight: 600,
                  padding: "0.6rem 0.75rem",
                  border: "1px solid #cbd5e1",
                  verticalAlign: "top",
                }}
              >
                {row.label}
              </th>
              <td
                style={{
                  padding: "0.6rem 0.75rem",
                  border: "1px solid #cbd5e1",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
