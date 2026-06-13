import { CUSTOM_DESIGN_LIMITS } from "../limits.ts";
import type { Result } from "../types.ts";
import type {
  ExportOptions,
  MeasurementUnit,
  PageSizeKey,
} from "./types.ts";

export type PageSizeDefinition = {
  key: PageSizeKey;
  label: string;
  widthInches: number;
  heightInches: number;
};

const commonPageSizes: PageSizeDefinition[] = [
  { key: "letter", label: "Letter", widthInches: 8.5, heightInches: 11 },
  { key: "legal", label: "Legal", widthInches: 8.5, heightInches: 14 },
  {
    key: "a4",
    label: "A4",
    widthInches: 210 / 25.4,
    heightInches: 297 / 25.4,
  },
  {
    key: "a5",
    label: "A5",
    widthInches: 148 / 25.4,
    heightInches: 210 / 25.4,
  },
  {
    key: "a6",
    label: "A6",
    widthInches: 105 / 25.4,
    heightInches: 148 / 25.4,
  },
  { key: "fourBySix", label: "4 x 6", widthInches: 4, heightInches: 6 },
  { key: "idCard", label: "ID Card", widthInches: 3.375, heightInches: 2.125 },
  {
    key: "businessCard",
    label: "Business Card",
    widthInches: 3.5,
    heightInches: 2,
  },
  { key: "custom", label: "Custom", widthInches: 0, heightInches: 0 },
];

