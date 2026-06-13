export const BATCH_PDF_LIMITS = {
  maxCsvFileSizeBytes: 2 * 1024 * 1024,
  maxRowsParsed: 500,
  maxColumns: 50,
  maxFieldLength: 300,
  freeExportRows: 10,
  paidExportRows: 500,
  maxZipFiles: 500,
} as const;
