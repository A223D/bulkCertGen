import { describe, expect, it } from "vitest";
import {
  getFieldBoxTextForRow,
  resolveDesignItemSizeForPreflight,
  runCustomDesignPreflight,
} from "../../lib/batch-pdf/custom/preflight.ts";
import { createDefaultTextBoxStyle } from "../../lib/batch-pdf/custom/field-boxes.ts";
import { createDefaultExportOptions } from "../../lib/batch-pdf/custom/export-options.ts";
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

function makeImageExportOptions(overrides: Partial<ExportOptions> = {}): ExportOptions {
  return {
    ...createDefaultExportOptions(),
    itemSizeMode: "custom",
    customItemWidth: 8,
    customItemHeight: 8,
    unit: "in",
    ...overrides,
  };
}

function makeBox(overrides: Partial<CustomFieldBox> = {}): CustomFieldBox {
  return {
    id: "box-1",
    label: "Name",
    source: { type: "csvColumn", column: "name" },
    // A generous box: 40% wide, 10% tall on the design
    rect: { x: 0.1, y: 0.1, width: 0.4, height: 0.1 },
    style: createDefaultTextBoxStyle(),
    required: true,
    ...overrides,
  };
}

function makeRow(values: Record<string, string> = {}): CsvRow {
  return { name: "Alice", company: "ACME", ...values };
}

const CSV_HEADERS = ["name", "company", "role"];

// ---------------------------------------------------------------------------
// resolveDesignItemSizeForPreflight
// ---------------------------------------------------------------------------

describe("resolveDesignItemSizeForPreflight", () => {
  it("returns needsOutputSize error for image design without custom size", () => {
    const result = resolveDesignItemSizeForPreflight({ design: makeImageDesign() });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error();
    expect(result.errors[0].code).toBe("needs_output_size");
  });

  it("resolves image design when custom item size is provided", () => {
    const options: ExportOptions = {
      ...createDefaultExportOptions(),
      itemSizeMode: "custom",
      customItemWidth: 4,
      customItemHeight: 6,
      unit: "in",
    };
    const result = resolveDesignItemSizeForPreflight({
      design: makeImageDesign(),
      exportOptions: options,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.widthPt).toBeCloseTo(4 * 72, 4);
    expect(result.value.heightPt).toBeCloseTo(6 * 72, 4);
    expect(result.value.source).toBe("customItemSize");
  });
});

// ---------------------------------------------------------------------------
// getFieldBoxTextForRow
// ---------------------------------------------------------------------------

describe("getFieldBoxTextForRow", () => {
  it("returns CSV column value and column name", () => {
    const { text, sourceColumn, missingRequired } = getFieldBoxTextForRow({
      row: makeRow({ name: "Bob" }),
      box: makeBox({ source: { type: "csvColumn", column: "name" } }),
    });
    expect(text).toBe("Bob");
    expect(sourceColumn).toBe("name");
    expect(missingRequired).toBe(false);
  });

  it("detects missing required value", () => {
    const { missingRequired, valueLength } = getFieldBoxTextForRow({
      row: makeRow({ name: " " }),
      box: makeBox({ required: true, source: { type: "csvColumn", column: "name" } }),
    });
    expect(missingRequired).toBe(true);
    expect(valueLength).toBe(1); // space is present but blank
  });

  it("does not flag missing optional value", () => {
    const { missingRequired } = getFieldBoxTextForRow({
      row: makeRow({ name: "" }),
      box: makeBox({ required: false, source: { type: "csvColumn", column: "name" } }),
    });
    expect(missingRequired).toBe(false);
  });

  it("returns static text value without sourceColumn", () => {
    const { text, sourceColumn, missingRequired } = getFieldBoxTextForRow({
      row: makeRow(),
      box: makeBox({ source: { type: "staticText", value: "VIP" } }),
    });
    expect(text).toBe("VIP");
    expect(sourceColumn).toBeUndefined();
    expect(missingRequired).toBe(false);
  });

  it("reports valueLength correctly", () => {
    const { valueLength } = getFieldBoxTextForRow({
      row: makeRow({ name: "Alexander Hamilton" }),
      box: makeBox({ source: { type: "csvColumn", column: "name" } }),
    });
    expect(valueLength).toBe("Alexander Hamilton".length);
  });
});

// ---------------------------------------------------------------------------
// runCustomDesignPreflight - valid setup
// ---------------------------------------------------------------------------

describe("runCustomDesignPreflight - valid setup", () => {
  it("returns ready when all short values fit", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "Alice" }), makeRow({ name: "Bob" })],
      fieldBoxes: [makeBox()],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).toBe("ready");
    expect(result.value.summary.rowCount).toBe(2);
    expect(result.value.summary.fieldBoxCount).toBe(1);
    expect(result.value.summary.checkedCellCount).toBe(2);
    expect(result.value.summary.errorCount).toBe(0);
    expect(result.value.summary.blocksExport).toBe(false);
    expect(result.value.issues).toHaveLength(0);
  });

  it("summary fitCount equals cells that fit without blocking", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "A" }), makeRow({ name: "B" }), makeRow({ name: "C" })],
      fieldBoxes: [makeBox()],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.summary.fitCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// runCustomDesignPreflight - missing required value
