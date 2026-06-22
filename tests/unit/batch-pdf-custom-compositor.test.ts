import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  createSeparateFileRenderer,
  renderCustomDesignCombinedPdf,
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

function pdfBytesToLatin1(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("latin1");
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

  it("uses classic objects and an xref table for broad viewer compatibility", async () => {
    const outputBytes = await renderCustomDesignPdfForRow({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      row: {},
      fieldBoxes: [makeStaticTextBox()],
      exportOptions: makeImageExportOptions(),
    });

    const pdf = pdfBytesToLatin1(outputBytes);
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("\nxref\n");
    expect(pdf).not.toContain("/Type /ObjStm");
    expect(pdf).not.toContain("/Type /XRef");
    expect(pdf).toContain("/Interpolate true");
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

  it("saves print sheets with classic objects for broad viewer compatibility", async () => {
    const bytes = await renderCustomDesignPrintSheets({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      rows: [{ name: "Alice" }, { name: "Bob" }],
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeSheetOptions(),
    });

    const pdf = pdfBytesToLatin1(bytes);
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("\nxref\n");
    expect(pdf).not.toContain("/Type /ObjStm");
    expect(pdf).not.toContain("/Type /XRef");
    expect(pdf).toContain("/Interpolate true");
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

// ---------------------------------------------------------------------------
// Separate-files renderer (prebuilt background)
// ---------------------------------------------------------------------------

describe("createSeparateFileRenderer", () => {
  it("produces one valid single-page PDF per row", async () => {
    const renderer = await createSeparateFileRenderer({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeImageExportOptions(),
    });

    const first = await renderer.renderRow({ name: "Alice" });
    const second = await renderer.renderRow({ name: "Bob" });

    const firstDoc = await PDFDocument.load(first);
    const secondDoc = await PDFDocument.load(second);
    expect(firstDoc.getPageCount()).toBe(1);
    expect(secondDoc.getPageCount()).toBe(1);
    expect(first.length).toBeGreaterThan(0);
  });

  it("embeds the background image only once across all rows", async () => {
    const embedSpy = vi.spyOn(PDFDocument.prototype, "embedPng");
    try {
      const renderer = await createSeparateFileRenderer({
        designBytes: b64ToBytes(PNG_1X1_B64),
        designAsset: makePngDesignAsset(),
        fieldBoxes: [makeCsvBox("name")],
        exportOptions: makeImageExportOptions(),
      });

      await renderer.renderRow({ name: "Alice" });
      await renderer.renderRow({ name: "Bob" });
      await renderer.renderRow({ name: "Carol" });

      // Once for the base document; cloning via copyPages re-uses the object.
      expect(embedSpy).toHaveBeenCalledTimes(1);
    } finally {
      embedSpy.mockRestore();
    }
  });

  it("keeps the background image in each per-row PDF", async () => {
    const renderer = await createSeparateFileRenderer({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeImageExportOptions(),
    });

    const bytes = await renderer.renderRow({ name: "Alice" });
    const pdf = pdfBytesToLatin1(bytes);
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    // The copied page carries the background image XObject.
    expect(pdf).toContain("/Subtype /Image");
  });
});

// ---------------------------------------------------------------------------
// Combined multi-page PDF
// ---------------------------------------------------------------------------

describe("renderCustomDesignCombinedPdf", () => {
  it("produces one page per row in a single document", async () => {
    const bytes = await renderCustomDesignCombinedPdf({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      rows: [{ name: "Alice" }, { name: "Bob" }, { name: "Carol" }],
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeImageExportOptions(),
    });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(3);
  });

  it("embeds the background image only once for the whole batch", async () => {
    const embedSpy = vi.spyOn(PDFDocument.prototype, "embedPng");
    try {
      await renderCustomDesignCombinedPdf({
        designBytes: b64ToBytes(PNG_1X1_B64),
        designAsset: makePngDesignAsset(),
        rows: [{ name: "Alice" }, { name: "Bob" }, { name: "Carol" }, { name: "Dan" }],
        fieldBoxes: [makeCsvBox("name")],
        exportOptions: makeImageExportOptions(),
      });
      expect(embedSpy).toHaveBeenCalledTimes(1);
    } finally {
      embedSpy.mockRestore();
    }
  });

  it("always produces at least one page even with no rows", async () => {
    const bytes = await renderCustomDesignCombinedPdf({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      rows: [],
      fieldBoxes: [makeStaticTextBox()],
      exportOptions: makeImageExportOptions(),
    });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("saves with classic objects for broad viewer compatibility", async () => {
    const bytes = await renderCustomDesignCombinedPdf({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      rows: [{ name: "Alice" }, { name: "Bob" }],
      fieldBoxes: [makeCsvBox("name")],
      exportOptions: makeImageExportOptions(),
    });

    const pdf = pdfBytesToLatin1(bytes);
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("\nxref\n");
    expect(pdf).not.toContain("/Type /ObjStm");
    expect(pdf).toContain("/Interpolate true");
  });
});

const FIXTURE_FONT = new Uint8Array(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/sample-font.ttf"),
  ),
);

describe("compositor renders Google-font text", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("embeds a Google font when rendering a row PDF", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(FIXTURE_FONT, { status: 200 })),
    );
    const box = makeStaticTextBox({
      style: { ...createDefaultTextBoxStyle(), fontFamily: "Playfair Display", fontWeight: "bold" },
    });
    const bytes = await renderCustomDesignPdfForRow({
      designBytes: b64ToBytes(PNG_1X1_B64),
      designAsset: makePngDesignAsset(),
      row: {} as CsvRow,
      fieldBoxes: [box],
      exportOptions: makeImageExportOptions(),
    });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
