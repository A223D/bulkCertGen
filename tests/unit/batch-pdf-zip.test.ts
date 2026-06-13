import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { createPdfZip } from "../../lib/batch-pdf/zip.ts";

describe("PDF ZIP utility", () => {
  it("rejects empty file list", async () => {
    await expect(createPdfZip([])).rejects.toThrow(/at least one PDF/);
  });

  it("creates a ZIP with expected PDF files", async () => {
    const zipBytes = await createPdfZip([
      { filename: "001-test.pdf", bytes: new Uint8Array([1, 2, 3]) },
      { filename: "002-test.pdf", bytes: new Uint8Array([4, 5, 6]) },
    ]);
    const zip = await JSZip.loadAsync(zipBytes);
    const filenames = Object.keys(zip.files);

    expect(filenames).toEqual(["001-test.pdf", "002-test.pdf"]);
    expect(filenames.every((filename) => filename.endsWith(".pdf"))).toBe(true);
  });
});
