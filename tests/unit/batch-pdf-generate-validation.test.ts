import { describe, expect, it } from "vitest";
import { validateGeneratePdfRequest } from "../../lib/batch-pdf/validation.ts";

const validRequest = {
  templateId: "classic-certificate",
  rows: [{ name: "Jane Smith", course: "Intro", date: "2026-06-15" }],
  mapping: { name: "name", course: "course", date: "date" },
  mode: "free",
};

describe("generate PDF request validation", () => {
  it("accepts a valid free request", () => {
    const result = validateGeneratePdfRequest(validRequest);

    expect(result.ok).toBe(true);
  });

  it("rejects paid mode in Phase 5", () => {
    const result = validateGeneratePdfRequest({
      ...validRequest,
      mode: "paid",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors[0].code).toBe("generate_paid_unavailable");
    }
  });

  it("rejects empty rows", () => {
    const result = validateGeneratePdfRequest({
      ...validRequest,
      rows: [],
    });

    expect(result.ok).toBe(false);
  });

  it("rejects unknown templates", () => {
    const result = validateGeneratePdfRequest({
      ...validRequest,
      templateId: "unknown-template",
    });

    expect(result.ok).toBe(false);
  });

  it("rejects invalid mapping", () => {
    const result = validateGeneratePdfRequest({
      ...validRequest,
      mapping: { name: "name" },
    });

    expect(result.ok).toBe(false);
  });

  it("rejects unknown mapped columns", () => {
    const result = validateGeneratePdfRequest({
      ...validRequest,
      mapping: { name: "missing", course: "course", date: "date" },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors[0].code).toBe("mapping_unknown_column");
    }
  });

  it("errors do not include row contents", () => {
    const privateValue = "Private Person Sentinel";
    const result = validateGeneratePdfRequest({
      ...validRequest,
      rows: [{ name: privateValue, course: "Intro", date: "2026-06-15" }],
      mapping: { name: "missing", course: "course", date: "date" },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors.map((error) => error.message).join(" ")).not.toContain(
        privateValue,
      );
    }
  });
});