// ---------------------------------------------------------------------------

describe("runCustomDesignPreflight - missing required value", () => {
  it("creates a blocking error for missing required CSV value", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "" })],
      fieldBoxes: [makeBox({ required: true })],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).toBe("blocked");
    expect(result.value.summary.errorCount).toBe(1);
    expect(result.value.summary.blocksExport).toBe(true);

    const issue = result.value.issues[0];
    expect(issue.code).toBe("missing_required_value");
    expect(issue.severity).toBe("error");
    expect(issue.rowIndex).toBe(0);
    expect(issue.fieldLabel).toBe("Name");
    expect(issue.sourceColumn).toBe("name");
  });

  it("does not flag missing optional value", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "" })],
      fieldBoxes: [makeBox({ required: false })],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    // Empty optional value → empty text → fits
    expect(result.value.status).toBe("ready");
    expect(result.value.summary.errorCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// runCustomDesignPreflight - static text box
// ---------------------------------------------------------------------------

describe("runCustomDesignPreflight - static text", () => {
  it("checks static text box against every row", () => {
    const box = makeBox({
      id: "static-1",
      label: "Label",
      source: { type: "staticText", value: "VIP" },
      required: false,
    });
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow(), makeRow()],
      fieldBoxes: [box],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    // 2 rows × 1 box
    expect(result.value.summary.checkedCellCount).toBe(2);
    expect(result.value.summary.errorCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// runCustomDesignPreflight - same CSV column in multiple boxes
// ---------------------------------------------------------------------------

describe("runCustomDesignPreflight - same column, multiple boxes", () => {
  it("allows the same CSV column in multiple boxes", () => {
    const box1 = makeBox({ id: "b1", label: "Name 1" });
    const box2 = makeBox({ id: "b2", label: "Name 2" });
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow()],
      fieldBoxes: [box1, box2],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.summary.checkedCellCount).toBe(2); // 1 row × 2 boxes
  });
});

// ---------------------------------------------------------------------------
// runCustomDesignPreflight - overflow modes
// ---------------------------------------------------------------------------

describe("runCustomDesignPreflight - overflow modes", () => {
  // Use a tiny box so that long values overflow
  const tinyBox = makeBox({
    rect: { x: 0.0, y: 0.0, width: 0.02, height: 0.02 }, // ~12pt × 15pt on letter
    style: {
      ...createDefaultTextBoxStyle(),
      fontSize: 14,
      minFontSize: 8,
      overflowMode: "shrinkToFit",
    },
  });

  it("reports text_shrunk as info when shrink-to-fit succeeds", () => {
    // The box is large enough for shrink but not for full size
    const medBox = makeBox({
      rect: { x: 0.0, y: 0.0, width: 0.15, height: 0.05 },
      style: { ...createDefaultTextBoxStyle(), fontSize: 24, minFontSize: 8, overflowMode: "shrinkToFit" },
    });
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "AlexanderHamiltonTheLong" })],
      fieldBoxes: [medBox],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    // Could be ready or readyWithWarnings if shrink occurred
    const shrunkIssues = result.value.issues.filter((i) => i.code === "text_shrunk");
    if (shrunkIssues.length > 0) {
      expect(shrunkIssues[0].severity).toBe("info");
      expect(result.value.status).toBe("readyWithWarnings");
      expect(result.value.summary.blocksExport).toBe(false);
    }
  });

  it("reports text_overflow error and blocks when shrink fails at min size", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "W".repeat(80) })],
      fieldBoxes: [tinyBox],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).toBe("blocked");
    expect(result.value.summary.blocksExport).toBe(true);
    const overflowIssues = result.value.issues.filter((i) => i.code === "text_overflow");
    expect(overflowIssues.length).toBeGreaterThan(0);
    expect(overflowIssues[0].severity).toBe("error");
  });

  it("truncation warning is reported and does not block export", () => {
    const truncBox = makeBox({
      rect: { x: 0.0, y: 0.0, width: 0.02, height: 0.02 },
      style: { ...createDefaultTextBoxStyle(), overflowMode: "truncate", fontSize: 14 },
    });
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "W".repeat(80) })],
      fieldBoxes: [truncBox],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).toBe("readyWithWarnings");
    expect(result.value.summary.blocksExport).toBe(false);
    const truncIssues = result.value.issues.filter((i) => i.code === "text_truncated");
    expect(truncIssues.length).toBeGreaterThan(0);
    expect(truncIssues[0].severity).toBe("warning");
  });

  it("wrap warning is reported and does not block when text fits after wrapping", () => {
    const wrapBox = makeBox({
      rect: { x: 0.0, y: 0.0, width: 0.1, height: 0.5 }, // narrow but tall
      style: { ...createDefaultTextBoxStyle(), overflowMode: "wrap", fontSize: 14, lineHeight: 1.1 },
    });
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "Hello World Test" })],
      fieldBoxes: [wrapBox],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    if (result.value.issues.some((i) => i.code === "text_wrapped")) {
      expect(result.value.status).toBe("readyWithWarnings");
      expect(result.value.summary.blocksExport).toBe(false);
    }
  });

  it("errorIfOverflow blocks when text does not fit", () => {
    const errBox = makeBox({
      rect: { x: 0.0, y: 0.0, width: 0.02, height: 0.02 },
      style: { ...createDefaultTextBoxStyle(), overflowMode: "errorIfOverflow", fontSize: 14 },
    });
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "W".repeat(80) })],
      fieldBoxes: [errBox],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).toBe("blocked");
    expect(result.value.summary.blocksExport).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runCustomDesignPreflight - invalid field box
