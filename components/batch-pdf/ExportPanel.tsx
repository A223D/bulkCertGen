"use client";

import { useState } from "react";
import { BATCH_PDF_LIMITS } from "@/lib/batch-pdf/limits";
import type { CsvRow, FieldMapping } from "@/lib/batch-pdf/types";

type ExportPanelProps = {
  templateId: string | null;
  rows: CsvRow[];
  mapping: FieldMapping;
  enabled: boolean;
};

function downloadZip(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "batch-pdf-free-export.zip";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ExportPanel({
  templateId,
  rows,
  mapping,
  enabled,
}: ExportPanelProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const rowCount = rows.length;
  const freeRows = Math.min(rowCount, BATCH_PDF_LIMITS.freeExportRows);
  const canExport = enabled && Boolean(templateId) && rowCount > 0 && status !== "loading";

  async function handleGenerateFreeZip() {
    if (!canExport || !templateId) {
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId,
          rows,
          mapping,
          mode: "free",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Unable to generate this ZIP.",
        );
      }

      downloadZip(await response.blob());
      setStatus("success");
    } catch (caughtError) {
      setStatus("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate this ZIP.",
      );
    }
  }

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Export
      </p>
      <h2 className="mt-2 text-lg font-semibold">Free export</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Generate the first {BATCH_PDF_LIMITS.freeExportRows} PDFs in this batch.
      </p>
      {rowCount > 0 ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {rowCount > BATCH_PDF_LIMITS.freeExportRows
            ? `Your CSV has ${rowCount} rows. Free export will generate the first ${BATCH_PDF_LIMITS.freeExportRows} PDFs.`
            : `Your CSV has ${rowCount} rows. Free export will generate ${freeRows} PDFs.`}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Upload a CSV and complete mapping before exporting.
        </p>
      )}
      <button
        type="button"
        disabled={!canExport}
        onClick={handleGenerateFreeZip}
        className={[
          "mt-4 rounded-lg px-4 py-2 text-sm font-medium",
          canExport
            ? "bg-ink text-panel hover:bg-accent"
            : "cursor-not-allowed bg-disabled text-disabled-foreground",
        ].join(" ")}
      >
        {status === "loading" ? "Generating ZIP..." : "Generate free ZIP"}
      </button>
      {status === "success" ? (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          ZIP generated and downloaded.
        </p>
      ) : null}
      {status === "error" && error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-5 rounded-lg border border-dashed border-line bg-muted p-3">
        <p className="text-sm font-semibold text-ink">Full-batch export</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Paid full export is coming later. No payment flow is active in this phase.
        </p>
      </div>
    </section>
  );
}
