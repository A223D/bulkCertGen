import { describe, expect, it } from "vitest";
import { BATCH_PDF_LIMITS } from "../../lib/batch-pdf/limits.ts";
import { validateGeneratePdfRequest } from "../../lib/batch-pdf/validation.ts";

describe("batch PDF export limits", () => {
  it("free mode caps export rows at 10", () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      name: `Person ${index}`,
      course: "Intro",
      date: "2026-06-15",
    }));
    const result = validateGeneratePdfRequest({
      templateId: "classic-certificate",
      rows,
      mapping: { name: "name", course: "course", date: "date" },
      mode: "free",
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected validation to pass");
    }

    expect(result.value.rowsForExport).toHaveLength(BATCH_PDF_LIMITS.freeExportRows);
  });

  it("rejects requests above parsed max rows", () => {
    const rows = Array.from(
      { length: BATCH_PDF_LIMITS.maxRowsParsed + 1 },
      (_, index) => ({
        name: `Person ${index}`,
        course: "Intro",
        date: "2026-06-15",
      }),
    );
    const result = validateGeneratePdfRequest({
      templateId: "classic-certificate",
      rows,
      mapping: { name: "name", course: "course", date: "date" },
      mode: "free",
    });

    expect(result.ok).toBe(false);
  });
});
