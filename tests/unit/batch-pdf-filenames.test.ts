import { describe, expect, it } from "vitest";
import { makeSafePdfFilename } from "../../lib/batch-pdf/filenames.ts";

describe("PDF filename utility", () => {
  it("sanitizes a normal name", () => {
    expect(
      makeSafePdfFilename({
        templateId: "classic-certificate",
        index: 1,
        data: { name: "Jane Smith" },
      }),
    ).toBe("001-jane-smith-classic-certificate.pdf");
  });

  it("removes unsafe characters", () => {
    expect(
      makeSafePdfFilename({
        templateId: "name-badge",
        index: 2,
        data: { name: "Jane / Smith <Admin>" },
      }),
    ).toBe("002-jane-smith-admin-name-badge.pdf");
  });

  it("collapses repeated hyphens", () => {
    expect(
      makeSafePdfFilename({
        templateId: "mailing-label",
        index: 3,
        data: { name: "Jane --- Smith" },
      }),
    ).toBe("003-jane-smith-mailing-label.pdf");
  });

  it("uses fallback when name is missing", () => {
    expect(
      makeSafePdfFilename({
        templateId: "appointment-card",
        index: 1,
        data: {},
      }),
    ).toBe("001-document.pdf");
  });

  it("always includes .pdf", () => {
    expect(
      makeSafePdfFilename({
        templateId: "classic-certificate",
        index: 1,
        data: { name: "Jane" },
      }).endsWith(".pdf"),
    ).toBe(true);
  });

  it("respects max filename length before extension", () => {
    const filename = makeSafePdfFilename({
      templateId: "classic-certificate",
      index: 1,
      data: { name: "Jane Smith ".repeat(20) },
    });
    const base = filename.replace(/\.pdf$/, "");

    expect(base.length).toBeLessThanOrEqual(80);
  });

  it("handles non-Latin and symbol-heavy input safely", () => {
    expect(
      makeSafePdfFilename({
        templateId: "classic-certificate",
        index: 1,
        data: { name: "東京 *** !!!" },
      }),
    ).toBe("001-東京-classic-certificate.pdf");
  });
});
