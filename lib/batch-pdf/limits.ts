export const BATCH_PDF_LIMITS = {
  maxCsvFileSizeBytes: 2 * 1024 * 1024,
  maxRowsParsed: 500,
  maxColumns: 50,
  maxFieldLength: 300,
  freeExportRows: 500,
  maxZipFiles: 500,
  // Max per-row PDFDocuments built concurrently in the separate-files path.
  // Bounds peak memory; overridable via CUSTOM_EXPORT_CONCURRENCY.
  customExportConcurrency: 4,
} as const;

/**
 * Concurrency for per-row PDF rendering in the separate-files export path.
 * Reads CUSTOM_EXPORT_CONCURRENCY when set to a positive integer, otherwise
 * falls back to the default limit.
 */
export function getCustomExportConcurrency(): number {
  const raw = process.env.CUSTOM_EXPORT_CONCURRENCY;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return BATCH_PDF_LIMITS.customExportConcurrency;
}

export const CUSTOM_DESIGN_LIMITS = {
  maxDesignFileSizeBytes: 10 * 1024 * 1024,
  maxFieldBoxes: 50,
  minBoxWidthNormalized: 0.01,
  minBoxHeightNormalized: 0.01,
  defaultFontSize: 18,
  defaultMinFontSize: 8,
  maxFontSize: 96,
  minFontSize: 5,
  maxStaticTextLength: 300,
  maxFieldLabelLength: 80,
  maxCustomPageSizeInches: 48,
  minCustomPageSizeInches: 0.5,
  defaultGapInches: 0.125,
  defaultMarginInches: 0.25,
} as const;
