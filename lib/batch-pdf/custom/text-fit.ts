import {
  estimateLineHeightPt,
  estimateNormalizedTextWidthUnits,
  estimateTextBlockHeightPt,
  normalizeTextForMeasurement,
} from "./text-measurement.ts";
import type { TextBoxStyle } from "./types.ts";

export type TextFitBox = {
  widthPt: number;
  heightPt: number;
};

export type TextFitStatus =
  | "fits"
  | "fitsWithShrink"
  | "fitsWithWrap"
  | "fitsWithTruncation"
  | "overflow";

export type TextFitResult = {
  status: TextFitStatus;
  originalTextLength: number;
  renderedText: string;
  fontSize: number;
  lineCount: number;
  overflowMode: TextBoxStyle["overflowMode"];
  blocksExport: boolean;
  warningCode?: string;
};

const ELLIPSIS = "...";

// Returns width of pre-normalized text in points at the given font size.
function measurePt(
  text: string,
  style: TextBoxStyle,
  fontSize: number,
): number {
  return (estimateNormalizedTextWidthUnits(text, style.fontFamily, style.fontWeight) / 1000) * fontSize;
}

export function wrapTextToLines(args: {
  text: string;
  boxWidthPt: number;
  style: TextBoxStyle;
  fontSize?: number;
}): string[] {
  const fontSize = args.fontSize ?? args.style.fontSize;
  const text = normalizeTextForMeasurement({ text: args.text, uppercase: args.style.uppercase });

  if (!text) return [""];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      // Always start a line with the word, even if the word itself is too wide.
      currentLine = word;
    } else {
      const candidate = currentLine + " " + word;
      const candidateWidth = measurePt(candidate, args.style, fontSize);

      if (candidateWidth <= args.boxWidthPt) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
  }

  lines.push(currentLine);
  return lines;
}

export function truncateTextToFit(args: {
  text: string;
  boxWidthPt: number;
  style: TextBoxStyle;
  fontSize?: number;
}): string {
  const fontSize = args.fontSize ?? args.style.fontSize;
  const text = normalizeTextForMeasurement({ text: args.text, uppercase: args.style.uppercase });

  if (measurePt(text, args.style, fontSize) <= args.boxWidthPt) {
    return text;
  }

  const ellipsisWidth = measurePt(ELLIPSIS, args.style, fontSize);
  const targetWidth = args.boxWidthPt - ellipsisWidth;

  if (targetWidth <= 0) return ELLIPSIS;

  // Walk characters accumulating width to avoid O(n²) recomputation.
  const targetUnits = (targetWidth / fontSize) * 1000;
  let cumulativeUnits = 0;
  let result = "";

  for (const char of text) {
    const charUnits = estimateNormalizedTextWidthUnits(char, args.style.fontFamily, args.style.fontWeight);

    if (cumulativeUnits + charUnits > targetUnits) break;

    cumulativeUnits += charUnits;
    result += char;
  }

  return result + ELLIPSIS;
}

export function doesTextFit(args: {
  text: string;
  box: TextFitBox;
  style: TextBoxStyle;
  fontSize?: number;
  allowWrap?: boolean;
}): boolean {
  const fontSize = args.fontSize ?? args.style.fontSize;
  const text = normalizeTextForMeasurement({ text: args.text, uppercase: args.style.uppercase });

  if (!text) return true;

  if (args.allowWrap) {
    const lines = wrapTextToLines({
      text: args.text,
      boxWidthPt: args.box.widthPt,
      style: args.style,
      fontSize,
    });
    const totalHeight = estimateTextBlockHeightPt({
      lineCount: lines.length,
      fontSize,
      lineHeight: args.style.lineHeight,
    });
    return totalHeight <= args.box.heightPt;
  }

  const width = measurePt(text, args.style, fontSize);
  const lineHeight = estimateLineHeightPt({ fontSize, lineHeight: args.style.lineHeight });
  return width <= args.box.widthPt && lineHeight <= args.box.heightPt;
}

export function resolveTextFit(args: {
  text: string;
  box: TextFitBox;
  style: TextBoxStyle;
}): TextFitResult {
  const { text, box, style } = args;
  const normalizedText = normalizeTextForMeasurement({ text, uppercase: style.uppercase });
  const originalTextLength = text.length;

  if (!normalizedText) {
    return {
      status: "fits",
      originalTextLength,
      renderedText: "",
      fontSize: style.fontSize,
      lineCount: 0,
      overflowMode: style.overflowMode,
      blocksExport: false,
    };
  }

  switch (style.overflowMode) {
    case "shrinkToFit":
      return resolveShrinkToFit(normalizedText, box, style, originalTextLength);

    case "wrap":
      return resolveWrap(text, box, style, originalTextLength);

    case "truncate":
      return resolveTruncate(text, box, style, normalizedText, originalTextLength);

    case "errorIfOverflow":
      return resolveErrorIfOverflow(normalizedText, box, style, originalTextLength);
  }
}

