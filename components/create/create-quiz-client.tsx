"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { UploadZone } from "@/components/create/upload-zone";
import { DifficultySelector } from "@/components/create/difficulty-selector";
import { Button } from "@/components/ui/button";
import { MAX_PDF_BYTES } from "@/lib/validation";
import { addQuizToHistory } from "@/lib/history";
import type { Difficulty } from "@/lib/types";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const REQUEST_TIMEOUT_MS = 60_000;

interface InlineError {
  message: string;
  retryable: boolean;
  // Sanitised technical detail returned by the API error contract (or a
  // platform-level description when no JSON body came back).
  code?: string;
  detail?: string;
  correlationId?: string;
  status?: number;
}

export function CreateQuizClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [fileError, setFileError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<InlineError | null>(null);
  const [pending, setPending] = useState(false);

  const fileReady = useMemo(
    () => file !== null && file.size <= MAX_PDF_BYTES && fileError === null,
    [file, fileError],
  );

  function handleSelect(next: File) {
    setFileError(null);
    setInlineError(null);

    // Extension gate: OS-reported MIME types for PDFs vary and cannot be trusted alone.
    if (!next.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Only PDF documents are accepted.");
      setFile(next);
      return;
    }
    if (next.size > MAX_PDF_BYTES) {
      setFileError("File too large. Maximum size is 4.5MB.");
      setFile(next);
      return;
    }
    if (next.size === 0) {
      setFileError("That file is empty. Choose a PDF with readable text.");
      setFile(next);
      return;
    }
    setFile(next);
  }

  function handleClear() {
    setFile(null);
    setFileError(null);
    setInlineError(null);
  }

  async function verifyPdfHeader(selected: File): Promise<boolean> {
    const buffer = await selected.slice(0, 4).arrayBuffer();
    const header = Array.from(new Uint8Array(buffer));
    return PDF_MAGIC.every((byte, i) => byte === header[i]);
  }

  async function generate() {
    if (!file || pending) return;
    setFileError(null);
    setInlineError(null);

    if (file.size > MAX_PDF_BYTES) {
      setFileError("File too large. Maximum size is 4.5MB.");
      return;
    }

    const looksLikePdf = await verifyPdfHeader(file);
    if (!looksLikePdf) {
      setFileError("That file is not a valid PDF document.");
      return;
    }

    setPending(true);
    try {
      const form = new FormData();
      form.append("pdf", file);
      form.append("difficulty", difficulty);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // Our API always answers with a JSON error contract carrying a
        // sanitised technical `detail`. A missing body means the platform
        // itself failed: a 504 function timeout or an HTML error page, which
        // deserve their own explanation instead of a duplicated generic title.
        const apiErrorBody = data?.error;
        let message: string;
        let detail: string | undefined;
        if (apiErrorBody?.message) {
          message = apiErrorBody.message;
          detail = apiErrorBody.detail ?? `Error code: ${apiErrorBody.code}`;
        } else if (res.status === 504) {
          message =
            "Generation timed out on the server. The AI model may be busy — please try again.";
          detail = `HTTP ${res.status} — the function exceeded its time limit and returned no JSON body.`;
        } else {
          message =
            "The server returned an unexpected response. Please try again in a moment.";
          detail = `HTTP ${res.status} — no JSON error body was returned.`;
        }
        const retryable = res.status === 429 || res.status >= 500;
        setInlineError({
          message,
          retryable,
          code: apiErrorBody?.code,
          detail,
          correlationId: apiErrorBody?.correlationId,
          status: res.status,
        });
        return;
      }

      if (!data?.quizId) {
        setInlineError({
          message: "The quiz was generated but no id came back. Try again.",
          retryable: true,
        });
        return;
      }

      addQuizToHistory({
        id: data.quizId,
        pdf_name: file.name,
        difficulty,
        createdAt: new Date().toISOString(),
      });

      toast.success("Quiz ready. Good luck.");
      router.push(`/quiz/${data.quizId}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setInlineError({
          message: "Generation timed out. The model may be busy — please try again.",
          retryable: true,
        });
      } else {
        toast.error("Network problem — check your connection and try again.");
        setInlineError({
          message: "Network problem — check your connection and try again.",
          retryable: true,
        });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="exam-label mb-3">Step 1 — upload a document</p>
        <UploadZone
          file={file}
          onSelect={handleSelect}
          onClear={handleClear}
          error={fileError}
          disabled={pending}
        />
      </section>

      <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={pending} />

      <section>
        <p className="exam-label mb-3">Step 3 — generate</p>
        <Button
          size="lg"
          onClick={generate}
          disabled={!fileReady || pending}
          className="w-full sm:w-auto"
        >
          {pending ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden />
              Reading your PDF and crafting questions…
            </>
          ) : (
            <>
              <Sparkles size={18} aria-hidden />
              Generate quiz
            </>
          )}
        </Button>
        {!fileReady && !pending && (
          <p className="mt-3 text-sm text-mute">
            Select a PDF under 5&nbsp;MB to enable generation.
          </p>
        )}
      </section>

      {inlineError && (
        <div
          role="alert"
          className="animate-fade-in rounded-md border border-danger/40 bg-danger/10 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} aria-hidden className="mt-0.5 shrink-0 text-danger" />
            <div className="flex-1">
              <p className="font-medium text-ink">Quiz generation failed</p>
              <p className="mt-1 text-sm text-mute">{inlineError.message}</p>

              {(inlineError.detail ||
                inlineError.code ||
                inlineError.correlationId) && (
                <details
                  open
                  className="mt-3 rounded-md border border-danger/30 bg-white/60 p-3 text-xs dark:bg-black/20"
                >
                  <summary className="cursor-pointer font-medium text-ink">
                    Technical details
                  </summary>
                  <dl className="mt-2 space-y-1 font-mono text-label break-words text-mute">
                    {inlineError.status !== undefined && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-sans font-medium">HTTP status:</dt>
                        <dd>{inlineError.status}</dd>
                      </div>
                    )}
                    {inlineError.code && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-sans font-medium">Error code:</dt>
                        <dd>{inlineError.code}</dd>
                      </div>
                    )}
                    {inlineError.detail && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-sans font-medium">Reason:</dt>
                        <dd>{inlineError.detail}</dd>
                      </div>
                    )}
                    {inlineError.correlationId && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-sans font-medium">Reference:</dt>
                        <dd>{inlineError.correlationId}</dd>
                      </div>
                    )}
                  </dl>
                </details>
              )}

              {inlineError.retryable && (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={generate}
                  disabled={pending || !fileReady}
                >
                  <RotateCcw size={16} aria-hidden />
                  Try again
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
