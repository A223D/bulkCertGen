import { describe, expect, it } from "vitest";
import { autoMapFields } from "../../lib/batch-pdf/mapping.ts";
import {
  clampPreviewRowIndex,
  getPreviewData,
} from "../../lib/batch-pdf/preview.ts";
import { parseCsvText } from "../../lib/batch-pdf/csv.ts";
import { getAllSampleCsvs } from "../../lib/batch-pdf/sample-csv.ts";
import {
  assertTemplateExists,
  getAllTemplates,
} from "../../lib/batch-pdf/template-registry.ts";

function getParsedSample(templateId: string) {
  const sample = getAllSampleCsvs().find((candidate) => candidate.templateId === templateId);

  if (!sample) {
    throw new Error(`Missing sample for ${templateId}`);
  }

  const parsed = parseCsvText(sample.csv);

  if (!parsed.ok) {
    throw new Error(`Sample did not parse for ${templateId}`);
  }

  return parsed.value;
}

describe("preview helpers", () => {
  it("clamps row index below 0 to 0", () => {
    expect(clampPreviewRowIndex(-4, 3)).toBe(0);
  });

  it("clamps row index above range to last row", () => {
    expect(clampPreviewRowIndex(12, 3)).toBe(2);
  });

  it("returns safe error when rows are empty", () => {
    const template = assertTemplateExists("classic-certificate");
    const result = getPreviewData({
      rows: [],
      rowIndex: 0,
      mapping: {},
      template,
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected preview to fail");
    }

    expect(result.errors[0].code).toBe("preview_no_rows");
    expect(result.errors[0].message).not.toContain("Jane");
  });

  it("returns mapped preview data for selected row", () => {
    const template = assertTemplateExists("classic-certificate");
    const result = getPreviewData({
      rows: [
        { name: "Jane Smith", course: "Intro", date: "2026-06-15" },
        { name: "John Lee", course: "Advanced", date: "2026-06-16" },
      ],
      rowIndex: 1,
      mapping: { name: "name", course: "course", date: "date" },
      template,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected preview to pass");
    }

    expect(result.value.rowIndex).toBe(1);
    expect(result.value.rowCount).toBe(2);
    expect(result.value.data).toMatchObject({
      name: "John Lee",
      course: "Advanced",
      date: "2026-06-16",
    });
  });

  it("uses mapping utilities behavior for unmapped optional fields", () => {
    const template = assertTemplateExists("classic-certificate");
    const result = getPreviewData({
      rows: [{ name: "Jane Smith", course: "Intro", date: "2026-06-15" }],
      rowIndex: 0,
      mapping: { name: "name", course: "course", date: "date" },
      template,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected preview to pass");
    }

    expect(result.value.data.issuer).toBe("");
  });

  it("errors do not include raw row contents", () => {
    const template = assertTemplateExists("classic-certificate");
    const privateValue = "Private Person Sentinel";
    const result = getPreviewData({
      rows: [],
      rowIndex: 0,
      mapping: { name: privateValue },
      template,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors.map((error) => error.message).join(" ")).not.toContain(
        privateValue,
      );
    }
  });

  it("preview data works for each starter template sample with auto-mapping", () => {
    for (const template of getAllTemplates()) {
      const parsed = getParsedSample(template.id);
      const mapping = autoMapFields(template, parsed.headers);
      const result = getPreviewData({
        rows: parsed.rows,
        rowIndex: 0,
        mapping,
        template,
      });

      expect(result.ok, template.id).toBe(true);

      if (!result.ok) {
        throw new Error(`Expected preview for ${template.id}`);
      }

      for (const field of template.fields.filter((candidate) => candidate.required)) {
        expect(result.value.data[field.key], `${template.id}:${field.key}`).toBeTruthy();
      }
    }
  });
});
