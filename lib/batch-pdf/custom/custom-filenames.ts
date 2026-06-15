import type { CsvRow } from "../types.ts";
import type { ExportOptions } from "./types.ts";

const FALLBACK_NAME = "custom-document";
const MAX_BASE_LENGTH = 80;

// Common column names to try when filenameColumn is not configured.
const FALLBACK_COLUMNS = ["name", "full name", "title", "email"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeSlugFromRow(row: CsvRow, column: string): string {
  try {
    const value = row[column] ?? "";
    return slugify(String(value));
  } catch {
    return "";
  }
}

function findFallbackSlug(row: CsvRow): string {
  for (const col of FALLBACK_COLUMNS) {
    // Try exact match first, then case-insensitive.
    const exactValue = row[col];
    if (exactValue !== undefined) {
      const slug = slugify(String(exactValue));
      if (slug) return slug;
    }

    const key = Object.keys(row).find(
      (k) => k.toLowerCase() === col.toLowerCase(),
    );
    if (key) {
      const slug = slugify(String(row[key] ?? ""));
      if (slug) return slug;
    }
  }

  return "";
}

export function makeSafeCustomPdfFilename(args: {
  index: number;
  row: CsvRow;
  exportOptions: ExportOptions;
}): string {
  const prefix = String(Math.max(1, Math.trunc(args.index))).padStart(3, "0");

  let namePart = "";

  try {
    if (args.exportOptions.filenameColumn) {
      namePart = safeSlugFromRow(args.row, args.exportOptions.filenameColumn);
    }

    if (!namePart) {
      namePart = findFallbackSlug(args.row);
    }
  } catch {
    namePart = "";
  }

  const baseName = namePart
    ? `${prefix}-${namePart}`
    : `${prefix}-${FALLBACK_NAME}`;

  const truncated = baseName.slice(0, MAX_BASE_LENGTH).replace(/-+$/g, "");

  return `${truncated || `${prefix}-${FALLBACK_NAME}`}.pdf`;
}
