import { describe, expect, it } from "vitest";
import { CUSTOM_DESIGN_LIMITS } from "../../lib/batch-pdf/limits.ts";
import {
  getRecommendedFinishedSize,
  isValidFinishedSize,
} from "../../lib/batch-pdf/custom/wizard-helpers.ts";
import type { DesignAsset } from "../../lib/batch-pdf/custom/types.ts";

function makeImageDesign(overrides: Partial<DesignAsset> = {}): DesignAsset {
  return {
    kind: "png",
    fileName: "design.png",
    sizeBytes: 80000,
    selectedPageIndex: 0,
    intrinsicWidth: 1000,
    intrinsicHeight: 1000,
    intrinsicUnit: "px",
    aspectRatio: 1,
    ...overrides,
  };
}

describe("custom design wizard helpers", () => {
  it.each([
    [600, 600, 4, 4],
    [1200, 600, 4, 2],
    [3300, 2550, 11, 8.5],
    [900, 1500, 6.6, 11],
    [3000, 1000, 4, 1.3],
  ])("recommends an aspect-aware finished size for %i x %i", (intrinsicWidth, intrinsicHeight, expectedWidth, expectedHeight) => {
    const result = getRecommendedFinishedSize(
      makeImageDesign({ intrinsicWidth, intrinsicHeight, aspectRatio: intrinsicWidth / intrinsicHeight }),
    );

    expect(result.unit).toBe("in");
    expect(result.customItemWidth).toBeCloseTo(expectedWidth, 1);
    expect(result.customItemHeight).toBeCloseTo(expectedHeight, 1);
    const recommendedRatio = (result.customItemWidth ?? 0) / (result.customItemHeight ?? 1);
    expect(Math.abs(recommendedRatio / (intrinsicWidth / intrinsicHeight) - 1)).toBeLessThanOrEqual(0.03);
  });

  it("validates finished size bounds from the shared limits", () => {
    expect(isValidFinishedSize(CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches - 0.1, 1)).toBe(false);
    expect(isValidFinishedSize(CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches + 12, 1)).toBe(false);
    expect(
      isValidFinishedSize(
        CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches,
        CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches,
      ),
    ).toBe(true);
  });
});
