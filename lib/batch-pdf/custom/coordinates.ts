import { CUSTOM_DESIGN_LIMITS } from "../limits.ts";
import type { Result } from "../types.ts";
import type { NormalizedRect } from "./types.ts";

const BOUNDS_EPSILON = 0.000000001;

function error(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateNormalizedRect(
  rect: NormalizedRect,
): Result<NormalizedRect> {
  if (
    !isFiniteNumber(rect.x) ||
    !isFiniteNumber(rect.y) ||
    !isFiniteNumber(rect.width) ||
    !isFiniteNumber(rect.height)
  ) {
    return error(
      "custom_rect_invalid_number",
      "Field boxes must use finite coordinates.",
    );
  }

  if (rect.x < 0 || rect.y < 0) {
    return error(
      "custom_rect_out_of_bounds",
      "Field boxes must stay inside the design.",
    );
  }

  if (rect.width <= 0 || rect.height <= 0) {
    return error(
      "custom_rect_invalid_size",
      "Field boxes must have a positive width and height.",
    );
  }

  if (
    rect.width < CUSTOM_DESIGN_LIMITS.minBoxWidthNormalized ||
    rect.height < CUSTOM_DESIGN_LIMITS.minBoxHeightNormalized
  ) {
    return error(
      "custom_rect_too_small",
      "Field boxes must be large enough to place text.",
    );
  }

  if (
    rect.x + rect.width > 1 + BOUNDS_EPSILON ||
    rect.y + rect.height > 1 + BOUNDS_EPSILON
  ) {
    return error(
      "custom_rect_out_of_bounds",
      "Field boxes must stay inside the design.",
    );
  }

  return { ok: true, value: rect };
}

export function clampNormalizedRect(rect: NormalizedRect): NormalizedRect {
  const minWidth = CUSTOM_DESIGN_LIMITS.minBoxWidthNormalized;
  const minHeight = CUSTOM_DESIGN_LIMITS.minBoxHeightNormalized;
  const width = clamp(isFiniteNumber(rect.width) ? rect.width : minWidth, minWidth, 1);
  const height = clamp(
    isFiniteNumber(rect.height) ? rect.height : minHeight,
    minHeight,
    1,
  );

  return {
    x: clamp(isFiniteNumber(rect.x) ? rect.x : 0, 0, 1 - width),
    y: clamp(isFiniteNumber(rect.y) ? rect.y : 0, 0, 1 - height),
    width,
    height,
  };
}

export function normalizedRectToPoints(args: {
  rect: NormalizedRect;
  pageWidthPt: number;
  pageHeightPt: number;
}): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: args.rect.x * args.pageWidthPt,
    y: args.rect.y * args.pageHeightPt,
    width: args.rect.width * args.pageWidthPt,
    height: args.rect.height * args.pageHeightPt,
  };
}
