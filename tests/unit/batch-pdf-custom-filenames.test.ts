import { describe, expect, it } from "vitest";
import { makeSafeCustomPdfFilename } from "../../lib/batch-pdf/custom/custom-filenames.ts";
import { createDefaultExportOptions } from "../../lib/batch-pdf/custom/export-options.ts";
import type { ExportOptions } from "../../lib/batch-pdf/custom/types.ts";

function defaultOptions(): ExportOptions {
  return createDefaultExportOptions();
}

describe("makeSafeCustomPdfFilename", () => {
  it("uses filenameColumn when configured", () => {
    const options: ExportOptions = {
      ...defaultOptions(),
      filenameColumn: "title",
    };
    const filename = makeSafeCustomPdfFilename({
      index: 1,
      row: { title: "My Certificate", name: "Alice" },
      exportOptions: options,
    });
    expect(filename).toContain("my-certificate");
    expect(filename.endsWith(".pdf")).toBe(true);
  });

  it("falls back to name column when filenameColumn is not set", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 1,
      row: { name: "Bob Smith" },
      exportOptions: defaultOptions(),
    });
    expect(filename).toContain("bob-smith");
    expect(filename.endsWith(".pdf")).toBe(true);
  });

  it("falls back to full name column", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 2,
      row: { "full name": "Jane Doe" },
      exportOptions: defaultOptions(),
    });
    expect(filename).toContain("jane-doe");
  });

  it("falls back to email column", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 3,
      row: { email: "alice@example.com" },
      exportOptions: defaultOptions(),
    });
    expect(filename).toContain("alice-example-com");
  });

  it("falls back to custom-document when no usable column exists", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 1,
      row: { foo: "bar" },
      exportOptions: defaultOptions(),
    });
    expect(filename).toContain("custom-document");
    expect(filename.endsWith(".pdf")).toBe(true);
  });

  it("removes unsafe characters from name", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 1,
      row: { name: 'Jane / Smith <Admin>' },
      exportOptions: defaultOptions(),
    });
    expect(filename).not.toContain("/");
    expect(filename).not.toContain("<");
    expect(filename.endsWith(".pdf")).toBe(true);
  });

  it("truncates very long values safely", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 1,
      row: { name: "a".repeat(300) },
      exportOptions: defaultOptions(),
    });
    const base = filename.replace(/\.pdf$/, "");
    expect(base.length).toBeLessThanOrEqual(80);
    expect(filename.endsWith(".pdf")).toBe(true);
  });

  it("missing value does not throw", () => {
    expect(() =>
      makeSafeCustomPdfFilename({
        index: 1,
        row: {},
        exportOptions: defaultOptions(),
      }),
    ).not.toThrow();
  });

  it("always ends in .pdf", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 1,
      row: { name: "Test" },
      exportOptions: defaultOptions(),
    });
    expect(filename.endsWith(".pdf")).toBe(true);
  });

  it("index is 1-based and zero-padded to 3 digits", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 1,
      row: { name: "Alice" },
      exportOptions: defaultOptions(),
    });
    expect(filename.startsWith("001-")).toBe(true);
  });

  it("index 10 is padded correctly", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 10,
      row: { name: "Alice" },
      exportOptions: defaultOptions(),
    });
    expect(filename.startsWith("010-")).toBe(true);
  });

  it("collapses repeated hyphens", () => {
    const filename = makeSafeCustomPdfFilename({
      index: 1,
      row: { name: "Jane --- Smith" },
      exportOptions: defaultOptions(),
    });
    expect(filename).not.toMatch(/--/);
  });

  it("handles empty filenameColumn value by falling back", () => {
    const options: ExportOptions = {
      ...defaultOptions(),
      filenameColumn: "title",
    };
    const filename = makeSafeCustomPdfFilename({
      index: 2,
      row: { title: "", name: "Alice" },
      exportOptions: options,
    });
    // Should fall through to 'name' column
    expect(filename).toContain("alice");
  });
});
