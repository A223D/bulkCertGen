import { describe, expect, it } from "vitest";
import {
  getRowsForFreeCustomExport,
  parseCustomExportPayload,
  validateCustomExportPayload,
  type CustomDesignExportPayload,
} from "../../lib/batch-pdf/custom/export-request.ts";
import { createDefaultExportOptions } from "../../lib/batch-pdf/custom/export-options.ts";
import { createDefaultTextBoxStyle } from "../../lib/batch-pdf/custom/field-boxes.ts";
import { BATCH_PDF_LIMITS } from "../../lib/batch-pdf/limits.ts";
import type { CustomFieldBox, DesignAsset, ExportOptions } from "../../lib/batch-pdf/custom/types.ts";
import type { CsvRow } from "../../lib/batch-pdf/types.ts";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeImageDesign(overrides: Partial<DesignAsset> = {}): DesignAsset {
  return {
    kind: "png",
    fileName: "design.png",
    sizeBytes: 80000,
    selectedPageIndex: 0,
    intrinsicWidth: 1000,
    intrinsicHeight: 1000,
    intrinsicUnit: "px",
    aspectRatio: 1,
    ...overrides,
  };
}

function makeBox(overrides: Partial<CustomFieldBox> = {}): CustomFieldBox {
  return {
    id: "box-1",
    label: "Name",
    source: { type: "csvColumn", column: "name" },
    rect: { x: 0.1, y: 0.1, width: 0.4, height: 0.1 },
    style: createDefaultTextBoxStyle(),
    required: false,
    ...overrides,
  };
}

function makeRow(overrides: CsvRow = {}): CsvRow {
  return { name: "Alice", ...overrides };
}

function makeValidPayload(
  overrides: Partial<CustomDesignExportPayload> = {},
): CustomDesignExportPayload {
  const exportOptions: ExportOptions = {
    ...createDefaultExportOptions(),
    itemSizeMode: "custom",
    customItemWidth: 11,
    customItemHeight: 8.5,
    unit: "in",
  };

  return {
    mode: "free",
    rows: [makeRow()],
    csvHeaders: ["name"],
    designAsset: makeImageDesign(),
    fieldBoxes: [makeBox()],
    exportOptions,
    ...overrides,
  };
}

