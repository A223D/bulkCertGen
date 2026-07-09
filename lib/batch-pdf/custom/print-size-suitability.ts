import {
  ACCEPTABLE_PRINT_DPI,
  assessPrintResolution,
  IDEAL_PRINT_DPI,
  type PrintResolutionLevel,
} from "./export-options.ts";
import type { DesignAsset } from "./types.ts";

export type CommonPrintSize = {
  id: string;
  label: string;
  widthIn: number;
  heightIn: number;
};

export type PrintSizeSuitability = CommonPrintSize & {
  effectiveDpi: number;
  level: PrintResolutionLevel;
  minWidthPxForAcceptable: number;
  minHeightPxForAcceptable: number;
  idealWidthPx: number;
  idealHeightPx: number;
};

export const COMMON_PRINT_SIZES: CommonPrintSize[] = [
  { id: "business-card", label: "Business card", widthIn: 3.5, heightIn: 2 },
  { id: "id-card", label: "Member / event ID card", widthIn: 3.375, heightIn: 2.125 },
  { id: "small-badge", label: "Small badge", widthIn: 4, heightIn: 3 },
  { id: "photo-card", label: "Photo card", widthIn: 4, heightIn: 6 },
  { id: "half-sheet", label: "Half sheet", widthIn: 5.5, heightIn: 8.5 },
  { id: "letter-certificate", label: "Letter certificate", widthIn: 11, heightIn: 8.5 },
];

export function formatPrintSize(widthIn: number, heightIn: number): string {
  const format = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return `${format(widthIn)} x ${format(heightIn)} in`;
}

export function getPrintSizeSuitability(asset: DesignAsset): PrintSizeSuitability[] {
  return COMMON_PRINT_SIZES.flatMap((size) => {
    const assessment = assessPrintResolution({
      intrinsicWidth: asset.intrinsicWidth,
      intrinsicHeight: asset.intrinsicHeight,
      printWidthIn: size.widthIn,
      printHeightIn: size.heightIn,
    });

    if (!assessment) return [];

    return [{
      ...size,
      effectiveDpi: assessment.effectiveDpi,
      level: assessment.level,
      minWidthPxForAcceptable: assessment.minWidthPxForAcceptable,
      minHeightPxForAcceptable: assessment.minHeightPxForAcceptable,
      idealWidthPx: assessment.idealWidthPx,
      idealHeightPx: assessment.idealHeightPx,
    }];
  });
}

export function summarizePrintSizeSuitability(rows: PrintSizeSuitability[]): {
  bestSharpSize: PrintSizeSuitability | null;
  bestAcceptableSize: PrintSizeSuitability | null;
  hasLowOnly: boolean;
} {
  const acceptableRows = rows.filter((row) => row.effectiveDpi >= ACCEPTABLE_PRINT_DPI);
  const sharpRows = rows.filter((row) => row.effectiveDpi >= IDEAL_PRINT_DPI);

  return {
    bestSharpSize: sharpRows.at(-1) ?? null,
    bestAcceptableSize: acceptableRows.at(-1) ?? null,
    hasLowOnly: acceptableRows.length === 0,
  };
}
