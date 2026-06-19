import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  renderCustomDesignPdfForRow,
  renderCustomDesignPrintSheets,
} from "../../lib/batch-pdf/custom/compositor.ts";
import { createDefaultTextBoxStyle } from "../../lib/batch-pdf/custom/field-boxes.ts";
import { createDefaultExportOptions } from "../../lib/batch-pdf/custom/export-options.ts";
import type { CustomFieldBox, DesignAsset, ExportOptions } from "../../lib/batch-pdf/custom/types.ts";
import type { CsvRow } from "../../lib/batch-pdf/types.ts";

// ---------------------------------------------------------------------------
// Minimal image bytes for tests
// A 1×1 white pixel PNG, base64-encoded.
// ---------------------------------------------------------------------------

const PNG_1X1_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ" +
  "AABjkB6QAAAABJRU5ErkJggg==";

// A 1×1 JPEG, base64-encoded.
const JPEG_1X1_B64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDB" +
  "kSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAAL" +
  "CAABAAEBAREAAP/EABQAAQAAAAAAAAAAAAAAAAAAAAD/xAAUEAEAAAAAAAAAAAAAAAAA" +
  "AAAA/9oACAEBAAA/ACoAB//Z";

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeImageExportOptions(): ExportOptions {
  return {
    ...createDefaultExportOptions(),
    itemSizeMode: "custom",
    customItemWidth: 4,
    customItemHeight: 4,
    unit: "in",
  };
}

function makeStaticTextBox(overrides: Partial<CustomFieldBox> = {}): CustomFieldBox {
  return {
    id: "box-1",
    label: "Title",
    source: { type: "staticText", value: "Hello World" },
    rect: { x: 0.1, y: 0.1, width: 0.5, height: 0.2 },
    style: createDefaultTextBoxStyle(),
    required: false,
    ...overrides,
  };
}

function makeCsvBox(column: string, overrides: Partial<CustomFieldBox> = {}): CustomFieldBox {
  return {
    id: "box-csv",
    label: column,
    source: { type: "csvColumn", column },
    rect: { x: 0.1, y: 0.4, width: 0.5, height: 0.2 },
    style: createDefaultTextBoxStyle(),
    required: false,
    ...overrides,
  };
}

function makePngDesignAsset(overrides: Partial<DesignAsset> = {}): DesignAsset {
  return {
    kind: "png",
    fileName: "design.png",
    sizeBytes: 200,
    selectedPageIndex: 0,
    intrinsicWidth: 1,
    intrinsicHeight: 1,
    intrinsicUnit: "px",
    aspectRatio: 1,
    ...overrides,
  };
}

