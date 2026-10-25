"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { UploadZone } from "@/components/create/upload-zone";
import { DifficultySelector } from "@/components/create/difficulty-selector";
import { Button } from "@/components/ui/button";
import { MAX_PDF_BYTES } from "@/lib/validation";
import type { Difficulty } from "@/lib/types";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const REQUEST_TIMEOUT_MS = 60_000;

export function CreateQuizClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [fileError, setFileError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const fileReady = useMemo(
    () => file !== null && file.size <= MAX_PDF_BYTES && fileError === null,
    [file, fileError],
  );

  function handleSelect(next: File) {
    setFileError(null);

    // Extension gate: OS-reported MIME types for PDFs vary and cannot be trusted alone.
    const isPdfByName = next.name.toLowerCase().endsWith(".pdf");
    if (!isPdfByName) {
      setFileError("Only PDF documents are accepted.");
      setFile(next);
      return;
    }

    if (next.size > MAX_PDF_BYTES) {
      setFileError("File too large. Maximum size is 5MB.");
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
  }

  async function verifyPdfHeader(selected: File): Promise<boolean> {
    const buffer = await selected.slice(0, 4).arrayBuffer();
    const header = Array.from(new Uint8Array(buffer));
    return PDF_MAGIC.every((byte, i) => byte === header[i]);
  }

  async function handleGenerate() {
    if (!file || pending) return;
    setFileError(null);

    if (file.size > MAX_PDF_BYTES) {
      setFileError("File too large. Maximum size is 5MB.");
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
        const message =
          data?.error?.message ?? "Quiz generation failed. Please try again.";
        toast.error(message);
        return;
      }

      if (!data?.quizId) {
        toast.error("The quiz was generated but no id came back. Try again.");
        return;
      }

      toast.success("Quiz ready. Good luck.");
      router.push(`/quiz/${data.quizId}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast.error("Generation timed out. Please try again.");
      } else {
        toast.error("Network problem — check your connection and try again.");
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
          onClick={handleGenerate}
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
    </div>
  );
}
