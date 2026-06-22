export type DesignFileKind = "png" | "jpeg";

export type DesignAsset = {
  kind: DesignFileKind;
  fileName: string;
  sizeBytes: number;
  pageCount?: number;
  selectedPageIndex: number;
  intrinsicWidth: number;
  intrinsicHeight: number;
  intrinsicUnit: "px";
  aspectRatio: number;
};

export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FieldSource =
  | { type: "csvColumn"; column: string }
  | { type: "staticText"; value: string };

export type TextOverflowMode =
  | "shrinkToFit"
  | "wrap"
  | "truncate"
  | "errorIfOverflow";

export type TextBoxStyle = {
  /** Font catalog id (see lib/batch-pdf/custom/fonts/catalog.ts). */
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontSize: number;
  minFontSize: number;
  color: string;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  lineHeight: number;
  uppercase: boolean;
  overflowMode: TextOverflowMode;
};

export type CustomFieldBox = {
  id: string;
  label: string;
  source: FieldSource;
  rect: NormalizedRect;
  style: TextBoxStyle;
  required: boolean;
};

export type PageSizeKey =
  | "sameAsDesign"
  | "letter"
  | "legal"
  | "a4"
  | "a5"
  | "a6"
  | "fourBySix"
  | "idCard"
  | "businessCard"
  | "custom";

export type MeasurementUnit = "in" | "mm";

export type ExportOptions = {
  pageSize: PageSizeKey;
  orientation: "portrait" | "landscape" | "auto";
  layoutMode: "onePerPage" | "fitMultiplePerPage";
  // How one-per-page output is delivered. "combinedPdf" (default) emits a single
  // multi-page PDF — background and font are embedded once for the whole batch,
  // which is dramatically faster and lighter on memory. "separateFiles" emits
  // one PDF per row inside a ZIP. Only meaningful when layoutMode is
  // "onePerPage" (fitMultiplePerPage is always a single PDF). Optional for
  // backwards compatibility; treat undefined as "combinedPdf".
  outputMode?: "combinedPdf" | "separateFiles";
  // How the background image is embedded. "preservePng" (default) keeps the
  // uploaded image lossless. "baselineJpeg" re-encodes it to a baseline JPEG so
  // pdf-lib embeds the bytes directly (no deflate) — smaller and faster, but
  // lossy. Optional; treat undefined as "preservePng".
  backgroundEncoding?: "preservePng" | "baselineJpeg";
  itemSizeMode: "fromDesign" | "custom";
  customItemWidth?: number;
  customItemHeight?: number;
  customPageWidth?: number;
  customPageHeight?: number;
  unit: MeasurementUnit;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  gapX: number;
  gapY: number;
  cropMarks: boolean;
  includeOverflowReport: boolean;
  filenameColumn?: string;
};
