// ---------------------------------------------------------------------------
// Crop mark geometry
// ---------------------------------------------------------------------------

export type CropMarkLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const DEFAULT_MARK_LENGTH_PT = 9;
const DEFAULT_OFFSET_PT = 3;

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function clampNonNegative(value: number): number {
  return value < 0 ? 0 : value;
}

/**
 * Calculates 8 crop mark line segments (two per corner) surrounding an item
 * rectangle. Coordinates are in pdf-lib's bottom-left point space: (xPt, yPt)
 * is the bottom-left corner of the item.
 *
 * Returns an empty array if the inputs are invalid so that an optional drawing
 * step can safely skip rendering without throwing.
 */
export function calculateCropMarks(args: {
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
  markLengthPt?: number;
  offsetPt?: number;
}): CropMarkLine[] {
  const { xPt, yPt, widthPt, heightPt } = args;

  if (
    !isNonNegativeFinite(xPt) ||
    !isNonNegativeFinite(yPt) ||
    !isPositiveFinite(widthPt) ||
    !isPositiveFinite(heightPt)
  ) {
    return [];
  }

  const markLength = isPositiveFinite(args.markLengthPt)
    ? args.markLengthPt
    : DEFAULT_MARK_LENGTH_PT;
  const offset = isNonNegativeFinite(args.offsetPt) ? args.offsetPt : DEFAULT_OFFSET_PT;

  const left = xPt;
  const right = xPt + widthPt;
  const bottom = yPt;
  const top = yPt + heightPt;

  const line = (x1: number, y1: number, x2: number, y2: number): CropMarkLine => ({
    x1: clampNonNegative(x1),
    y1: clampNonNegative(y1),
    x2: clampNonNegative(x2),
    y2: clampNonNegative(y2),
  });

  return [
    // Bottom-left corner.
    line(left - offset - markLength, bottom, left - offset, bottom),
    line(left, bottom - offset - markLength, left, bottom - offset),
    // Bottom-right corner.
    line(right + offset, bottom, right + offset + markLength, bottom),
    line(right, bottom - offset - markLength, right, bottom - offset),
    // Top-left corner.
    line(left - offset - markLength, top, left - offset, top),
    line(left, top + offset, left, top + offset + markLength),
    // Top-right corner.
    line(right + offset, top, right + offset + markLength, top),
    line(right, top + offset, right, top + offset + markLength),
  ];
}
