import { describe, expect, it } from "vitest";
import { CUSTOM_DESIGN_LIMITS } from "../../lib/batch-pdf/limits.ts";
import {
  clampNormalizedRect,
  normalizedRectToPoints,
  validateNormalizedRect,
} from "../../lib/batch-pdf/custom/coordinates.ts";

describe("custom design coordinate utilities", () => {
  it("accepts valid normalized rect", () => {
    expect(
      validateNormalizedRect({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 }).ok,
    ).toBe(true);
  });

  it("rejects negative x/y", () => {
    expect(validateNormalizedRect({ x: -0.1, y: 0, width: 0.2, height: 0.2 }).ok).toBe(
      false,
    );
    expect(validateNormalizedRect({ x: 0, y: -0.1, width: 0.2, height: 0.2 }).ok).toBe(
      false,
    );
  });

  it("rejects width/height <= 0", () => {
    expect(validateNormalizedRect({ x: 0, y: 0, width: 0, height: 0.2 }).ok).toBe(
      false,
    );
    expect(validateNormalizedRect({ x: 0, y: 0, width: 0.2, height: -0.1 }).ok).toBe(
      false,
    );
  });

  it("rejects non-finite values", () => {
    expect(
      validateNormalizedRect({ x: Number.NaN, y: 0, width: 0.2, height: 0.2 }).ok,
    ).toBe(false);
    expect(
      validateNormalizedRect({ x: 0, y: Number.POSITIVE_INFINITY, width: 0.2, height: 0.2 })
        .ok,
    ).toBe(false);
  });

  it("rejects rects extending beyond right/bottom bounds", () => {
    expect(validateNormalizedRect({ x: 0.9, y: 0, width: 0.2, height: 0.2 }).ok).toBe(
      false,
    );
    expect(validateNormalizedRect({ x: 0, y: 0.9, width: 0.2, height: 0.2 }).ok).toBe(
      false,
    );
  });

  it("rejects boxes smaller than configured min width/height", () => {
    expect(
      validateNormalizedRect({
        x: 0,
        y: 0,
        width: CUSTOM_DESIGN_LIMITS.minBoxWidthNormalized / 2,
        height: 0.2,
      }).ok,
    ).toBe(false);
    expect(
      validateNormalizedRect({
        x: 0,
        y: 0,
        width: 0.2,
        height: CUSTOM_DESIGN_LIMITS.minBoxHeightNormalized / 2,
      }).ok,
    ).toBe(false);
  });

  it("clamps out-of-bound rects correctly with clampNormalizedRect", () => {
    const rect = clampNormalizedRect({ x: -0.5, y: 1.2, width: 0.4, height: 0.3 });

    expect(rect).toEqual({ x: 0, y: 0.7, width: 0.4, height: 0.3 });
  });

  it("converts normalized rect to points correctly", () => {
    expect(
      normalizedRectToPoints({
        rect: { x: 0.25, y: 0.5, width: 0.5, height: 0.25 },
        pageWidthPt: 400,
        pageHeightPt: 200,
      }),
    ).toEqual({ x: 100, y: 100, width: 200, height: 50 });
  });

  it("handles page width/height in points", () => {
    const rect = normalizedRectToPoints({
      rect: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
      pageWidthPt: 612,
      pageHeightPt: 792,
    });

    expect(rect.x).toBeCloseTo(61.2);
    expect(rect.y).toBeCloseTo(79.2);
    expect(rect.width).toBeCloseTo(489.6);
    expect(rect.height).toBeCloseTo(633.6);
  });
});
