import { describe, expect, it } from "vitest";
import { validateNormalizedRect } from "../../lib/batch-pdf/custom/coordinates.ts";
import {
  moveNormalizedRect,
  normalizedRectToPixelRect,
  nudgeNormalizedRect,
  pixelRectToNormalizedRect,
  resizeNormalizedRect,
} from "../../lib/batch-pdf/custom/editor-geometry.ts";
import type { NormalizedRect } from "../../lib/batch-pdf/custom/types.ts";

const rect: NormalizedRect = { x: 0.25, y: 0.2, width: 0.4, height: 0.3 };

describe("custom design editor geometry", () => {
  it("converts normalized rects to pixel rects", () => {
    expect(
      normalizedRectToPixelRect({
        rect,
        containerWidth: 1000,
        containerHeight: 500,
      }),
    ).toEqual({ x: 250, y: 100, width: 400, height: 150 });
  });

  it("converts pixel rects to normalized rects", () => {
    const result = pixelRectToNormalizedRect({
      rect: { x: 250, y: 100, width: 400, height: 150 },
      containerWidth: 1000,
      containerHeight: 500,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual(rect);
    }
  });

  it("rejects invalid container dimensions", () => {
    expect(
      pixelRectToNormalizedRect({
        rect: { x: 0, y: 0, width: 10, height: 10 },
        containerWidth: 0,
        containerHeight: 500,
      }).ok,
    ).toBe(false);
    expect(() =>
      normalizedRectToPixelRect({
        rect,
        containerWidth: 1000,
        containerHeight: 0,
      }),
    ).toThrow();
  });

  it("moves right and down", () => {
    expect(moveNormalizedRect({ rect, deltaX: 0.1, deltaY: 0.2 })).toEqual({
      x: 0.35,
      y: 0.4,
      width: 0.4,
      height: 0.3,
    });
  });

  it("moves left and up", () => {
    expect(moveNormalizedRect({ rect, deltaX: -0.1, deltaY: -0.1 })).toEqual({
      x: 0.15,
      y: 0.1,
      width: 0.4,
      height: 0.3,
    });
  });

  it("clamps movement to left and top bounds", () => {
    expect(moveNormalizedRect({ rect, deltaX: -1, deltaY: -1 })).toEqual({
      x: 0,
      y: 0,
      width: 0.4,
      height: 0.3,
    });
  });

  it("clamps movement to right and bottom bounds", () => {
    expect(moveNormalizedRect({ rect, deltaX: 1, deltaY: 1 })).toEqual({
      x: 0.6,
      y: 0.7,
      width: 0.4,
      height: 0.3,
    });
  });

  it("resizes southeast", () => {
    expect(
      resizeNormalizedRect({
        rect,
        handle: "se",
        deltaX: 0.1,
        deltaY: 0.2,
      }),
    ).toEqual({ x: 0.25, y: 0.2, width: 0.5, height: 0.5 });
  });

  it("resizes northwest by adjusting x, y, width, and height", () => {
    expect(
      resizeNormalizedRect({
        rect,
        handle: "nw",
        deltaX: -0.1,
        deltaY: -0.05,
      }),
    ).toEqual({ x: 0.15, y: 0.15, width: 0.5, height: 0.35 });
  });

  it("clamps resizing to minimum width and height", () => {
    const resized = resizeNormalizedRect({
      rect,
      handle: "se",
      deltaX: -0.39,
      deltaY: -0.29,
    });

    expect(validateNormalizedRect(resized).ok).toBe(true);
    expect(resized.width).toBeGreaterThanOrEqual(0.01);
    expect(resized.height).toBeGreaterThanOrEqual(0.01);
  });

  it("clamps resizing to design bounds", () => {
    expect(
      resizeNormalizedRect({
        rect,
        handle: "se",
        deltaX: 1,
        deltaY: 1,
      }),
    ).toEqual({ x: 0.25, y: 0.2, width: 0.75, height: 0.8 });
  });

  it("nudges in each direction", () => {
    expect(nudgeNormalizedRect({ rect, direction: "up", amount: 0.01 }).y).toBe(0.19);
    expect(nudgeNormalizedRect({ rect, direction: "down", amount: 0.01 }).y).toBe(0.21);
    expect(nudgeNormalizedRect({ rect, direction: "left", amount: 0.01 }).x).toBe(0.24);
    expect(nudgeNormalizedRect({ rect, direction: "right", amount: 0.01 }).x).toBe(0.26);
  });

  it("preserves valid normalized rectangles", () => {
    const helpers = [
      moveNormalizedRect({ rect, deltaX: 0.2, deltaY: 0.2 }),
      resizeNormalizedRect({ rect, handle: "nw", deltaX: -0.1, deltaY: -0.1 }),
      resizeNormalizedRect({ rect, handle: "se", deltaX: 0.1, deltaY: 0.1 }),
      nudgeNormalizedRect({ rect, direction: "right" }),
    ];

    for (const helperRect of helpers) {
      expect(validateNormalizedRect(helperRect).ok).toBe(true);
    }
  });
});
