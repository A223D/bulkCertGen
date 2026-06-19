import { describe, expect, it } from "vitest";
import { BATCH_PDF_LIMITS } from "../../lib/batch-pdf/limits.ts";
import {
  normalizeCellValue,
  normalizeHeader,
  parseCsvText,
  validateCsvFile,
} from "../../lib/batch-pdf/csv.ts";
import {
  getAllSampleCsvs,
  getSampleCsvByTemplateId,
} from "../../lib/batch-pdf/sample-csv.ts";
import { getAllTemplates } from "../../lib/batch-pdf/template-registry.ts";

function assertParseOk(csvText: string) {
  const result = parseCsvText(csvText);
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error("Expected CSV parsing to pass.");
  }

  return result.value;
}

function assertParseError(csvText: string) {
  const result = parseCsvText(csvText);
  expect(result.ok).toBe(false);

  if (result.ok) {
    throw new Error("Expected CSV parsing to fail.");
  }

  return result.errors;
}

describe("CSV utilities", () => {
  it("normalizes headers and cell values", () => {
    expect(normalizeHeader(" name ")).toBe("name");
    expect(normalizeCellValue(" Jane Smith ")).toBe("Jane Smith");
    expect(normalizeCellValue(null)).toBe("");
    expect(normalizeCellValue(42)).toBe("42");
  });

  it("validates CSV file metadata", () => {
    const validFile = new File(["name\nJane"], "people.csv", {
      type: "text/csv",
    });

    expect(validateCsvFile(validFile).ok).toBe(true);
  });

  it("rejects oversized file metadata", () => {
    const oversizedFile = new File(
      [new Uint8Array(BATCH_PDF_LIMITS.maxCsvFileSizeBytes + 1)],
      "people.csv",
      { type: "text/csv" },
    );

    const result = validateCsvFile(oversizedFile);
    expect(result.ok).toBe(false);
  });

  it("rejects non-CSV extensions", () => {
    const result = validateCsvFile(new File(["name\nJane"], "people.txt"));

    expect(result.ok).toBe(false);
  });

  it("parses valid CSV with headers and rows", () => {
    const result = assertParseOk("name,course\nJane Smith,Intro\nJohn Lee,Intro");

    expect(result.headers).toEqual(["name", "course"]);
    expect(result.rowCount).toBe(2);
    expect(result.rows[0]).toEqual({
      name: "Jane Smith",
      course: "Intro",
    });
  });

  it("handles quoted commas", () => {
    const result = assertParseOk('name,notes\nJane Smith,"Bring ID, forms, and pen"');

    expect(result.rows[0].notes).toBe("Bring ID, forms, and pen");
  });

  it("trims headers and values", () => {
    const result = assertParseOk(" name , course \n Jane Smith , Intro ");

    expect(result.headers).toEqual(["name", "course"]);
    expect(result.rows[0]).toEqual({
      name: "Jane Smith",
      course: "Intro",
    });
  });

  it("rejects empty files", () => {
    const errors = assertParseError("   \n  ");

    expect(errors[0].code).toBe("csv_empty_file");
  });

  it("rejects header-only files", () => {
    const errors = assertParseError("name,course\n");

    expect(errors[0].code).toBe("csv_missing_rows");
  });

  it("rejects duplicate headers after trimming", () => {
    const errors = assertParseError("name, name \nJane,Smith");

    expect(errors[0].code).toBe("csv_duplicate_header");
  });

  it("rejects blank header names", () => {
    const errors = assertParseError("name,,course\nJane,,Intro");

    expect(errors[0].code).toBe("csv_blank_header");
  });

  it("rejects too many columns", () => {
    const headers = Array.from(
      { length: BATCH_PDF_LIMITS.maxColumns + 1 },
      (_, index) => `column_${index}`,
    ).join(",");
    const row = Array.from(
      { length: BATCH_PDF_LIMITS.maxColumns + 1 },
      () => "value",
    ).join(",");

    const errors = assertParseError(`${headers}\n${row}`);

    expect(errors[0].code).toBe("csv_too_many_columns");
  });

  it("truncates to the first N rows and warns instead of rejecting", () => {
    const rows = Array.from(
      { length: BATCH_PDF_LIMITS.maxRowsParsed + 5 },
      (_, index) => `Person ${index}`,
    );

    const result = assertParseOk(["name", ...rows].join("\n"));

    expect(result.rowCount).toBe(BATCH_PDF_LIMITS.maxRowsParsed);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("enforces max field length without leaking row contents", () => {
    const privateValue = "Private Person Sentinel ".repeat(20);
    const errors = assertParseError(`name\n${privateValue}`);

    expect(errors[0].code).toBe("csv_field_too_long");
    expect(errors[0].message.includes(privateValue)).toBe(false);
    expect(errors[0].message.includes("Private Person Sentinel")).toBe(false);
  });

  it("returns correct row count and column list", () => {
    const result = assertParseOk("name,date\nJane,2026-06-15\nJohn,2026-06-16");

    expect(result.rowCount).toBe(2);
    expect(result.headers).toEqual(["name", "date"]);
  });
});

describe("sample CSVs", () => {
  it("has a sample CSV for every template", () => {
    for (const template of getAllTemplates()) {
      expect(getSampleCsvByTemplateId(template.id)).toBeTruthy();
    }
  });

  it("parses every sample CSV successfully", () => {
    for (const sample of getAllSampleCsvs()) {
      const result = parseCsvText(sample.csv);

      expect(result.ok, sample.templateId).toBe(true);
    }
  });

  it("uses safe and obvious sample CSV filenames", () => {
    for (const sample of getAllSampleCsvs()) {
      expect(sample.fileName).toMatch(/^[a-z0-9-]+-sample\.csv$/);
      expect(sample.fileName).toContain(sample.templateId);
    }
  });

  it("includes headers that can reasonably map to required template fields", () => {
    for (const template of getAllTemplates()) {
      const sample = getSampleCsvByTemplateId(template.id);
      expect(sample).toBeTruthy();

      if (!sample) {
        throw new Error(`Missing sample CSV for ${template.id}`);
      }

      const parsed = assertParseOk(sample.csv);

      for (const field of template.fields.filter((candidate) => candidate.required)) {
        const acceptedHeaders = new Set([field.key, ...field.aliases]);
        const hasReasonableHeader = parsed.headers.some((header) =>
          acceptedHeaders.has(header),
        );

        expect(
          hasReasonableHeader,
          `${template.id} sample should include a header for ${field.key}`,
        ).toBe(true);
      }
    }
  });
});
