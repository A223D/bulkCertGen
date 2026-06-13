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
  const disabledReason = rowCount === 0
    ? "Upload a CSV before exporting."
    : "Complete mapping and preview before exporting.";

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
        setStatus("error");
        setError(
          "We could not generate this ZIP. Your export request was received, but no ZIP was downloaded. Check your mapping and try again.",
        );
        return;
      }

      downloadZip(await response.blob());
      setStatus("success");
    } catch {
      setStatus("error");
      setError(
        "We could not reach the export service. No ZIP was downloaded. Check your connection and try again.",
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
        Generate a ZIP with up to {BATCH_PDF_LIMITS.freeExportRows} PDFs from
        the current batch.
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
        {status === "loading" ? "Generating PDFs..." : "Generate free ZIP"}
      </button>
      {!canExport && status !== "loading" ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {disabledReason}
        </p>
      ) : null}
      {status === "loading" ? (
        <div
          className="mt-3 rounded-lg border border-line bg-muted px-3 py-2 text-sm text-muted-foreground"
          role="status"
        >
          <p className="font-medium text-ink">Generating your PDFs...</p>
          <p className="mt-1">This may take a few seconds for larger batches.</p>
        </div>
      ) : null}
      {status === "success" ? (
        <p
          className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
          role="status"
        >
          Your ZIP is ready. If the download did not start, try again.
        </p>
      ) : null}
      {status === "error" && error ? (
        <p
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
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
