import { describe, expect, it } from "vitest";
import { CUSTOM_DESIGN_LIMITS } from "../../lib/batch-pdf/limits.ts";
import {
  createDefaultTextBoxStyle,
  validateCustomFieldBox,
  validateCustomFieldBoxes,
  validateFieldSource,
  validateTextBoxStyle,
} from "../../lib/batch-pdf/custom/field-boxes.ts";
import type { CustomFieldBox, TextBoxStyle } from "../../lib/batch-pdf/custom/types.ts";

const csvHeaders = ["name", "company", "role"];

function makeBox(overrides: Partial<CustomFieldBox> = {}): CustomFieldBox {
  return {
    id: "box-1",
    label: "Name",
    source: { type: "csvColumn", column: "name" },
    rect: { x: 0.1, y: 0.1, width: 0.4, height: 0.2 },
    style: createDefaultTextBoxStyle(),
    required: true,
    ...overrides,
  };
}

function makeStyle(overrides: Partial<TextBoxStyle> = {}): TextBoxStyle {
  return {
    ...createDefaultTextBoxStyle(),
    ...overrides,
  };
}

describe("custom design field box utilities", () => {
  it("creates valid default style", () => {
    expect(createDefaultTextBoxStyle()).toEqual({
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
    });
  });

  it("validates default style", () => {
    expect(validateTextBoxStyle(createDefaultTextBoxStyle()).ok).toBe(true);
  });

  it("rejects unsupported font family", () => {
    expect(
      validateTextBoxStyle(makeStyle({ fontFamily: "Arial" as TextBoxStyle["fontFamily"] }))
        .ok,
    ).toBe(false);
  });

  it("rejects unsupported font weight", () => {
    expect(
      validateTextBoxStyle(makeStyle({ fontWeight: "semibold" as TextBoxStyle["fontWeight"] }))
        .ok,
    ).toBe(false);
  });

  it("rejects invalid hex color", () => {
    expect(validateTextBoxStyle(makeStyle({ color: "#12345" })).ok).toBe(false);
    expect(validateTextBoxStyle(makeStyle({ color: "111827" })).ok).toBe(false);
  });

  it("rejects font size above max", () => {
    expect(
      validateTextBoxStyle(
        makeStyle({ fontSize: CUSTOM_DESIGN_LIMITS.maxFontSize + 1 }),
      ).ok,
    ).toBe(false);
  });

  it("rejects min font size below min", () => {
    expect(
      validateTextBoxStyle(
        makeStyle({ minFontSize: CUSTOM_DESIGN_LIMITS.minFontSize - 1 }),
      ).ok,
    ).toBe(false);
  });

  it("rejects min font size greater than font size", () => {
    expect(validateTextBoxStyle(makeStyle({ fontSize: 10, minFontSize: 11 })).ok).toBe(
      false,
    );
  });

  it("rejects unreasonable line height", () => {
    expect(validateTextBoxStyle(makeStyle({ lineHeight: 0.7 })).ok).toBe(false);
    expect(validateTextBoxStyle(makeStyle({ lineHeight: 2.1 })).ok).toBe(false);
  });

  it("validates csvColumn source when header exists", () => {
    expect(validateFieldSource({ type: "csvColumn", column: "name" }, csvHeaders).ok).toBe(
      true,
    );
  });

  it("rejects csvColumn source when header does not exist", () => {
    expect(
      validateFieldSource({ type: "csvColumn", column: "missing" }, csvHeaders).ok,
    ).toBe(false);
  });

  it("validates staticText source", () => {
    expect(validateFieldSource({ type: "staticText", value: "VIP" }, csvHeaders).ok).toBe(
      true,
    );
  });

  it("rejects empty staticText source", () => {
    expect(validateFieldSource({ type: "staticText", value: " " }, csvHeaders).ok).toBe(
      false,
    );
  });

  it("rejects overlong staticText source", () => {
    expect(
      validateFieldSource(
        { type: "staticText", value: "x".repeat(CUSTOM_DESIGN_LIMITS.maxStaticTextLength + 1) },
        csvHeaders,
      ).ok,
    ).toBe(false);
  });

  it("validates a complete field box", () => {
    expect(validateCustomFieldBox(makeBox(), csvHeaders).ok).toBe(true);
  });

  it("rejects empty label", () => {
    expect(validateCustomFieldBox(makeBox({ label: " " }), csvHeaders).ok).toBe(false);
  });

  it("rejects overlong label", () => {
    expect(
      validateCustomFieldBox(
        makeBox({ label: "x".repeat(CUSTOM_DESIGN_LIMITS.maxFieldLabelLength + 1) }),
        csvHeaders,
      ).ok,
    ).toBe(false);
  });

  it("rejects invalid rect", () => {
    expect(
      validateCustomFieldBox(makeBox({ rect: { x: 0.95, y: 0, width: 0.1, height: 0.1 } }), csvHeaders)
        .ok,
    ).toBe(false);
  });

  it("rejects duplicate field box IDs", () => {
    const result = validateCustomFieldBoxes([makeBox(), makeBox()], csvHeaders);

    expect(result.ok).toBe(false);
  });

  it("rejects more than max field boxes", () => {
    const boxes = Array.from({ length: CUSTOM_DESIGN_LIMITS.maxFieldBoxes + 1 }, (_, index) =>
      makeBox({ id: `box-${index}` }),
    );

    expect(validateCustomFieldBoxes(boxes, csvHeaders).ok).toBe(false);
  });

  it("allows multiple boxes to use the same CSV column", () => {
    const boxes = [
      makeBox({ id: "box-1", label: "Name 1" }),
      makeBox({ id: "box-2", label: "Name 2" }),
    ];

    expect(validateCustomFieldBoxes(boxes, csvHeaders).ok).toBe(true);
  });

  it("allows static text boxes", () => {
    expect(
      validateCustomFieldBoxes(
        [makeBox({ source: { type: "staticText", value: "VIP" } })],
        csvHeaders,
      ).ok,
    ).toBe(true);
  });
});
