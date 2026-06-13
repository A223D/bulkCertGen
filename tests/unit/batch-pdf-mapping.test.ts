import { describe, expect, it } from "vitest";
import {
  autoMapFields,
  getMissingValueWarnings,
  mapRowToTemplateData,
  normalizeMappingText,
  validateMapping,
} from "../../lib/batch-pdf/mapping.ts";
import { parseCsvText } from "../../lib/batch-pdf/csv.ts";
import { getAllSampleCsvs } from "../../lib/batch-pdf/sample-csv.ts";
import {
  assertTemplateExists,
  getAllTemplates,
} from "../../lib/batch-pdf/template-registry.ts";
import type { BatchPdfTemplate } from "../../lib/batch-pdf/types.ts";

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

function getCertificateTemplate(): BatchPdfTemplate {
  return assertTemplateExists("classic-certificate");
}

describe("mapping utilities", () => {
  it("normalizes mapping text correctly", () => {
    expect(normalizeMappingText(" Full_Name ")).toBe("full name");
    expect(normalizeMappingText("full-name")).toBe("full name");
    expect(normalizeMappingText("Full... Name!!")).toBe("full name");
    expect(normalizeMappingText("  Full   Name  ")).toBe("full name");
  });

  it("auto-maps exact field key matches", () => {
    const template = getCertificateTemplate();
    const mapping = autoMapFields(template, ["name", "course", "date"]);

    expect(mapping.name).toBe("name");
    expect(mapping.course).toBe("course");
    expect(mapping.date).toBe("date");
  });

  it("auto-maps alias matches", () => {
    const template = getCertificateTemplate();
    const mapping = autoMapFields(template, [
      "Student Name",
      "Program",
      "Completion Date",
    ]);

    expect(mapping.name).toBe("Student Name");
    expect(mapping.course).toBe("Program");
    expect(mapping.date).toBe("Completion Date");
  });

  it("handles underscore, hyphen, and case differences", () => {
    const template = assertTemplateExists("mailing-label");
    const mapping = autoMapFields(template, [
      "Full-Name",
      "ADDRESS_LINE_1",
      "City",
      "province-state",
      "postal-code",
    ]);

    expect(mapping.name).toBe("Full-Name");
    expect(mapping.address_line_1).toBe("ADDRESS_LINE_1");
    expect(mapping.city).toBe("City");
    expect(mapping.region).toBe("province-state");
    expect(mapping.postal_code).toBe("postal-code");
  });

  it("does not auto-map ambiguous loose matches", () => {
    const template = getCertificateTemplate();
    const mapping = autoMapFields(template, ["primary name", "backup name"]);

    expect(mapping.name).toBeUndefined();
  });

  it("requires required fields to be mapped", () => {
    const template = getCertificateTemplate();
    const result = validateMapping(template, ["name"], { name: "name" });

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected mapping to fail");
    }

    expect(result.errors.some((error) => error.fieldKey === "course")).toBe(true);
    expect(result.errors.some((error) => error.fieldKey === "date")).toBe(true);
  });

  it("allows optional fields to be unmapped", () => {
    const template = getCertificateTemplate();
    const result = validateMapping(template, ["name", "course", "date"], {
      name: "name",
      course: "course",
      date: "date",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects unknown mapped columns", () => {
    const template = getCertificateTemplate();
    const result = validateMapping(template, ["name", "course", "date"], {
      name: "missing column",
      course: "course",
      date: "date",
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected mapping to fail");
    }

    expect(result.errors[0].code).toBe("mapping_unknown_column");
  });

  it("allows the same CSV column to map to multiple fields for MVP", () => {
    const template = getCertificateTemplate();
    const result = validateMapping(template, ["name"], {
      name: "name",
      course: "name",
      date: "name",
    });

    expect(result.ok).toBe(true);
  });

  it("maps a row to template data", () => {
    const template = getCertificateTemplate();
    const data = mapRowToTemplateData(
      {
        Name: "Jane Smith",
        Course: "Intro",
        Date: "2026-06-15",
      },
      {
        name: "Name",
        course: "Course",
        date: "Date",
      },
      template,
    );

    expect(data).toMatchObject({
      name: "Jane Smith",
      course: "Intro",
      date: "2026-06-15",
      issuer: "",
    });
  });

  it("returns empty strings for unmapped optional fields", () => {
    const template = getCertificateTemplate();
    const data = mapRowToTemplateData(
      { name: "Jane Smith", course: "Intro", date: "2026-06-15" },
      { name: "name", course: "course", date: "date" },
      template,
    );

    expect(data.issuer).toBe("");
  });

  it("produces missing required value warnings with counts", () => {
    const template = getCertificateTemplate();
    const warnings = getMissingValueWarnings(
      [
        { name: "Jane Smith", course: "Intro", date: "2026-06-15" },
        { name: "", course: "Intro", date: "2026-06-15" },
        { name: "John Lee", course: "Intro", date: "2026-06-15" },
      ],
      { name: "name", course: "course", date: "date" },
      template,
    );

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      code: "mapping_required_field_missing_values",
      fieldKey: "name",
    });
    expect(warnings[0].message).toContain("1 rows");
  });

  it("produces stronger warnings for all-empty required fields", () => {
    const template = getCertificateTemplate();
    const warnings = getMissingValueWarnings(
      [
        { name: "", course: "Intro", date: "2026-06-15" },
        { name: "", course: "Intro", date: "2026-06-15" },
      ],
      { name: "name", course: "course", date: "date" },
      template,
    );

    expect(warnings[0]).toMatchObject({
      code: "mapping_required_field_all_empty",
      fieldKey: "name",
    });
    expect(warnings[0].message).not.toContain("Intro");
  });

  it("mapping errors and warnings do not include raw row contents", () => {
    const template = getCertificateTemplate();
    const privateValue = "Private Person Sentinel";
    const warnings = getMissingValueWarnings(
      [
        { name: "", course: privateValue, date: "2026-06-15" },
        { name: "", course: privateValue, date: "2026-06-16" },
      ],
      { name: "name", course: "course", date: "date" },
      template,
    );

    const invalid = validateMapping(template, ["name", "course", "date"], {
      name: "unknown",
      course: "course",
      date: "date",
    });

    expect(warnings.map((warning) => warning.message).join(" ")).not.toContain(
      privateValue,
    );

    if (!invalid.ok) {
      expect(invalid.errors.map((error) => error.message).join(" ")).not.toContain(
        privateValue,
      );
    }
  });
});

describe("sample CSV automapping", () => {
  it("produces valid required-field mappings for every starter template sample", () => {
    for (const template of getAllTemplates()) {
      const parsed = getParsedSample(template.id);
      const mapping = autoMapFields(template, parsed.headers);
      const result = validateMapping(template, parsed.headers, mapping);

      expect(result.ok, template.id).toBe(true);
    }
  });
});