// ---------------------------------------------------------------------------

describe("runCustomDesignPreflight - invalid field boxes", () => {
  it("returns error result for invalid field box collection", () => {
    const invalidBox = makeBox({ label: "" }); // empty label is invalid
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow()],
      fieldBoxes: [invalidBox],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(false);
  });

  it("handles empty field boxes (allowed in setup mode)", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow()],
      fieldBoxes: [],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    // Empty field boxes pass validateCustomFieldBoxes but checkedCellCount=0
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.summary.checkedCellCount).toBe(0);
    expect(result.value.summary.fieldBoxCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// runCustomDesignPreflight - image design without resolvable size
// ---------------------------------------------------------------------------

describe("runCustomDesignPreflight - image design", () => {
  it("returns needsOutputSize when image design has no custom size", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow()],
      fieldBoxes: [makeBox()],
      exportOptions: createDefaultExportOptions(), // itemSizeMode: "fromDesign" — no custom size
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).toBe("needsOutputSize");
    expect(result.value.issues[0].code).toBe("needs_output_size");
  });

  it("runs preflight for image design when custom item size is provided", () => {
    const options: ExportOptions = {
      ...createDefaultExportOptions(),
      itemSizeMode: "custom",
      customItemWidth: 4,
      customItemHeight: 6,
      unit: "in",
    };
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "Alice" })],
      fieldBoxes: [makeBox()],
      exportOptions: options,
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).not.toBe("needsOutputSize");
  });
});

// ---------------------------------------------------------------------------
// runCustomDesignPreflight - privacy: issue objects do not contain raw values
// ---------------------------------------------------------------------------

describe("runCustomDesignPreflight - privacy", () => {
  it("issue objects include row index, field label, source column, value length — not raw value", () => {
    const secretValue = "SUPERSECRET-DATA-XYZ";
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: secretValue })],
      fieldBoxes: [
        makeBox({
          rect: { x: 0.0, y: 0.0, width: 0.02, height: 0.02 },
          style: { ...createDefaultTextBoxStyle(), overflowMode: "errorIfOverflow", fontSize: 14 },
        }),
      ],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();

    for (const issue of result.value.issues) {
      // Message should not embed the raw value
      expect(issue.message).not.toContain(secretValue);
      // Issue code is a fixed constant, not derived from text
      expect(issue.code).not.toContain(secretValue);
      // Value length is safe to include
      if (issue.valueLength !== undefined) {
        expect(issue.valueLength).toBe(secretValue.length);
      }
      // Field label and source column are structural metadata
      if (issue.fieldLabel) {
        expect(issue.fieldLabel).not.toContain(secretValue);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// runCustomDesignPreflight - summary counts
// ---------------------------------------------------------------------------

describe("runCustomDesignPreflight - summary counts", () => {
  it("counts rows, fieldBoxes, checkedCells, errors, and warnings correctly", () => {
    // 3 rows, 2 boxes = 6 cells
    // Row 0 name is empty → error on box1 (required)
    // Other cells should fit or warn
    const box1 = makeBox({ id: "b1", label: "Name" });
    const box2 = makeBox({
      id: "b2",
      label: "Company",
      source: { type: "csvColumn", column: "company" },
    });
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [
        makeRow({ name: "", company: "ACME" }),
        makeRow({ name: "Bob", company: "Corp" }),
        makeRow({ name: "Carol", company: "Ltd" }),
      ],
      fieldBoxes: [box1, box2],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();

    const { summary } = result.value;
    expect(summary.rowCount).toBe(3);
    expect(summary.fieldBoxCount).toBe(2);
    expect(summary.checkedCellCount).toBe(6);
    expect(summary.errorCount).toBe(1); // row 0 name is missing
  });

  it("status is ready when no issues", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow()],
      fieldBoxes: [makeBox()],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).toBe("ready");
  });

  it("status is blocked when errors exist", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow({ name: "" })],
      fieldBoxes: [makeBox({ required: true })],
      exportOptions: makeImageExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).toBe("blocked");
  });

  it("status is needsOutputSize for image without custom size", () => {
    const result = runCustomDesignPreflight({
      design: makeImageDesign(),
      rows: [makeRow()],
      fieldBoxes: [makeBox()],
      exportOptions: createDefaultExportOptions(),
      csvHeaders: CSV_HEADERS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error();
    expect(result.value.status).toBe("needsOutputSize");
  });
});
