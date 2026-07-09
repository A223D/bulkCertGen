import { resolveOutputMode } from "./export-options.ts";
import type { SheetLayoutResult } from "./sheet-layout.ts";
import type { ExportOptions } from "./types.ts";

export type ExportReceipt = {
  filename: string;
  formatLabel: string;
  contentsLabel: string;
  downloadHint: string;
  zipHint?: string;
};

export type ExportReceiptSheetLayout = {
  layout: Pick<SheetLayoutResult, "pageCount">;
};

export function describeExportReceipt(args: {
  exportOptions: ExportOptions;
  rowCount: number;
  filename: string;
  sheetLayoutInfo: ExportReceiptSheetLayout | null;
}): ExportReceipt {
  const { exportOptions, rowCount, filename, sheetLayoutInfo } = args;
  const isZip = filename.toLowerCase().endsWith(".zip");
  const outputMode = resolveOutputMode(exportOptions);
  let contentsLabel = `${rowCount} personalized page${rowCount !== 1 ? "s" : ""}`;

  if (exportOptions.layoutMode === "fitMultiplePerPage") {
    const pageCount = sheetLayoutInfo?.layout.pageCount ?? 1;
    contentsLabel = `${pageCount} print-sheet page${pageCount !== 1 ? "s" : ""} with ${rowCount} item${rowCount !== 1 ? "s" : ""}`;
  } else if (outputMode === "separateFiles" && isZip) {
    contentsLabel = `${rowCount} separate PDF${rowCount !== 1 ? "s" : ""} in one ZIP`;
  } else if (outputMode === "combinedPdf") {
    contentsLabel = `One PDF with ${rowCount} page${rowCount !== 1 ? "s" : ""}`;
  }

  if (exportOptions.includeOverflowReport && isZip) {
    contentsLabel += " plus preflight-report.csv";
  }

  return {
    filename,
    formatLabel: isZip ? "ZIP archive" : "PDF",
    contentsLabel,
    downloadHint: "Check your browser's Downloads folder if it did not open automatically.",
    zipHint: isZip ? "Open the ZIP to see the PDFs inside." : undefined,
  };
}
