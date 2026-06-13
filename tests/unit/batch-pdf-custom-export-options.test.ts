import { describe, expect, it } from "vitest";
import { CUSTOM_DESIGN_LIMITS } from "../../lib/batch-pdf/limits.ts";
import {
  createDefaultExportOptions,
  getCommonPageSizes,
  getPageSizeDefinition,
  inchesToPoints,
  measurementToPoints,
  mmToPoints,
  resolveExportPageSizePoints,
  validateExportOptions,
} from "../../lib/batch-pdf/custom/export-options.ts";
import type { ExportOptions } from "../../lib/batch-pdf/custom/types.ts";

function makeOptions(overrides: Partial<ExportOptions> = {}): ExportOptions {
  return {
    ...createDefaultExportOptions(),
    pageSize: "letter",
    ...overrides,
  };
}

describe("custom design export option utilities", () => {
  it("exposes expected common page sizes", () => {
    expect(getCommonPageSizes().map((size) => size.key)).toEqual([
      "letter",
      "legal",
      "a4",
      "a5",
      "a6",
      "fourBySix",
      "idCard",
      "businessCard",
      "custom",
    ]);
    expect(getPageSizeDefinition("custom")?.label).toBe("Custom");
  });

  it("resolves Letter to 612 x 792 points before orientation adjustment", () => {
    const result = resolveExportPageSizePoints(makeOptions({ pageSize: "letter" }));

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected Letter page size to resolve.");
    }

    expect(result.value.widthPt).toBe(612);
    expect(result.value.heightPt).toBe(792);
  });

  it("resolves A4 using mm-to-points conversion", () => {
    const result = resolveExportPageSizePoints(makeOptions({ pageSize: "a4" }));

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected A4 page size to resolve.");
    }

    expect(result.value.widthPt).toBeCloseTo(mmToPoints(210));
    expect(result.value.heightPt).toBeCloseTo(mmToPoints(297));
  });

  it("converts inches to points", () => {
    expect(inchesToPoints(8.5)).toBe(612);
  });

  it("converts mm to points", () => {
    expect(mmToPoints(25.4)).toBeCloseTo(72);
  });

  it("converts measurements to points", () => {
    expect(measurementToPoints(1, "in")).toBe(72);
    expect(measurementToPoints(25.4, "mm")).toBeCloseTo(72);
  });

  it("applies portrait/landscape orientation consistently", () => {
    const portrait = resolveExportPageSizePoints(
      makeOptions({ pageSize: "idCard", orientation: "portrait" }),
    );
    const landscape = resolveExportPageSizePoints(
      makeOptions({ pageSize: "idCard", orientation: "landscape" }),
    );

    expect(portrait.ok).toBe(true);
    expect(landscape.ok).toBe(true);

    if (!portrait.ok || !landscape.ok) {
      throw new Error("Expected oriented page sizes to resolve.");
    }

    expect(portrait.value.widthPt).toBeLessThan(portrait.value.heightPt);
    expect(landscape.value.widthPt).toBeGreaterThan(landscape.value.heightPt);
  });

  it("validates default export options", () => {
    expect(validateExportOptions(createDefaultExportOptions()).ok).toBe(true);
  });

  it("validates onePerPage", () => {
    expect(validateExportOptions(makeOptions({ layoutMode: "onePerPage" })).ok).toBe(true);
  });

  it("validates fitMultiplePerPage", () => {
    expect(validateExportOptions(makeOptions({ layoutMode: "fitMultiplePerPage" })).ok).toBe(
      true,
    );
  });

  it("validates non-negative margins and gaps", () => {
    expect(validateExportOptions(makeOptions({ marginTop: 0, gapX: 0 })).ok).toBe(true);
    expect(validateExportOptions(makeOptions({ marginTop: -0.1 })).ok).toBe(false);
    expect(validateExportOptions(makeOptions({ gapY: -0.1 })).ok).toBe(false);
  });

  it("rejects margins that consume the whole page", () => {
    expect(
      validateExportOptions(makeOptions({ pageSize: "letter", marginLeft: 5, marginRight: 5 }))
        .ok,
    ).toBe(false);
  });

  it("validates custom page size", () => {
    expect(
      validateExportOptions(
        makeOptions({
          pageSize: "custom",
          customPageWidth: 4,
          customPageHeight: 6,
        }),
      ).ok,
    ).toBe(true);
  });

  it("rejects too-small custom page size", () => {
    expect(
      validateExportOptions(
        makeOptions({
          pageSize: "custom",
          customPageWidth: CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches - 0.1,
          customPageHeight: 6,
        }),
      ).ok,
    ).toBe(false);
  });

  it("rejects too-large custom page size", () => {
    expect(
      validateExportOptions(
        makeOptions({
          pageSize: "custom",
          customPageWidth: CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches + 1,
          customPageHeight: 6,
        }),
      ).ok,
    ).toBe(false);
  });

  it("rejects filenameColumn not present in CSV headers", () => {
    expect(
      validateExportOptions(makeOptions({ filenameColumn: "missing" }), ["name"]).ok,
    ).toBe(false);
  });

  it("accepts filenameColumn present in CSV headers", () => {
    expect(
      validateExportOptions(makeOptions({ filenameColumn: "name" }), ["name"]).ok,
    ).toBe(true);
  });

  it("returns safe errors", () => {
    const privateValue = "Private Person Sentinel";
    const result = validateExportOptions(
      makeOptions({ filenameColumn: privateValue }),
      ["name"],
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const messages = result.errors.map((error) => error.message).join(" ");

      expect(messages).not.toContain(privateValue);
    }
  });
});
