import type { Result, CsvRow } from "../types.ts";
import { measurementToPoints, measurementToInches } from "./export-options.ts";
import { normalizedRectToPoints } from "./coordinates.ts";
import { validateCustomFieldBoxes } from "./field-boxes.ts";
import {
  findFontsSupportingText,
  getUnsupportedCodePoints,
} from "./fonts/font-coverage.ts";
import { resolveTextFit, type TextFitBox } from "./text-fit.ts";
import { normalizePrintableText } from "../text-normalization.ts";
import { CUSTOM_DESIGN_LIMITS } from "../limits.ts";
import type { CustomFieldBox, DesignAsset, ExportOptions } from "./types.ts";

// ---------------------------------------------------------------------------
// Issue and summary types
// ---------------------------------------------------------------------------

export type PreflightSeverity = "info" | "warning" | "error";

export type PreflightIssueCode =
  | "missing_required_value"
  | "text_truncated"
  | "text_overflow"
  | "text_shrunk"
  | "text_wrapped"
  | "text_taller_than_box"
  | "unsupported_characters"
  | "invalid_field_box"
  | "needs_output_size";

export type PreflightIssue = {
  code: PreflightIssueCode;
  severity: PreflightSeverity;
  rowIndex?: number;
  fieldBoxId?: string;
  fieldLabel?: string;
  sourceColumn?: string;
  valueLength?: number;
  fontFamily?: string;
  unsupportedCodePoints?: string[];
  recommendedFonts?: string[];
  message: string;
};

export type PreflightSummary = {
  rowCount: number;
  fieldBoxCount: number;
  checkedCellCount: number;
  fitCount: number;
  warningCount: number;
  errorCount: number;
  blocksExport: boolean;
};

export type CustomDesignPreflightResult = {
  status: "ready" | "readyWithWarnings" | "blocked" | "needsOutputSize";
  summary: PreflightSummary;
  issues: PreflightIssue[];
};

// ---------------------------------------------------------------------------
// Design item size resolver
// ---------------------------------------------------------------------------

