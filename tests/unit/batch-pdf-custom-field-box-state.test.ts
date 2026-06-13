import { describe, expect, it } from "vitest";
import { CUSTOM_DESIGN_LIMITS } from "../../lib/batch-pdf/limits.ts";
import {
  createDefaultTextBoxStyle,
  validateCustomFieldBox,
} from "../../lib/batch-pdf/custom/field-boxes.ts";
import {
  addFieldBox,
  createDefaultCsvFieldBox,
  createDefaultStaticTextBox,
  duplicateFieldBox,
  getFieldBoxById,
  isCustomFieldPlacementReady,
  removeFieldBox,
  updateFieldBox,
} from "../../lib/batch-pdf/custom/field-box-state.ts";
import type { CustomFieldBox } from "../../lib/batch-pdf/custom/types.ts";

const csvHeaders = ["name", "company", "role"];

function makeBox(overrides: Partial<CustomFieldBox> = {}): CustomFieldBox {
  return {
    id: "field-box-1",
    label: "Name",
    source: { type: "csvColumn", column: "name" },
    rect: { x: 0.35, y: 0.42, width: 0.3, height: 0.08 },
    style: createDefaultTextBoxStyle(),
    required: true,
    ...overrides,
  };
}

describe("custom design field box state", () => {
  it("creates a default CSV field box with valid style and rect", () => {
    const box = createDefaultCsvFieldBox({
      column: "company_name",
      existingBoxes: [],
    });

    expect(box.label).toBe("Company Name");
    expect(box.source).toEqual({ type: "csvColumn", column: "company_name" });
    expect(validateCustomFieldBox(box, ["company_name"]).ok).toBe(true);
  });

  it("creates a default static text box with valid style and rect", () => {
    const box = createDefaultStaticTextBox({
      value: "VIP",
      existingBoxes: [],
    });

    expect(box.label).toBe("Static text");
    expect(box.source).toEqual({ type: "staticText", value: "VIP" });
    expect(validateCustomFieldBox(box, csvHeaders).ok).toBe(true);
  });

  it("generates unique IDs", () => {
    const first = createDefaultCsvFieldBox({ column: "name", existingBoxes: [] });
    const second = createDefaultCsvFieldBox({
      column: "name",
      existingBoxes: [first],
    });

    expect(first.id).not.toBe(second.id);
  });

  it("adds a valid field box", () => {
    const box = makeBox();
    const result = addFieldBox({ boxes: [], box, csvHeaders });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([box]);
    }
  });

  it("fails when adding an invalid CSV source", () => {
    const result = addFieldBox({
      boxes: [],
      box: makeBox({ source: { type: "csvColumn", column: "missing" } }),
      csvHeaders,
    });

    expect(result.ok).toBe(false);
  });

  it("fails when adding more than the max field boxes", () => {
    const boxes = Array.from({ length: CUSTOM_DESIGN_LIMITS.maxFieldBoxes }, (_, index) =>
      makeBox({ id: `field-box-${index + 1}` }),
    );
    const result = addFieldBox({
      boxes,
      box: makeBox({ id: "field-box-extra" }),
      csvHeaders,
    });

    expect(result.ok).toBe(false);
  });

  it("updates a field box source", () => {
    const result = updateFieldBox({
      boxes: [makeBox()],
      boxId: "field-box-1",
      patch: { source: { type: "csvColumn", column: "company" } },
      csvHeaders,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].source).toEqual({ type: "csvColumn", column: "company" });
    }
  });

  it("updates a field box style", () => {
    const result = updateFieldBox({
      boxes: [makeBox()],
      boxId: "field-box-1",
      patch: { style: { ...createDefaultTextBoxStyle(), fontWeight: "bold" } },
      csvHeaders,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].style.fontWeight).toBe("bold");
    }
  });

  it("fails when updating to invalid style", () => {
    const result = updateFieldBox({
      boxes: [makeBox()],
      boxId: "field-box-1",
      patch: { style: { ...createDefaultTextBoxStyle(), color: "red" } },
      csvHeaders,
    });

    expect(result.ok).toBe(false);
  });

  it("updates a field box rect", () => {
    const nextRect = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
    const result = updateFieldBox({
      boxes: [makeBox()],
      boxId: "field-box-1",
      patch: { rect: nextRect },
      csvHeaders,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].rect).toEqual(nextRect);
    }
  });

  it("fails when updating to invalid rect", () => {
    const result = updateFieldBox({
      boxes: [makeBox()],
      boxId: "field-box-1",
      patch: { rect: { x: 0.9, y: 0, width: 0.2, height: 0.2 } },
      csvHeaders,
    });

    expect(result.ok).toBe(false);
  });

  it("removes a field box", () => {
    expect(
      removeFieldBox({
        boxes: [makeBox(), makeBox({ id: "field-box-2" })],
        boxId: "field-box-1",
      }),
    ).toEqual([makeBox({ id: "field-box-2" })]);
  });

  it("duplicates a field box with a new ID and offset rect", () => {
    const result = duplicateFieldBox({
      boxes: [makeBox()],
      boxId: "field-box-1",
      csvHeaders,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[1].id).not.toBe("field-box-1");
      expect(result.value[1].rect.x).toBeGreaterThan(result.value[0].rect.x);
      expect(validateCustomFieldBox(result.value[1], csvHeaders).ok).toBe(true);
    }
  });

  it("gets a field box by ID or returns null", () => {
    const box = makeBox();

    expect(getFieldBoxById([box], "field-box-1")).toEqual(box);
    expect(getFieldBoxById([box], "missing")).toBeNull();
    expect(getFieldBoxById([box], null)).toBeNull();
  });

  it("requires at least one valid box for placement readiness", () => {
    expect(isCustomFieldPlacementReady({ boxes: [], csvHeaders })).toBe(false);
    expect(isCustomFieldPlacementReady({ boxes: [makeBox()], csvHeaders })).toBe(true);
    expect(
      isCustomFieldPlacementReady({
        boxes: [makeBox({ source: { type: "csvColumn", column: "missing" } })],
        csvHeaders,
      }),
    ).toBe(false);
  });

  it("allows multiple boxes to use the same CSV column", () => {
    const result = addFieldBox({
      boxes: [makeBox()],
      box: makeBox({ id: "field-box-2", label: "Name duplicate" }),
      csvHeaders,
    });

    expect(result.ok).toBe(true);
  });

  it("allows static text boxes", () => {
    const result = addFieldBox({
      boxes: [],
      box: makeBox({
        source: { type: "staticText", value: "VIP" },
        required: false,
      }),
      csvHeaders,
    });

    expect(result.ok).toBe(true);
  });
});
