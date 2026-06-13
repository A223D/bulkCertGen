import { describe, expect, it } from "vitest";
import {
  assertTemplateExists,
  getAllTemplates,
  getTemplateById,
  getTemplateFields,
} from "../../lib/batch-pdf/template-registry.ts";

const templates = getAllTemplates();
const urlSafePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fieldKeyPattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

describe("batch PDF template registry", () => {
  it("registers the four starter templates", () => {
    expect(templates.map((template) => template.id)).toEqual([
      "classic-certificate",
      "name-badge",
      "mailing-label",
      "appointment-card",
    ]);
  });

  it("uses unique URL-safe template IDs", () => {
    const ids = templates.map((template) => template.id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const id of ids) {
      expect(id).toMatch(urlSafePattern);
      expect(id.includes(" ")).toBe(false);
    }
  });

  it("defines required template metadata", () => {
    for (const template of templates) {
      expect(template.name).toBeTruthy();
      expect(template.shortName).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.category).toBeTruthy();
      expect(typeof template.version).toBe("number");
      expect(template.version).toBeGreaterThanOrEqual(1);
      expect(typeof template.free).toBe("boolean");
      expect(template.recommendedFor.length).toBeGreaterThan(0);
    }
  });

  it("defines valid fields for every template", () => {
    for (const template of templates) {
      expect(template.fields.length).toBeGreaterThan(0);
      expect(
        template.fields.some((field) => field.required),
        `${template.id} should have at least one required field`,
      ).toBe(true);

      const fieldKeys = template.fields.map((field) => field.key);
      expect(new Set(fieldKeys).size).toBe(fieldKeys.length);

      for (const field of template.fields) {
        expect(field.key).toMatch(fieldKeyPattern);
        expect(field.key.includes(" ")).toBe(false);
        expect(field.label).toBeTruthy();
        expect(field.aliases.length).toBeGreaterThan(0);

        if (field.required) {
          expect(field.label).toBeTruthy();
          expect(field.aliases.length).toBeGreaterThan(0);
        }

        if (field.maxLength !== undefined) {
          expect(field.maxLength).toBeGreaterThan(0);
          expect(field.maxLength).toBeLessThanOrEqual(300);
        }
      }
    }
  });

  it("retrieves every template by ID", () => {
    for (const template of templates) {
      expect(getTemplateById(template.id)?.id).toBe(template.id);
      expect(assertTemplateExists(template.id).id).toBe(template.id);
      expect(getTemplateFields(template.id)).toEqual(template.fields);
    }
  });

  it("handles unknown template IDs through null and assert helpers", () => {
    expect(getTemplateById("unknown-template")).toBeNull();
    expect(() => assertTemplateExists("unknown-template")).toThrow(
      /Unknown batch PDF template/,
    );
  });
});