function resolveShrinkToFit(
  normalizedText: string,
  box: TextFitBox,
  style: TextBoxStyle,
  originalTextLength: number,
): TextFitResult {
  // Check if text fits at configured size first (most common path).
  if (fitsSingleLine(normalizedText, box, style, style.fontSize)) {
    return {
      status: "fits",
      originalTextLength,
      renderedText: normalizedText,
      fontSize: style.fontSize,
      lineCount: 1,
      overflowMode: "shrinkToFit",
      blocksExport: false,
    };
  }

  // Binary search for the largest integer font size in [minFontSize, fontSize-1] that fits.
  let low = style.minFontSize;
  let high = style.fontSize - 1;
  let fittingSize: number | null = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (fitsSingleLine(normalizedText, box, style, mid)) {
      fittingSize = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (fittingSize !== null) {
    return {
      status: "fitsWithShrink",
      originalTextLength,
      renderedText: normalizedText,
      fontSize: fittingSize,
      lineCount: 1,
      overflowMode: "shrinkToFit",
      blocksExport: false,
      warningCode: "text_shrunk",
    };
  }

  return {
    status: "overflow",
    originalTextLength,
    renderedText: normalizedText,
    fontSize: style.minFontSize,
    lineCount: 1,
    overflowMode: "shrinkToFit",
    blocksExport: true,
    warningCode: "text_overflow",
  };
}

function resolveWrap(
  rawText: string,
  box: TextFitBox,
  style: TextBoxStyle,
  originalTextLength: number,
): TextFitResult {
  const lines = wrapTextToLines({ text: rawText, boxWidthPt: box.widthPt, style });
  const totalHeight = estimateTextBlockHeightPt({
    lineCount: lines.length,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
  });

  const renderedText = lines.join("\n");
  const wrapped = lines.length > 1;

  if (totalHeight <= box.heightPt) {
    return {
      status: wrapped ? "fitsWithWrap" : "fits",
      originalTextLength,
      renderedText,
      fontSize: style.fontSize,
      lineCount: lines.length,
      overflowMode: "wrap",
      blocksExport: false,
      warningCode: wrapped ? "text_wrapped" : undefined,
    };
  }

  return {
    status: "overflow",
    originalTextLength,
    renderedText,
    fontSize: style.fontSize,
    lineCount: lines.length,
    overflowMode: "wrap",
    blocksExport: true,
    warningCode: "text_overflow",
  };
}

function resolveTruncate(
  rawText: string,
  box: TextFitBox,
  style: TextBoxStyle,
  normalizedText: string,
  originalTextLength: number,
): TextFitResult {
  const truncated = truncateTextToFit({ text: rawText, boxWidthPt: box.widthPt, style });
  const wasTruncated = truncated !== normalizedText;

  return {
    status: wasTruncated ? "fitsWithTruncation" : "fits",
    originalTextLength,
    renderedText: truncated,
    fontSize: style.fontSize,
    lineCount: 1,
    overflowMode: "truncate",
    blocksExport: false,
    warningCode: wasTruncated ? "text_truncated" : undefined,
  };
}

function resolveErrorIfOverflow(
  normalizedText: string,
  box: TextFitBox,
  style: TextBoxStyle,
  originalTextLength: number,
): TextFitResult {
  if (fitsSingleLine(normalizedText, box, style, style.fontSize)) {
    return {
      status: "fits",
      originalTextLength,
      renderedText: normalizedText,
      fontSize: style.fontSize,
      lineCount: 1,
      overflowMode: "errorIfOverflow",
      blocksExport: false,
    };
  }

  return {
    status: "overflow",
    originalTextLength,
    renderedText: normalizedText,
    fontSize: style.fontSize,
    lineCount: 1,
    overflowMode: "errorIfOverflow",
    blocksExport: true,
    warningCode: "text_overflow",
  };
}

function fitsSingleLine(
  normalizedText: string,
  box: TextFitBox,
  style: TextBoxStyle,
  fontSize: number,
): boolean {
  const width = measurePt(normalizedText, style, fontSize);
  const lineHeight = estimateLineHeightPt({ fontSize, lineHeight: style.lineHeight });
  return width <= box.widthPt && lineHeight <= box.heightPt;
}
