import { BATCH_PDF_LIMITS } from "../limits.ts";
import type { CsvRow, Result } from "../types.ts";
import { validateDesignAsset } from "./design-file.ts";
import { validateCustomFieldBoxes } from "./field-boxes.ts";
import { validateExportOptions } from "./export-options.ts";
import type { CustomFieldBox, DesignAsset, ExportOptions } from "./types.ts";

export type CustomDesignExportPayload = {
  rows: CsvRow[];
  csvHeaders: string[];
  designAsset: DesignAsset;
  fieldBoxes: CustomFieldBox[];
  exportOptions: ExportOptions;
  mode: "free";
};

function safeError(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCustomExportPayload(
  value: unknown,
): Result<CustomDesignExportPayload> {
  if (!isPlainObject(value)) {
    return safeError(
      "custom_export_invalid_payload",
      "Export request is invalid. Try again.",
    );
  }

  const { mode, rows, csvHeaders, designAsset, fieldBoxes, exportOptions } =
    value as Record<string, unknown>;

  if (mode !== "free") {
    return safeError(
      "custom_export_paid_unavailable",
      "Paid full-batch export is not available yet.",
    );
  }

  if (!Array.isArray(rows)) {
    return safeError(
      "custom_export_invalid_payload",
      "Export request is missing row data.",
    );
  }

  if (!Array.isArray(csvHeaders)) {
    return safeError(
      "custom_export_invalid_payload",
      "Export request is missing CSV headers.",
    );
  }

  if (!isPlainObject(designAsset)) {
    return safeError(
      "custom_export_invalid_payload",
      "Export request is missing design information.",
    );
  }

  if (!Array.isArray(fieldBoxes)) {
    return safeError(
      "custom_export_invalid_payload",
      "Export request is missing field box information.",
    );
  }

  if (!isPlainObject(exportOptions)) {
    return safeError(
      "custom_export_invalid_payload",
      "Export request is missing export options.",
    );
  }

  return {
    ok: true,
    value: {
      mode: "free",
      rows: rows as CsvRow[],
      csvHeaders: csvHeaders as string[],
      designAsset: designAsset as DesignAsset,
      fieldBoxes: fieldBoxes as CustomFieldBox[],
      exportOptions: exportOptions as ExportOptions,
    },
  };
}

export function validateCustomExportPayload(
  payload: CustomDesignExportPayload,
): Result<CustomDesignExportPayload> {
  if (payload.mode !== "free") {
    return safeError(
      "custom_export_paid_unavailable",
      "Paid full-batch export is not available yet.",
    );
  }

  if (!Array.isArray(payload.rows) || payload.rows.length === 0) {
    return safeError(
      "custom_export_no_rows",
      "Upload a CSV with at least one row before exporting.",
    );
  }

  if (payload.rows.length > BATCH_PDF_LIMITS.maxRowsParsed) {
    return safeError(
      "custom_export_too_many_rows",
      "Too many rows in this request.",
    );
  }

  if (!Array.isArray(payload.fieldBoxes) || payload.fieldBoxes.length === 0) {
    return safeError(
      "custom_export_no_field_boxes",
      "Add at least one field box before exporting.",
    );
  }

  if (payload.exportOptions.layoutMode === "fitMultiplePerPage") {
    return safeError(
      "custom_export_print_sheet_unavailable",
      "Print-sheet export is not available yet. Use one-per-page export for now.",
    );
  }

  // Image designs require a physical item size for rendering.
  if (payload.designAsset.intrinsicUnit === "px") {
    const opts = payload.exportOptions;
    const hasValidSize =
      opts.itemSizeMode === "custom" &&
      typeof opts.customItemWidth === "number" &&
      opts.customItemWidth > 0 &&
      typeof opts.customItemHeight === "number" &&
      opts.customItemHeight > 0;

    if (!hasValidSize) {
      return safeError(
        "custom_export_needs_item_size",
        "Image designs require a physical item size. Set the width and height in the preflight panel.",
      );
    }
  }

  const designResult = validateDesignAsset(payload.designAsset);
  if (!designResult.ok) return designResult;

  const boxesResult = validateCustomFieldBoxes(
    payload.fieldBoxes,
    payload.csvHeaders,
  );
  if (!boxesResult.ok) return boxesResult;

  // Pass csvHeaders so filenameColumn is validated.
  const optionsResult = validateExportOptions(
    payload.exportOptions,
    payload.csvHeaders,
  );
  if (!optionsResult.ok) return optionsResult;

  return { ok: true, value: payload };
}

export function getRowsForFreeCustomExport(rows: CsvRow[]): CsvRow[] {
  return rows.slice(0, BATCH_PDF_LIMITS.freeExportRows);
}
