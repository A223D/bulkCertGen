import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
    assert.deepEqual(
      templates.map((template) => template.id),
      [
        "classic-certificate",
        "name-badge",
        "mailing-label",
        "appointment-card",
      ],
    );
  });

  it("uses unique URL-safe template IDs", () => {
    const ids = templates.map((template) => template.id);

    assert.equal(new Set(ids).size, ids.length);

    for (const id of ids) {
      assert.match(id, urlSafePattern);
      assert.equal(id.includes(" "), false);
    }
  });

  it("defines required template metadata", () => {
    for (const template of templates) {
      assert.ok(template.name);
      assert.ok(template.shortName);
      assert.ok(template.description);
      assert.ok(template.category);
      assert.equal(typeof template.version, "number");
      assert.ok(template.version >= 1);
      assert.equal(typeof template.free, "boolean");
      assert.ok(template.recommendedFor.length > 0);
    }
  });

  it("defines valid fields for every template", () => {
    for (const template of templates) {
      assert.ok(template.fields.length > 0);
      assert.ok(
        template.fields.some((field) => field.required),
        `${template.id} should have at least one required field`,
      );

      const fieldKeys = template.fields.map((field) => field.key);
      assert.equal(new Set(fieldKeys).size, fieldKeys.length);

      for (const field of template.fields) {
        assert.match(field.key, fieldKeyPattern);
        assert.equal(field.key.includes(" "), false);
        assert.ok(field.label);
        assert.ok(field.aliases.length > 0);

        if (field.required) {
          assert.ok(field.label);
          assert.ok(field.aliases.length > 0);
        }

        if (field.maxLength !== undefined) {
          assert.ok(field.maxLength > 0);
          assert.ok(field.maxLength <= 300);
        }
      }
    }
  });

  it("retrieves every template by ID", () => {
    for (const template of templates) {
      assert.equal(getTemplateById(template.id)?.id, template.id);
      assert.equal(assertTemplateExists(template.id).id, template.id);
      assert.deepEqual(getTemplateFields(template.id), template.fields);
    }
  });

  it("handles unknown template IDs through null and assert helpers", () => {
    assert.equal(getTemplateById("unknown-template"), null);
    assert.throws(
      () => assertTemplateExists("unknown-template"),
      /Unknown batch PDF template/,
    );
  });
});
