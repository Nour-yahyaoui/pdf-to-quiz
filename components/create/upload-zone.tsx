"use client";

import { useRef, useState, type DragEvent } from "react";
import { CloudUpload, FileText, X } from "lucide-react";
import { MAX_PDF_BYTES } from "@/lib/validation";
import { formatBytes } from "@/lib/format";

interface UploadZoneProps {
  file: File | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  error: string | null;
  disabled?: boolean;
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF

export function UploadZone({ file, onSelect, onClear, error, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onSelect(dropped);
  }

  async function handleFileChange(selected: File | undefined) {
    if (!selected) return;

    if (selected.size > MAX_PDF_BYTES) {
      onSelect(selected); // parent owns the exact error copy
      return;
    }

    // Client-side magic-byte check via FileReader (spec: FileReader API).
    const buffer = await selected.slice(0, 4).arrayBuffer();
    const header = Array.from(new Uint8Array(buffer));
    const looksLikePdf = PDF_MAGIC.every((byte, i) => byte === header[i]);
    if (!looksLikePdf) {
      onSelect(selected);
      return;
    }
    onSelect(selected);
  }

  if (file) {
    const tooLarge = file.size > MAX_PDF_BYTES;
    return (
      <div
        className={`rounded-md border bg-raised p-5 ${
          tooLarge || error ? "border-danger" : "border-rule"
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-rule bg-paper text-accent">
            <FileText size={20} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{file.name}</p>
            <p className="mt-0.5 font-mono text-label uppercase text-mute tabular">
              {formatBytes(file.size)} · PDF document
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            aria-label="Remove selected file"
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-rule text-mute transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        {tooLarge && (
          <p role="alert" className="mt-4 text-sm text-danger">
            File too large. Maximum size is 5MB.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-12 text-center transition-colors sm:py-16 ${
        dragging
          ? "border-accent bg-accent-tint/60"
          : "border-rule bg-raised hover:border-accent/60"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <CloudUpload
        size={34}
        aria-hidden
        className={dragging ? "text-accent" : "text-mute"}
      />
      <p className="mt-5 font-medium text-ink">
        Drag and drop your PDF here, or{" "}
        <span className="text-accent underline underline-offset-4">browse files</span>
      </p>
      <p className="mt-2 font-mono text-label uppercase text-mute">
        PDF only · maximum 5MB · processed in memory
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
        disabled={disabled}
        aria-label="Choose a PDF file"
      />
    </div>
  );
}