function error(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function orientSize(widthPt: number, heightPt: number, orientation: ExportOptions["orientation"]) {
  if (orientation === "portrait") {
    return {
      widthPt: Math.min(widthPt, heightPt),
      heightPt: Math.max(widthPt, heightPt),
    };
  }

  return {
    widthPt: Math.max(widthPt, heightPt),
    heightPt: Math.min(widthPt, heightPt),
  };
}

function measurementToInches(value: number, unit: MeasurementUnit): number {
  return unit === "in" ? value : value / 25.4;
}

function validateNonNegativeMeasurements(options: ExportOptions): Result<ExportOptions> | null {
  const measurements = [
    options.marginTop,
    options.marginRight,
    options.marginBottom,
    options.marginLeft,
    options.gapX,
    options.gapY,
  ];

  if (measurements.some((value) => !isFiniteNumber(value) || value < 0)) {
    return error(
      "custom_export_negative_spacing",
      "Margins and gaps must be zero or greater.",
    );
  }

  return null;
}

function validateCustomDimension(value: unknown, unit: MeasurementUnit): value is number {
  if (!isFiniteNumber(value)) {
    return false;
  }

  const inches = measurementToInches(value, unit);

  return (
    inches >= CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches &&
    inches <= CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches
  );
}

export function getCommonPageSizes(): PageSizeDefinition[] {
  return commonPageSizes.map((size) => ({ ...size }));
}

export function getPageSizeDefinition(
  key: PageSizeKey,
): PageSizeDefinition | null {
  return commonPageSizes.find((size) => size.key === key) ?? null;
}

export function inchesToPoints(inches: number): number {
  return inches * 72;
}

export function mmToPoints(mm: number): number {
  return (mm / 25.4) * 72;
}

export function measurementToPoints(value: number, unit: MeasurementUnit): number {
  return unit === "in" ? inchesToPoints(value) : mmToPoints(value);
}

export function resolveExportPageSizePoints(options: ExportOptions): Result<{
  widthPt: number;
  heightPt: number;
}> {
  if (options.pageSize === "sameAsDesign") {
    return error(
      "custom_export_same_as_design_unresolved",
      "Same as design requires design dimensions before export.",
    );
  }

  if (options.pageSize === "custom") {
    const { customPageWidth, customPageHeight } = options;

    if (
      !validateCustomDimension(customPageWidth, options.unit) ||
      !validateCustomDimension(customPageHeight, options.unit)
    ) {
      return error(
        "custom_export_invalid_custom_page_size",
        `Custom page size must be between ${CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches} and ${CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches} inches.`,
      );
    }

    return {
      ok: true,
      value: orientSize(
        measurementToPoints(customPageWidth, options.unit),
        measurementToPoints(customPageHeight, options.unit),
        options.orientation,
      ),
    };
  }

  const definition = getPageSizeDefinition(options.pageSize);

  if (!definition) {
    return error("custom_export_unknown_page_size", "Choose a supported page size.");
  }

  return {
    ok: true,
    value: orientSize(
      inchesToPoints(definition.widthInches),
      inchesToPoints(definition.heightInches),
      options.orientation,
    ),
  };
}

export function createDefaultExportOptions(): ExportOptions {
  return {
    outputMode: "individualPdfsZip",
    pageSize: "sameAsDesign",
    orientation: "portrait",
    layoutMode: "onePerPage",
    itemSizeMode: "fromDesign",
    unit: "in",
    marginTop: CUSTOM_DESIGN_LIMITS.defaultMarginInches,
    marginRight: CUSTOM_DESIGN_LIMITS.defaultMarginInches,
    marginBottom: CUSTOM_DESIGN_LIMITS.defaultMarginInches,
    marginLeft: CUSTOM_DESIGN_LIMITS.defaultMarginInches,
    gapX: CUSTOM_DESIGN_LIMITS.defaultGapInches,
    gapY: CUSTOM_DESIGN_LIMITS.defaultGapInches,
    cropMarks: false,
    includeOverflowReport: true,
  };
}

export function validateExportOptions(
  options: ExportOptions,
  csvHeaders: string[] = [],
): Result<ExportOptions> {
  if (
    options.outputMode !== "individualPdfsZip" &&
    options.outputMode !== "printSheetsZip"
  ) {
    return error("custom_export_invalid_output_mode", "Choose a supported output mode.");
  }

  if (options.orientation !== "portrait" && options.orientation !== "landscape") {
    return error("custom_export_invalid_orientation", "Choose a supported orientation.");
  }

  if (options.layoutMode !== "onePerPage" && options.layoutMode !== "fitMultiplePerPage") {
    return error("custom_export_invalid_layout", "Choose a supported layout.");
  }

  if (options.itemSizeMode !== "fromDesign" && options.itemSizeMode !== "custom") {
    return error("custom_export_invalid_item_size", "Choose a supported item size.");
  }

  if (options.unit !== "in" && options.unit !== "mm") {
    return error("custom_export_invalid_unit", "Choose inches or millimetres.");
  }

  if (typeof options.cropMarks !== "boolean" || typeof options.includeOverflowReport !== "boolean") {
    return error("custom_export_invalid_toggle", "Export options must be enabled or disabled.");
  }

  const spacingResult = validateNonNegativeMeasurements(options);

  if (spacingResult) {
    return spacingResult;
  }

  if (options.itemSizeMode === "custom") {
    if (
      !validateCustomDimension(options.customItemWidth, options.unit) ||
      !validateCustomDimension(options.customItemHeight, options.unit)
    ) {
      return error(
        "custom_export_invalid_custom_item_size",
        `Custom item size must be between ${CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches} and ${CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches} inches.`,
      );
    }
  }

  const pageSizeResult = resolveExportPageSizePoints(options);

  if (options.pageSize !== "sameAsDesign" && !pageSizeResult.ok) {
    return pageSizeResult;
  }

  if (pageSizeResult.ok) {
    const horizontalMargins =
      measurementToPoints(options.marginLeft, options.unit) +
      measurementToPoints(options.marginRight, options.unit);
    const verticalMargins =
      measurementToPoints(options.marginTop, options.unit) +
      measurementToPoints(options.marginBottom, options.unit);

    if (
      horizontalMargins >= pageSizeResult.value.widthPt ||
      verticalMargins >= pageSizeResult.value.heightPt
    ) {
      return error(
        "custom_export_margins_too_large",
        "Margins must leave printable space on the page.",
      );
    }
  }

  if (options.filenameColumn && !csvHeaders.includes(options.filenameColumn)) {
    return error(
      "custom_export_unknown_filename_column",
      "The selected filename column no longer exists.",
    );
  }

  return { ok: true, value: options };
}
