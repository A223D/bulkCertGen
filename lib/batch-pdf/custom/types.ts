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
  fontFamily: "Helvetica" | "Times" | "Courier";
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