function makeImagePayload(
  overrides: Partial<CustomDesignExportPayload> = {},
): CustomDesignExportPayload {
  const exportOptions: ExportOptions = {
    ...createDefaultExportOptions(),
    itemSizeMode: "custom",
    customItemWidth: 11,
    customItemHeight: 8.5,
    unit: "in",
  };
  return {
    mode: "free",
    rows: [makeRow()],
    csvHeaders: ["name"],
    designAsset: makeImageDesign(),
    fieldBoxes: [makeBox()],
    exportOptions,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parseCustomExportPayload
// ---------------------------------------------------------------------------

describe("parseCustomExportPayload", () => {
  it("accepts a valid free payload object", () => {
    const payload = makeValidPayload();
    const result = parseCustomExportPayload(payload);
    expect(result.ok).toBe(true);
  });

  it("rejects null", () => {
    const result = parseCustomExportPayload(null);
    expect(result.ok).toBe(false);
  });

  it("rejects a string", () => {
    const result = parseCustomExportPayload("not an object");
    expect(result.ok).toBe(false);
  });

  it("rejects an unsupported mode at parse stage", () => {
    const result = parseCustomExportPayload({ ...makeValidPayload(), mode: "paid" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe("custom_export_invalid_mode");
    }
  });

  it("rejects missing rows array", () => {
    const { rows: _rows, ...rest } = makeValidPayload();
    const result = parseCustomExportPayload(rest);
    expect(result.ok).toBe(false);
  });

  it("rejects missing fieldBoxes", () => {
    const { fieldBoxes: _fieldBoxes, ...rest } = makeValidPayload();
    const result = parseCustomExportPayload(rest);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateCustomExportPayload
// ---------------------------------------------------------------------------

describe("validateCustomExportPayload", () => {
  it("accepts a valid free image payload", () => {
    const result = validateCustomExportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
  });

  it("accepts a valid free image payload with custom item size", () => {
    const result = validateCustomExportPayload(makeImagePayload());
    expect(result.ok).toBe(true);
  });

  it("rejects an unsupported mode", () => {
    const payload = makeValidPayload();
    // Bypass TypeScript to simulate a bad runtime value.
    const result = validateCustomExportPayload({ ...payload, mode: "paid" as "free" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe("custom_export_invalid_mode");
      expect(result.errors[0].message).not.toContain("row");
    }
  });

  it("rejects empty rows", () => {
    const result = validateCustomExportPayload(makeValidPayload({ rows: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe("custom_export_no_rows");
    }
  });

  it("rejects empty field boxes", () => {
    const result = validateCustomExportPayload(makeValidPayload({ fieldBoxes: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe("custom_export_no_field_boxes");
    }
  });

  it("accepts fitMultiplePerPage when the layout fits at least one item", () => {
    const exportOptions: ExportOptions = {
      ...createDefaultExportOptions(),
      layoutMode: "fitMultiplePerPage",
      pageSize: "letter",
      itemSizeMode: "custom",
      customItemWidth: 2,
      customItemHeight: 1,
      unit: "in",
    };
    const result = validateCustomExportPayload(makeValidPayload({ exportOptions }));
    expect(result.ok).toBe(true);
  });

  it("rejects fitMultiplePerPage when no item fits on the page", () => {
    const exportOptions: ExportOptions = {
      ...createDefaultExportOptions(),
      layoutMode: "fitMultiplePerPage",
      pageSize: "letter",
      itemSizeMode: "custom",
      customItemWidth: 20,
      customItemHeight: 20,
      unit: "in",
    };
    const result = validateCustomExportPayload(makeValidPayload({ exportOptions }));
    expect(result.ok).toBe(false);
  });

  it("accepts cropMarks and includeOverflowReport toggles", () => {
    const exportOptions: ExportOptions = {
      ...makeValidPayload().exportOptions,
      cropMarks: true,
      includeOverflowReport: true,
    };
    const result = validateCustomExportPayload(makeValidPayload({ exportOptions }));
    expect(result.ok).toBe(true);
  });

  it("rejects image design without physical custom item size", () => {
    const result = validateCustomExportPayload(
      makeImagePayload({ exportOptions: createDefaultExportOptions() }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe("custom_export_needs_item_size");
    }
  });

  it("rejects invalid design asset", () => {
    const result = validateCustomExportPayload(
      makeValidPayload({
        designAsset: makeImageDesign({ intrinsicWidth: 0 }),
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a design asset that does not match filename", () => {
    const result = validateCustomExportPayload(
      makeValidPayload({
        designAsset: makeImageDesign({ kind: "jpeg", fileName: "design.png" }),
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects invalid field box (bad rect)", () => {
    const badBox = makeBox({ rect: { x: -1, y: 0.1, width: 0.4, height: 0.1 } });
    const result = validateCustomExportPayload(makeValidPayload({ fieldBoxes: [badBox] }));
    expect(result.ok).toBe(false);
  });

  it("rejects invalid export options (negative margins)", () => {
    const exportOptions: ExportOptions = {
      ...createDefaultExportOptions(),
      marginTop: -1,
    };
    const result = validateCustomExportPayload(makeValidPayload({ exportOptions }));
    expect(result.ok).toBe(false);
  });

  it("does not include raw row values in error messages", () => {
    const sensitiveValue = "SENSITIVE_DATA_12345";
    const result = validateCustomExportPayload(
      makeValidPayload({
        rows: [{ name: sensitiveValue }],
        fieldBoxes: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      for (const err of result.errors) {
        expect(err.message).not.toContain(sensitiveValue);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getRowsForFreeCustomExport
// ---------------------------------------------------------------------------

describe("getRowsForFreeCustomExport", () => {
  it("returns all rows when fewer than limit", () => {
    const rows = [makeRow(), makeRow()];
    expect(getRowsForFreeCustomExport(rows)).toHaveLength(2);
  });

  it("caps at freeExportRows", () => {
    const rows = Array.from(
      { length: BATCH_PDF_LIMITS.freeExportRows + 10 },
      (_, i) => ({ name: `Person ${i}` }),
    );
    const result = getRowsForFreeCustomExport(rows);
    expect(result).toHaveLength(BATCH_PDF_LIMITS.freeExportRows);
  });

  it("returns first N rows in order", () => {
    const rows = Array.from(
      { length: BATCH_PDF_LIMITS.freeExportRows + 5 },
      (_, i) => ({ name: `Row ${i}` }),
    );
    const result = getRowsForFreeCustomExport(rows);
    expect(result[0].name).toBe("Row 0");
    expect(result[result.length - 1].name).toBe(`Row ${BATCH_PDF_LIMITS.freeExportRows - 1}`);
  });
});
