import { describe, expect, it } from "vitest";
import { createDefaultExportOptions } from "../../lib/batch-pdf/custom/export-options.ts";
import { describeExportReceipt } from "../../lib/batch-pdf/custom/export-receipt.ts";
import type { ExportOptions } from "../../lib/batch-pdf/custom/types.ts";

function makeOptions(overrides: Partial<ExportOptions> = {}): ExportOptions {
  return {
    ...createDefaultExportOptions(),
    itemSizeMode: "custom",
    customItemWidth: 11,
    customItemHeight: 8.5,
    unit: "in",
    ...overrides,
  };
}

describe("describeExportReceipt", () => {
  it("describes a combined PDF", () => {
    const receipt = describeExportReceipt({
      exportOptions: makeOptions({ outputMode: "combinedPdf" }),
      rowCount: 12,
      filename: "batch-pdf-custom-export.pdf",
      sheetLayoutInfo: null,
    });

    expect(receipt).toMatchObject({
      filename: "batch-pdf-custom-export.pdf",
      formatLabel: "PDF",
      contentsLabel: "One PDF with 12 pages",
    });
    expect(receipt.zipHint).toBeUndefined();
  });

  it("describes separate files in a ZIP", () => {
    const receipt = describeExportReceipt({
      exportOptions: makeOptions({ outputMode: "separateFiles" }),
      rowCount: 3,
      filename: "batch-pdf-custom-export.zip",
      sheetLayoutInfo: null,
    });

    expect(receipt.formatLabel).toBe("ZIP archive");
    expect(receipt.contentsLabel).toBe("3 separate PDFs in one ZIP");
    expect(receipt.zipHint).toBe("Open the ZIP to see the PDFs inside.");
  });

  it("includes the preflight report when bundled into a ZIP", () => {
    const receipt = describeExportReceipt({
      exportOptions: makeOptions({ outputMode: "combinedPdf", includeOverflowReport: true }),
      rowCount: 1,
      filename: "batch-pdf-custom-export.zip",
      sheetLayoutInfo: null,
    });

    expect(receipt.contentsLabel).toBe("One PDF with 1 page plus preflight-report.csv");
  });

  it("describes print sheets using the resolved sheet page count", () => {
    const receipt = describeExportReceipt({
      exportOptions: makeOptions({ layoutMode: "fitMultiplePerPage" }),
      rowCount: 25,
      filename: "custom-print-sheets.pdf",
      sheetLayoutInfo: { layout: { pageCount: 4 } },
    });

    expect(receipt.formatLabel).toBe("PDF");
    expect(receipt.contentsLabel).toBe("4 print-sheet pages with 25 items");
  });
});
