import { z } from "zod";
import { BATCH_PDF_LIMITS } from "../limits.ts";
import { normalizePrintableText } from "../text-normalization.ts";
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

// Zod schemas for the high-risk parts of the payload (rows + headers).
// Deeper structural validators (design asset, field boxes, export options)
// remain as-is downstream.
const csvRowSchema = z
  .record(z.string(), z.string().max(BATCH_PDF_LIMITS.maxFieldLength))
  .superRefine((row, ctx) => {
    for (const [key, value] of Object.entries(row)) {
      if (key.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Row keys must be non-empty.",
          path: [key],
        });
      }
      if (typeof value !== "string") {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          expected: "string",
          received: typeof value,
          path: [key],
        });
      }
    }
  });

const rowsSchema = z.array(csvRowSchema).max(BATCH_PDF_LIMITS.maxRowsParsed);

const csvHeadersSchema = z
  .array(z.string().trim().min(1).max(200))
  .max(BATCH_PDF_LIMITS.maxColumns)
  .refine(
    (headers) => new Set(headers).size === headers.length,
    { message: "CSV headers must be unique." },
  );

function normalizeHeaders(headers: unknown[]): Result<string[]> {
  const parsed = csvHeadersSchema.safeParse(headers);
  if (!parsed.success) {
    return safeError("custom_export_invalid_payload", "Export request has invalid CSV headers.");
  }

  const normalized = parsed.data.map((header) => normalizePrintableText(header)).filter(Boolean);
  if (normalized.length === 0 || new Set(normalized).size !== normalized.length) {
    return safeError("custom_export_invalid_payload", "Export request has invalid CSV headers.");
  }

  return { ok: true, value: normalized };
}

function normalizeRows(rows: unknown[], csvHeaders: string[]): Result<CsvRow[]> {
  const parsed = rowsSchema.safeParse(rows);
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some(
      (issue) => issue.code === "too_big" || issue.message.includes("max"),
    );
    if (tooLong) {
      return safeError(
        "custom_export_field_too_long",
        `A CSV value is too long. Keep values under ${BATCH_PDF_LIMITS.maxFieldLength} characters.`,
      );
    }
    return safeError("custom_export_invalid_payload", "Export request has invalid row data.");
  }

  const normalizedRows: CsvRow[] = [];
  for (const rowValue of parsed.data) {
    if (!isPlainObject(rowValue)) {
      return safeError("custom_export_invalid_payload", "Export request has invalid row data.");
    }

    const row: CsvRow = {};
    for (const header of csvHeaders) {
      row[header] = normalizePrintableText(rowValue[header]);
    }
    normalizedRows.push(row);
  }

  return { ok: true, value: normalizedRows };
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
      "custom_export_invalid_mode",
      "This export request is invalid. Try again.",
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

  const headersResult = normalizeHeaders(csvHeaders);
  if (!headersResult.ok) return headersResult;

  const rowsResult = normalizeRows(rows, headersResult.value);
  if (!rowsResult.ok) return rowsResult;

  return {
    ok: true,
    value: {
      mode: "free",
      rows: rowsResult.value,
      csvHeaders: headersResult.value,
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
      "custom_export_invalid_mode",
      "This export request is invalid. Try again.",
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
        "Image designs require a physical item size. Set the width and height on the Preview step.",
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

  // Pass csvHeaders so filenameColumn is validated, and the design asset so
  // size resolution and print-sheet layout fit can be confirmed.
  const optionsResult = validateExportOptions(
    payload.exportOptions,
    payload.csvHeaders,
    payload.designAsset,
  );
  if (!optionsResult.ok) return optionsResult;

  return { ok: true, value: payload };
}

export function getRowsForFreeCustomExport(rows: CsvRow[]): CsvRow[] {
  return rows.slice(0, BATCH_PDF_LIMITS.freeExportRows);
}
