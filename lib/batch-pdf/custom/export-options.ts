import { CUSTOM_DESIGN_LIMITS } from "../limits.ts";
import type { Result } from "../types.ts";
import { calculateSheetLayout } from "./sheet-layout.ts";
import type {
  DesignAsset,
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

export function applyOrientation(args: {
  widthPt: number;
  heightPt: number;
  orientation: "portrait" | "landscape";
}): { widthPt: number; heightPt: number } {
  const { widthPt, heightPt, orientation } = args;

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

function orientSize(widthPt: number, heightPt: number, orientation: ExportOptions["orientation"]) {
  return applyOrientation({ widthPt, heightPt, orientation });
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

function hasValidCustomItemSize(options: ExportOptions): boolean {
  return (
    options.itemSizeMode === "custom" &&
    isFiniteNumber(options.customItemWidth) &&
    options.customItemWidth > 0 &&
    isFiniteNumber(options.customItemHeight) &&
    options.customItemHeight > 0
  );
}

/**
 * Resolves the physical item size (single design footprint) in PDF points.
 *
 * - `fromDesign` uses the design's intrinsic dimensions when they are already
 *   in PDF points (PDF designs). Image designs (pixels) cannot be treated as
 *   physical points and require a custom item size.
 * - `custom` uses the user-supplied width/height converted from the chosen unit.
 */
export function resolveExportItemSizePoints(args: {
  exportOptions: ExportOptions;
  designAsset: DesignAsset;
}): Result<{
  widthPt: number;
  heightPt: number;
  source: "sameAsDesign" | "customItemSize";
}> {
  const { exportOptions, designAsset } = args;

  if (exportOptions.itemSizeMode === "custom") {
    if (!hasValidCustomItemSize(exportOptions)) {
      return error(
        "custom_export_invalid_custom_item_size",
        "Enter a valid custom item width and height.",
      );
    }

    return {
      ok: true,
      value: {
        widthPt: measurementToPoints(exportOptions.customItemWidth as number, exportOptions.unit),
        heightPt: measurementToPoints(exportOptions.customItemHeight as number, exportOptions.unit),
        source: "customItemSize",
      },
    };
  }

  // fromDesign
  if (designAsset.intrinsicUnit === "pt") {
    return {
      ok: true,
      value: {
        widthPt: designAsset.intrinsicWidth,
        heightPt: designAsset.intrinsicHeight,
        source: "sameAsDesign",
      },
    };
  }

  return error(
    "needs_output_size",
    "Image designs use pixels. Enter the intended print size so export dimensions match.",
  );
}

/**
 * Resolves the print-sheet page size in PDF points, including the
 * `sameAsDesign` case which depends on the design asset.
 */
export function resolveSheetPageSizePoints(args: {
  exportOptions: ExportOptions;
  designAsset: DesignAsset;
}): Result<{
  widthPt: number;
  heightPt: number;
  source: "sameAsDesign" | "commonPageSize" | "customPageSize";
}> {
  const { exportOptions, designAsset } = args;

  if (exportOptions.pageSize === "sameAsDesign") {
    const itemSize = resolveExportItemSizePoints({ exportOptions, designAsset });

    if (!itemSize.ok) {
      return itemSize;
    }

    return {
      ok: true,
      value: {
        ...applyOrientation({
          widthPt: itemSize.value.widthPt,
          heightPt: itemSize.value.heightPt,
          orientation: exportOptions.orientation,
        }),
        source: "sameAsDesign",
      },
    };
  }

  const pageResult = resolveExportPageSizePoints(exportOptions);

  if (!pageResult.ok) {
    return pageResult;
  }

  return {
    ok: true,
    value: {
      ...pageResult.value,
      source: exportOptions.pageSize === "custom" ? "customPageSize" : "commonPageSize",
    },
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
  designAsset?: DesignAsset,
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

  // When a design asset is supplied we can fully resolve sizes and confirm that
  // a print-sheet layout actually fits at least one item per page.
  if (designAsset) {
    const itemSize = resolveExportItemSizePoints({ exportOptions: options, designAsset });

    if (!itemSize.ok) {
      return itemSize as Result<ExportOptions>;
    }

    if (options.layoutMode === "fitMultiplePerPage") {
      const pageSize = resolveSheetPageSizePoints({ exportOptions: options, designAsset });

      if (!pageSize.ok) {
        return pageSize as Result<ExportOptions>;
      }

      const layout = calculateSheetLayout({
        rowCount: 1,
        pageWidthPt: pageSize.value.widthPt,
        pageHeightPt: pageSize.value.heightPt,
        itemWidthPt: itemSize.value.widthPt,
        itemHeightPt: itemSize.value.heightPt,
        marginTopPt: measurementToPoints(options.marginTop, options.unit),
        marginRightPt: measurementToPoints(options.marginRight, options.unit),
        marginBottomPt: measurementToPoints(options.marginBottom, options.unit),
        marginLeftPt: measurementToPoints(options.marginLeft, options.unit),
        gapXPt: measurementToPoints(options.gapX, options.unit),
        gapYPt: measurementToPoints(options.gapY, options.unit),
      });

      if (!layout.ok) {
        return layout as Result<ExportOptions>;
      }
    }
  }

  return { ok: true, value: options };
}
