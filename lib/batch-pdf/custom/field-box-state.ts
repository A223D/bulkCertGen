import { CUSTOM_DESIGN_LIMITS } from "../limits.ts";
import type { Result } from "../types.ts";
import { clampNormalizedRect } from "./coordinates.ts";
import {
  createDefaultTextBoxStyle,
  validateCustomFieldBox,
  validateCustomFieldBoxes,
  validateCustomFieldBoxesForExport,
} from "./field-boxes.ts";
import type { CustomFieldBox, NormalizedRect } from "./types.ts";

const defaultRect: NormalizedRect = {
  x: 0.35,
  y: 0.42,
  width: 0.3,
  height: 0.08,
};

const rectOffset = 0.025;

function error(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

function makeUniqueId(existingBoxes: CustomFieldBox[]): string {
  const existingIds = new Set(existingBoxes.map((box) => box.id));
  let index = existingBoxes.length + 1;
  let id = `field-box-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `field-box-${index}`;
  }

  return id;
}

function makeOffsetRect(existingBoxes: CustomFieldBox[]): NormalizedRect {
  const offset = (existingBoxes.length % 8) * rectOffset;

  return clampNormalizedRect({
    ...defaultRect,
    x: defaultRect.x + offset,
    y: defaultRect.y + offset,
  });
}

function labelFromColumn(column: string): string {
  const trimmed = column.trim();

  if (!trimmed) {
    return "CSV field";
  }

  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function createDefaultCsvFieldBox(args: {
  column: string;
  existingBoxes: CustomFieldBox[];
}): CustomFieldBox {
  return {
    id: makeUniqueId(args.existingBoxes),
    label: labelFromColumn(args.column),
    source: { type: "csvColumn", column: args.column },
    rect: makeOffsetRect(args.existingBoxes),
    style: createDefaultTextBoxStyle(),
    // Missing values render blank rather than blocking export.
    required: false,
  };
}

export function createDefaultStaticTextBox(args: {
  value?: string;
  existingBoxes: CustomFieldBox[];
}): CustomFieldBox {
  return {
    id: makeUniqueId(args.existingBoxes),
    label: "Static text",
    source: { type: "staticText", value: args.value ?? "Static text" },
    rect: makeOffsetRect(args.existingBoxes),
    style: createDefaultTextBoxStyle(),
    required: false,
  };
}

export function addFieldBox(args: {
  boxes: CustomFieldBox[];
  box: CustomFieldBox;
  csvHeaders: string[];
}): Result<CustomFieldBox[]> {
  if (args.boxes.length >= CUSTOM_DESIGN_LIMITS.maxFieldBoxes) {
    return error(
      "custom_boxes_too_many",
      `Use ${CUSTOM_DESIGN_LIMITS.maxFieldBoxes} field boxes or fewer.`,
    );
  }

  const nextBoxes = [...args.boxes, args.box];
  const result = validateCustomFieldBoxes(nextBoxes, args.csvHeaders);

  if (!result.ok) {
    return result;
  }

  return { ok: true, value: nextBoxes };
}

export function updateFieldBox(args: {
  boxes: CustomFieldBox[];
  boxId: string;
  patch: Partial<CustomFieldBox>;
  csvHeaders: string[];
}): Result<CustomFieldBox[]> {
  const targetBox = getFieldBoxById(args.boxes, args.boxId);

  if (!targetBox) {
    return error("custom_box_not_found", "Choose an existing field box.");
  }

  const nextBox: CustomFieldBox = {
    ...targetBox,
    ...args.patch,
  };
  const boxResult = validateCustomFieldBox(nextBox, args.csvHeaders);

  if (!boxResult.ok) {
    return boxResult;
  }

  const nextBoxes = args.boxes.map((box) =>
    box.id === args.boxId ? nextBox : box,
  );
  const boxesResult = validateCustomFieldBoxes(nextBoxes, args.csvHeaders);

  if (!boxesResult.ok) {
    return boxesResult;
  }

  return { ok: true, value: nextBoxes };
}

export function removeFieldBox(args: {
  boxes: CustomFieldBox[];
  boxId: string;
}): CustomFieldBox[] {
  return args.boxes.filter((box) => box.id !== args.boxId);
}

export function duplicateFieldBox(args: {
  boxes: CustomFieldBox[];
  boxId: string;
  csvHeaders: string[];
}): Result<CustomFieldBox[]> {
  const box = getFieldBoxById(args.boxes, args.boxId);

  if (!box) {
    return error("custom_box_not_found", "Choose an existing field box.");
  }

  const duplicate: CustomFieldBox = {
    ...box,
    id: makeUniqueId(args.boxes),
    label: `${box.label} copy`,
    rect: clampNormalizedRect({
      ...box.rect,
      x: box.rect.x + rectOffset,
      y: box.rect.y + rectOffset,
    }),
    style: { ...box.style },
    source: { ...box.source },
  };

  return addFieldBox({
    boxes: args.boxes,
    box: duplicate,
    csvHeaders: args.csvHeaders,
  });
}

export function getFieldBoxById(
  boxes: CustomFieldBox[],
  boxId: string | null,
): CustomFieldBox | null {
  if (!boxId) {
    return null;
  }

  return boxes.find((box) => box.id === boxId) ?? null;
}

export function isCustomFieldPlacementReady(args: {
  boxes: CustomFieldBox[];
  csvHeaders: string[];
}): boolean {
  return validateCustomFieldBoxesForExport(args.boxes, args.csvHeaders).ok;
}
