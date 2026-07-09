import { describe, expect, it } from "vitest";
import {
  formatPrintSize,
  getPrintSizeSuitability,
  summarizePrintSizeSuitability,
} from "../../lib/batch-pdf/custom/print-size-suitability.ts";
import type { DesignAsset } from "../../lib/batch-pdf/custom/types.ts";

function makeDesign(overrides: Partial<DesignAsset> = {}): DesignAsset {
  return {
    kind: "png",
    fileName: "design.png",
    sizeBytes: 120000,
    selectedPageIndex: 0,
    intrinsicWidth: 1050,
    intrinsicHeight: 600,
    intrinsicUnit: "px",
    aspectRatio: 1050 / 600,
    ...overrides,
  };
}

describe("print size suitability", () => {
  it("formats common print sizes without noisy trailing zeroes", () => {
    expect(formatPrintSize(3.5, 2)).toBe("3.5 x 2 in");
    expect(formatPrintSize(3.375, 2.125)).toBe("3.375 x 2.125 in");
  });

  it("rates a small-card image as sharp for business cards but blurry for certificate size", () => {
    const rows = getPrintSizeSuitability(makeDesign());
    const businessCard = rows.find((row) => row.id === "business-card");
    const certificate = rows.find((row) => row.id === "letter-certificate");

    expect(businessCard?.level).toBe("ideal");
    expect(Math.round(businessCard?.effectiveDpi ?? 0)).toBe(300);
    expect(certificate?.level).toBe("low");
  });

  it("summarizes the largest common sharp and acceptable sizes", () => {
    const summary = summarizePrintSizeSuitability(getPrintSizeSuitability(makeDesign()));

    expect(summary.hasLowOnly).toBe(false);
    expect(summary.bestSharpSize?.id).toBe("business-card");
    expect(summary.bestAcceptableSize?.id).toBe("small-badge");
  });

  it("reports low-only when an image is too small for all common sizes", () => {
    const summary = summarizePrintSizeSuitability(
      getPrintSizeSuitability(makeDesign({ intrinsicWidth: 200, intrinsicHeight: 120 })),
    );

    expect(summary.hasLowOnly).toBe(true);
    expect(summary.bestSharpSize).toBeNull();
    expect(summary.bestAcceptableSize).toBeNull();
  });
});
