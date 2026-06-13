import { describe, expect, it } from "vitest";
import { autoMapFields, mapRowToTemplateData } from "../../lib/batch-pdf/mapping.ts";
import { parseCsvText } from "../../lib/batch-pdf/csv.ts";
import { renderPdfForTemplate } from "../../lib/batch-pdf/render/index.ts";
import { getAllSampleCsvs } from "../../lib/batch-pdf/sample-csv.ts";
import {
  assertTemplateExists,
  getAllTemplates,
} from "../../lib/batch-pdf/template-registry.ts";
import type { BatchPdfTemplate } from "../../lib/batch-pdf/types.ts";

function getSampleData(template: BatchPdfTemplate) {
  const sample = getAllSampleCsvs().find((candidate) => candidate.templateId === template.id);

  if (!sample) {
    throw new Error(`Missing sample for ${template.id}`);
  }

  const parsed = parseCsvText(sample.csv);

  if (!parsed.ok) {
    throw new Error(`Sample did not parse for ${template.id}`);
  }

  const mapping = autoMapFields(template, parsed.value.headers);
  return mapRowToTemplateData(parsed.value.rows[0], mapping, template);
}

describe("PDF renderers", () => {
  it("renders every starter template to a non-empty PDF buffer", async () => {
    for (const template of getAllTemplates()) {
      const bytes = await renderPdfForTemplate({
        template,
        data: getSampleData(template),
      });

      expect(bytes.length, template.id).toBeGreaterThan(100);
    }
  });

  it("rejects unknown templates safely", async () => {
    const template = {
      ...assertTemplateExists("classic-certificate"),
      id: "unknown-template",
    };

    await expect(
      renderPdfForTemplate({
        template,
        data: {},
      }),
    ).rejects.toThrow(/not available/);
  });

  it("does not crash with missing optional values", async () => {
    const template = assertTemplateExists("classic-certificate");
    const bytes = await renderPdfForTemplate({
      template,
      data: {
        name: "Jane Smith",
        course: "Intro",
        date: "2026-06-15",
        issuer: "",
      },
    });

    expect(bytes.length).toBeGreaterThan(100);
  });

  it("uses fallback and does not crash with missing required values", async () => {
    const template = assertTemplateExists("classic-certificate");
    const bytes = await renderPdfForTemplate({
      template,
      data: {
        name: "",
        course: "",
        date: "",
      },
    });

    expect(bytes.length).toBeGreaterThan(100);
  });
});