function makeJpegDesignAsset(overrides: Partial<DesignAsset> = {}): DesignAsset {
  return {
    kind: "jpeg",
    fileName: "design.jpg",
    sizeBytes: 200,
    selectedPageIndex: 0,
    intrinsicWidth: 1,
    intrinsicHeight: 1,
    intrinsicUnit: "px",
    aspectRatio: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("renderCustomDesignPdfForRow", () => {
  it("renders PNG design with one static text box to non-empty PDF bytes", async () => {
    const bytes = await renderCustomDesignPdfForRow({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      row: {},
      fieldBoxes: [makeStaticTextBox()],
      exportOptions: makeImageExportOptions(),
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("renders JPEG design with one static text box to non-empty PDF bytes", async () => {
    const bytes = await renderCustomDesignPdfForRow({
      designBytes: b64ToBytes(JPEG_1X1_B64),
      designAsset: makeJpegDesignAsset(),
      row: {},
      fieldBoxes: [makeStaticTextBox()],
      exportOptions: makeImageExportOptions(),
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("renders CSV-column text from row", async () => {
    const row: CsvRow = { name: "Alice Johnson" };

    const bytes = await renderCustomDesignPdfForRow({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      row,
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeImageExportOptions(),
    });

    // Should produce valid PDF bytes without throwing
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("shrinkToFit renders without throwing", async () => {
    const shrinkBox = makeStaticTextBox({
      source: { type: "staticText", value: "This is a very long text string that will not fit" },
      style: { ...createDefaultTextBoxStyle(), overflowMode: "shrinkToFit", fontSize: 36 },
    });

    await expect(
      renderCustomDesignPdfForRow({
        designBytes: b64ToBytes(PNG_1X1_B64),
        designAsset: makePngDesignAsset(),
        row: {},
        fieldBoxes: [shrinkBox],
        exportOptions: makeImageExportOptions(),
      }),
    ).resolves.toBeInstanceOf(Uint8Array);
  });

  it("wrap mode renders without throwing", async () => {
    const wrapBox = makeStaticTextBox({
      source: { type: "staticText", value: "Line one and more words here" },
      style: { ...createDefaultTextBoxStyle(), overflowMode: "wrap" },
    });

    await expect(
      renderCustomDesignPdfForRow({
        designBytes: b64ToBytes(PNG_1X1_B64),
        designAsset: makePngDesignAsset(),
        row: {},
        fieldBoxes: [wrapBox],
        exportOptions: makeImageExportOptions(),
      }),
    ).resolves.toBeInstanceOf(Uint8Array);
  });

  it("truncate mode renders without throwing", async () => {
    const truncateBox = makeStaticTextBox({
      source: { type: "staticText", value: "A very long text that exceeds the available box width easily" },
      style: { ...createDefaultTextBoxStyle(), overflowMode: "truncate", fontSize: 48 },
    });

    await expect(
      renderCustomDesignPdfForRow({
        designBytes: b64ToBytes(PNG_1X1_B64),
        designAsset: makePngDesignAsset(),
        row: {},
        fieldBoxes: [truncateBox],
        exportOptions: makeImageExportOptions(),
      }),
    ).resolves.toBeInstanceOf(Uint8Array);
  });

  it("missing optional value renders blank without throwing", async () => {
    await expect(
      renderCustomDesignPdfForRow({
        designBytes: b64ToBytes(PNG_1X1_B64),
        designAsset: makePngDesignAsset(),
        row: {},  // no 'name' key
        fieldBoxes: [makeCsvBox("name", { required: false })],
        exportOptions: makeImageExportOptions(),
      }),
    ).resolves.toBeInstanceOf(Uint8Array);
  });

  it("invalid design bytes throw an error safely", async () => {
    await expect(
      renderCustomDesignPdfForRow({
        designBytes: new Uint8Array([0x00, 0x01, 0x02]),
        designAsset: makePngDesignAsset(),
        row: {},
        fieldBoxes: [makeStaticTextBox()],
        exportOptions: makeImageExportOptions(),
      }),
    ).rejects.toThrow();
  });

  it("generated PDF bytes can be loaded by pdf-lib", async () => {
    const outputBytes = await renderCustomDesignPdfForRow({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      row: {},
      fieldBoxes: [makeStaticTextBox()],
      exportOptions: makeImageExportOptions(),
    });

    // Verify the output is a valid PDF that pdf-lib can parse.
    await expect(PDFDocument.load(outputBytes)).resolves.toBeTruthy();
  });

  it("renders multiple field boxes on the same page without throwing", async () => {
    await expect(
      renderCustomDesignPdfForRow({
        designBytes: b64ToBytes(PNG_1X1_B64),
        designAsset: makePngDesignAsset(),
        row: { name: "Alice", title: "Engineer" },
        fieldBoxes: [
          makeCsvBox("name", { id: "b1", rect: { x: 0.1, y: 0.1, width: 0.5, height: 0.1 } }),
          makeCsvBox("title", { id: "b2", rect: { x: 0.1, y: 0.3, width: 0.5, height: 0.1 } }),
          makeStaticTextBox({ id: "b3", rect: { x: 0.1, y: 0.5, width: 0.5, height: 0.1 } }),
        ],
        exportOptions: makeImageExportOptions(),
      }),
    ).resolves.toBeInstanceOf(Uint8Array);
  });
});

// ---------------------------------------------------------------------------
// Print-sheet rendering
// ---------------------------------------------------------------------------

function makeSheetOptions(overrides: Partial<ExportOptions> = {}): ExportOptions {
  return {
    ...createDefaultExportOptions(),
    layoutMode: "fitMultiplePerPage",
    pageSize: "letter",
    itemSizeMode: "custom",
    customItemWidth: 2,
    customItemHeight: 1,
    unit: "in",
    ...overrides,
  };
}

describe("renderCustomDesignPrintSheets", () => {
  it("renders multiple image-design items on a single sheet page", async () => {
    const bytes = await renderCustomDesignPrintSheets({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      rows: [{ name: "Alice" }, { name: "Bob" }, { name: "Carol" }],
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeSheetOptions(),
    });

    expect(bytes.length).toBeGreaterThan(0);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("spreads items across multiple sheet pages when needed", async () => {
    // Item 5x4in on Letter with default margins/gaps → 2 items per page.
    const bytes = await renderCustomDesignPrintSheets({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      rows: [{ name: "A" }, { name: "B" }, { name: "C" }],
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeSheetOptions({ customItemWidth: 5, customItemHeight: 4 }),
    });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it("renders an image design print sheet without throwing", async () => {
    const bytes = await renderCustomDesignPrintSheets({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      rows: [{ name: "Alice" }, { name: "Bob" }],
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeSheetOptions(),
    });

    expect(bytes.length).toBeGreaterThan(0);
    await expect(PDFDocument.load(bytes)).resolves.toBeTruthy();
  });

  it("renders crop marks without breaking the sheet PDF", async () => {
    const bytes = await renderCustomDesignPrintSheets({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      rows: [{ name: "Alice" }, { name: "Bob" }],
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeSheetOptions({ cropMarks: true }),
    });

    await expect(PDFDocument.load(bytes)).resolves.toBeTruthy();
  });
});
