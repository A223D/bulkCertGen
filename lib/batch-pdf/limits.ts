export const BATCH_PDF_LIMITS = {
  maxCsvFileSizeBytes: 2 * 1024 * 1024,
  maxRowsParsed: 500,
  maxColumns: 50,
  maxFieldLength: 300,
  freeExportRows: 10,
  paidExportRows: 500,
  maxZipFiles: 500,
} as const;

export const CUSTOM_DESIGN_LIMITS = {
  maxDesignFileSizeBytes: 10 * 1024 * 1024,
  maxPdfPagesAccepted: 1,
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