export function resolveDesignItemSizeForPreflight(args: {
  design: DesignAsset;
  exportOptions?: ExportOptions;
}): Result<{
  widthPt: number;
  heightPt: number;
  source: "customItemSize" | "pageSizeFallback";
}> {
  const { exportOptions } = args;

  // Image designs measure text against the custom item size the compositor will
  // render into. Without it, preflight cannot resolve a physical box.
  if (
    exportOptions?.itemSizeMode === "custom" &&
    typeof exportOptions.customItemWidth === "number" &&
    typeof exportOptions.customItemHeight === "number"
  ) {
    const widthIn = measurementToInches(exportOptions.customItemWidth, exportOptions.unit);
    const heightIn = measurementToInches(exportOptions.customItemHeight, exportOptions.unit);

    const inBounds =
      widthIn >= CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches &&
      widthIn <= CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches &&
      heightIn >= CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches &&
      heightIn <= CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches;

    if (exportOptions.customItemWidth > 0 && exportOptions.customItemHeight > 0 && inBounds) {
      return {
        ok: true,
        value: {
          widthPt: measurementToPoints(exportOptions.customItemWidth, exportOptions.unit),
          heightPt: measurementToPoints(exportOptions.customItemHeight, exportOptions.unit),
          source: "customItemSize",
        },
      };
    }
  }

  // No custom size yet: need physical output dimensions.
  return {
    ok: false,
    errors: [
      {
        code: "needs_output_size",
        message: "Image designs require a custom item size to enable text-fit preflight.",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Row text resolver
// ---------------------------------------------------------------------------

export function getFieldBoxTextForRow(args: {
  row: CsvRow;
  box: CustomFieldBox;
}): {
  text: string;
  sourceColumn?: string;
  missingRequired: boolean;
  valueLength: number;
} {
  const { row, box } = args;

  if (box.source.type === "staticText") {
    const text = normalizePrintableText(box.source.value);
    return {
      text,
      sourceColumn: undefined,
      missingRequired: false,
      valueLength: text.length,
    };
  }

  const column = box.source.column;
  const value = normalizePrintableText(row[column] ?? "");
  const isEmpty = value.trim() === "";

  return {
    text: value,
    sourceColumn: column,
    missingRequired: box.required && isEmpty,
    valueLength: value.length,
  };
}

// ---------------------------------------------------------------------------
// Preflight engine
// ---------------------------------------------------------------------------

// Maximum issues included in the result to avoid unbounded memory growth
// while still computing correct summary counts.
const MAX_ISSUES = 500;

export function runCustomDesignPreflight(args: {
  design: DesignAsset;
  rows: CsvRow[];
  fieldBoxes: CustomFieldBox[];
  exportOptions?: ExportOptions;
  csvHeaders: string[];
}): Result<CustomDesignPreflightResult> {
  const { design, rows, fieldBoxes, exportOptions, csvHeaders } = args;

  // Validate field box collection.
  const boxesResult = validateCustomFieldBoxes(fieldBoxes, csvHeaders);
  if (!boxesResult.ok) {
    return { ok: false, errors: boxesResult.errors };
  }

  // Resolve physical design dimensions.
  const sizeResult = resolveDesignItemSizeForPreflight({ design, exportOptions });

  if (!sizeResult.ok) {
    return {
      ok: true,
      value: {
        status: "needsOutputSize",
        summary: {
          rowCount: rows.length,
          fieldBoxCount: fieldBoxes.length,
          checkedCellCount: 0,
          fitCount: 0,
          warningCount: 0,
          errorCount: 0,
          blocksExport: false,
        },
        issues: [
          {
            code: "needs_output_size",
            severity: "warning",
            message:
              "Choose a finished size in the 'Finished size' section above so text fit can be checked for this image design.",
          },
        ],
      },
    };
  }

  const { widthPt, heightPt } = sizeResult.value;

  const issues: PreflightIssue[] = [];
  let fitCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let checkedCellCount = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    for (const box of fieldBoxes) {
      checkedCellCount++;

      const { text, sourceColumn, missingRequired, valueLength } = getFieldBoxTextForRow({
        row,
        box,
      });

      // Missing required value — blocking error.
      if (missingRequired) {
        errorCount++;
        pushIssue(issues, {
          code: "missing_required_value",
          severity: "error",
          rowIndex,
          fieldBoxId: box.id,
          fieldLabel: box.label,
          sourceColumn,
          valueLength: 0,
          message: `Row ${rowIndex + 1}: required value is missing for field "${box.label}".`,
        });
        continue;
      }

      const unsupportedCodePoints = getUnsupportedCodePoints({
        text,
        fontFamily: box.style.fontFamily,
        fontWeight: box.style.fontWeight,
        uppercase: box.style.uppercase,
      });

      if (unsupportedCodePoints.length > 0) {
        errorCount++;
        pushIssue(issues, {
          code: "unsupported_characters",
          severity: "error",
          rowIndex,
          fieldBoxId: box.id,
          fieldLabel: box.label,
          sourceColumn,
          valueLength,
          fontFamily: box.style.fontFamily,
          unsupportedCodePoints,
          recommendedFonts: findFontsSupportingText({
            text,
            fontWeight: box.style.fontWeight,
            uppercase: box.style.uppercase,
            limit: 3,
          }),
          message: `Row ${rowIndex + 1}: field "${box.label}" contains characters that "${box.style.fontFamily}" cannot print (${unsupportedCodePoints.join(", ")}).`,
        });
        continue;
      }

      // Convert normalized rect to physical box in points.
      const physRect = normalizedRectToPoints({
        rect: box.rect,
        pageWidthPt: widthPt,
        pageHeightPt: heightPt,
      });

      const fitBox: TextFitBox = {
        widthPt: physRect.width,
        heightPt: physRect.height,
      };

      const fitResult = resolveTextFit({ text, box: fitBox, style: box.style });

      if (fitResult.blocksExport) {
        errorCount++;
        pushIssue(issues, {
          code: "text_overflow",
          severity: "error",
          rowIndex,
          fieldBoxId: box.id,
          fieldLabel: box.label,
          sourceColumn,
          valueLength,
          message: `Row ${rowIndex + 1}: text does not fit in "${box.label}". Enlarge the box, reduce font size, or choose a different overflow mode.`,
        });
      } else if (fitResult.warningCode === "text_truncated") {
        warningCount++;
        fitCount++;
        pushIssue(issues, {
          code: "text_truncated",
          severity: "warning",
          rowIndex,
          fieldBoxId: box.id,
          fieldLabel: box.label,
          sourceColumn,
          valueLength,
          message: `Row ${rowIndex + 1}: text in "${box.label}" will be cut short with an ellipsis (${valueLength} characters).`,
        });
      } else if (fitResult.warningCode === "text_taller_than_box") {
        warningCount++;
        fitCount++;
        pushIssue(issues, {
          code: "text_taller_than_box",
          severity: "warning",
          rowIndex,
          fieldBoxId: box.id,
          fieldLabel: box.label,
          sourceColumn,
          valueLength,
          message: `Row ${rowIndex + 1}: text in "${box.label}" is taller than its box at ${box.style.fontSize} pt. Lower the font size or enlarge the box.`,
        });
      } else if (fitResult.warningCode === "text_shrunk") {
        warningCount++;
        fitCount++;
        pushIssue(issues, {
          code: "text_shrunk",
          severity: "info",
          rowIndex,
          fieldBoxId: box.id,
          fieldLabel: box.label,
          sourceColumn,
          valueLength,
          message: `Row ${rowIndex + 1}: text in "${box.label}" will be shrunk to ${fitResult.fontSize} pt to fit.`,
        });
      } else if (fitResult.warningCode === "text_wrapped") {
        warningCount++;
        fitCount++;
        pushIssue(issues, {
          code: "text_wrapped",
          severity: "info",
          rowIndex,
          fieldBoxId: box.id,
          fieldLabel: box.label,
          sourceColumn,
          valueLength,
          message: `Row ${rowIndex + 1}: text in "${box.label}" will wrap to ${fitResult.lineCount} lines.`,
        });
      } else {
        fitCount++;
      }
    }
  }

  const blocksExport = errorCount > 0;
  let status: CustomDesignPreflightResult["status"];

  if (blocksExport) {
    status = "blocked";
  } else if (warningCount > 0) {
    status = "readyWithWarnings";
  } else {
    status = "ready";
  }

  return {
    ok: true,
    value: {
      status,
      summary: {
        rowCount: rows.length,
        fieldBoxCount: fieldBoxes.length,
        checkedCellCount,
        fitCount,
        warningCount,
        errorCount,
        blocksExport,
      },
      issues,
    },
  };
}

function pushIssue(issues: PreflightIssue[], issue: PreflightIssue): void {
  if (issues.length < MAX_ISSUES) {
    issues.push(issue);
  }
}
