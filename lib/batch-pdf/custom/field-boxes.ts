import { CUSTOM_DESIGN_LIMITS } from "../limits.ts";
import type { Result } from "../types.ts";
import { validateNormalizedRect } from "./coordinates.ts";
import { isKnownFontFamily } from "./fonts/catalog.ts";
import type {
  CustomFieldBox,
  FieldSource,
  TextBoxStyle,
  TextOverflowMode,
} from "./types.ts";

const fontWeights = ["normal", "bold"] as const;
const aligns = ["left", "center", "right"] as const;
const verticalAligns = ["top", "middle", "bottom"] as const;
const overflowModes: TextOverflowMode[] = [
  "shrinkToFit",
  "wrap",
  "truncate",
  "errorIfOverflow",
];

function error(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

function isOneOf<T extends readonly string[]>(
  value: string,
  candidates: T,
): value is T[number] {
  return candidates.includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function createDefaultTextBoxStyle(): TextBoxStyle {
  return {
    fontFamily: "Helvetica",
    fontWeight: "normal",
    fontSize: CUSTOM_DESIGN_LIMITS.defaultFontSize,
    minFontSize: CUSTOM_DESIGN_LIMITS.defaultMinFontSize,
    color: "#111827",
    align: "center",
    verticalAlign: "middle",
    lineHeight: 1.1,
    uppercase: false,
    overflowMode: "shrinkToFit",
  };
}

export function validateTextBoxStyle(style: TextBoxStyle): Result<TextBoxStyle> {
  if (typeof style.fontFamily !== "string" || !isKnownFontFamily(style.fontFamily)) {
    return error(
      "custom_style_invalid_font_family",
      "Choose a supported font family.",
    );
  }

  if (!isOneOf(style.fontWeight, fontWeights)) {
    return error("custom_style_invalid_font_weight", "Choose a supported font weight.");
  }

  if (
    !isFiniteNumber(style.fontSize) ||
    style.fontSize < CUSTOM_DESIGN_LIMITS.minFontSize ||
    style.fontSize > CUSTOM_DESIGN_LIMITS.maxFontSize
  ) {
    return error(
      "custom_style_invalid_font_size",
      `Font size must be between ${CUSTOM_DESIGN_LIMITS.minFontSize} and ${CUSTOM_DESIGN_LIMITS.maxFontSize}.`,
    );
  }

  if (
    !isFiniteNumber(style.minFontSize) ||
    style.minFontSize < CUSTOM_DESIGN_LIMITS.minFontSize ||
    style.minFontSize > CUSTOM_DESIGN_LIMITS.maxFontSize
  ) {
    return error(
      "custom_style_invalid_min_font_size",
      `Minimum font size must be at least ${CUSTOM_DESIGN_LIMITS.minFontSize}.`,
    );
  }

  if (style.minFontSize > style.fontSize) {
    return error(
      "custom_style_min_font_above_font_size",
      "Minimum font size cannot be larger than font size.",
    );
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(style.color)) {
    return error("custom_style_invalid_color", "Use a 6-digit hex color.");
  }

  if (!isOneOf(style.align, aligns)) {
    return error("custom_style_invalid_align", "Choose a supported text alignment.");
  }

  if (!isOneOf(style.verticalAlign, verticalAligns)) {
    return error(
      "custom_style_invalid_vertical_align",
      "Choose a supported vertical alignment.",
    );
  }

  if (!isFiniteNumber(style.lineHeight) || style.lineHeight < 0.8 || style.lineHeight > 2) {
    return error(
      "custom_style_invalid_line_height",
      "Line height must be between 0.8 and 2.",
    );
  }

  if (typeof style.uppercase !== "boolean") {
    return error(
      "custom_style_invalid_uppercase",
      "Uppercase must be enabled or disabled.",
    );
  }

  if (!overflowModes.includes(style.overflowMode)) {
    return error(
      "custom_style_invalid_overflow_mode",
      "Choose a supported overflow mode.",
    );
  }

  return { ok: true, value: style };
}

export function validateFieldSource(
  source: FieldSource,
  csvHeaders: string[],
): Result<FieldSource> {
  if (source.type === "csvColumn") {
    if (!csvHeaders.includes(source.column)) {
      return error(
        "custom_source_unknown_column",
        "The selected CSV column no longer exists. Choose another column.",
      );
    }

    return { ok: true, value: source };
  }

  if (source.type === "staticText") {
    if (source.value.trim() === "") {
      return error(
        "custom_source_empty_static_text",
        "Static text cannot be empty.",
      );
    }

    if (source.value.length > CUSTOM_DESIGN_LIMITS.maxStaticTextLength) {
      return error(
        "custom_source_static_text_too_long",
        `Static text must be ${CUSTOM_DESIGN_LIMITS.maxStaticTextLength} characters or fewer.`,
      );
    }

    return { ok: true, value: source };
  }

  return error("custom_source_invalid", "Choose a supported field source.");
}

export function validateCustomFieldBox(
  box: CustomFieldBox,
  csvHeaders: string[],
): Result<CustomFieldBox> {
  if (box.id.trim() === "") {
    return error("custom_box_missing_id", "Field boxes must have an ID.");
  }

  if (box.label.trim() === "") {
    return error("custom_box_empty_label", "Field box labels cannot be empty.");
  }

  if (box.label.length > CUSTOM_DESIGN_LIMITS.maxFieldLabelLength) {
    return error(
      "custom_box_label_too_long",
      `Field box labels must be ${CUSTOM_DESIGN_LIMITS.maxFieldLabelLength} characters or fewer.`,
    );
  }

  const sourceResult = validateFieldSource(box.source, csvHeaders);

  if (!sourceResult.ok) {
    return sourceResult;
  }

  const rectResult = validateNormalizedRect(box.rect);

  if (!rectResult.ok) {
    return rectResult;
  }

  const styleResult = validateTextBoxStyle(box.style);

  if (!styleResult.ok) {
    return styleResult;
  }

  if (typeof box.required !== "boolean") {
    return error("custom_box_invalid_required", "Required must be enabled or disabled.");
  }

  return { ok: true, value: box };
}

export function validateCustomFieldBoxes(
  boxes: CustomFieldBox[],
  csvHeaders: string[],
): Result<CustomFieldBox[]> {
  if (boxes.length > CUSTOM_DESIGN_LIMITS.maxFieldBoxes) {
    return error(
      "custom_boxes_too_many",
      `Use ${CUSTOM_DESIGN_LIMITS.maxFieldBoxes} field boxes or fewer.`,
    );
  }

  const boxIds = new Set<string>();

  for (const box of boxes) {
    if (boxIds.has(box.id)) {
      return error("custom_boxes_duplicate_id", "Field box IDs must be unique.");
    }

    boxIds.add(box.id);

    const boxResult = validateCustomFieldBox(box, csvHeaders);

    if (!boxResult.ok) {
      return boxResult;
    }
  }

  return { ok: true, value: boxes };
}

export function validateCustomFieldBoxesForExport(
  boxes: CustomFieldBox[],
  csvHeaders: string[],
): Result<CustomFieldBox[]> {
  if (boxes.length === 0) {
    return error(
      "custom_boxes_required_for_export",
      "Add at least one field box before exporting.",
    );
  }

  return validateCustomFieldBoxes(boxes, csvHeaders);
}
