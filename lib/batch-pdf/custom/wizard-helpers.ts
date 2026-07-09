import type { DesignAsset, ExportOptions } from "./types.ts";
import { getBuiltInDesignByFileName } from "../built-in-designs.ts";
import { CUSTOM_DESIGN_LIMITS } from "../limits.ts";

function roundDimension(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Derives a recommended finished print size from the image's aspect ratio.
 *
 * The recommendation always satisfies `aspectRatiosDiffer(...) === false` by
 * construction — the recommended size's ratio matches the image's ratio
 * (within rounding), so the mismatch warning never fires on defaults.
 *
 * Strategy by ratio class:
 *   ratio >= 1.8   → wide (labels, banners): long edge 4 in
 *   1.05–1.8       → landscape doc/badge: long edge 11 in if large pixel count, else 4 in
 *   0.95–1.05      → square: 4 × 4
 *   < 0.95         → portrait: mirror landscape logic
 */
export function getRecommendedFinishedSize(
  asset: DesignAsset,
): Pick<ExportOptions, "customItemWidth" | "customItemHeight" | "unit"> {
  const builtIn = getBuiltInDesignByFileName(asset.fileName);
  if (builtIn) {
    return {
      customItemWidth: builtIn.finishedWidthIn,
      customItemHeight: builtIn.finishedHeightIn,
      unit: "in",
    };
  }

  const ratio = asset.intrinsicWidth / asset.intrinsicHeight;
  const maxDim = Math.max(asset.intrinsicWidth, asset.intrinsicHeight);
  const isLarge = maxDim >= 1000;

  if (ratio >= 1.8) {
    // Wide: labels, banners — long edge 4 in
    return {
      customItemWidth: 4,
      customItemHeight: roundDimension(4 / ratio),
      unit: "in",
    };
  }

  if (ratio >= 1.05 && ratio < 1.8) {
    // Landscape
    const longEdge = isLarge ? 11 : 4;
    return {
      customItemWidth: longEdge,
      customItemHeight: roundDimension(longEdge / ratio),
      unit: "in",
    };
  }

  if (ratio >= 0.95 && ratio < 1.05) {
    // Square
    return { customItemWidth: 4, customItemHeight: 4, unit: "in" };
  }

  // Portrait (ratio < 0.95)
  const longEdge = isLarge ? 11 : 4;
  return {
    customItemWidth: roundDimension((longEdge * ratio) / 1),
    customItemHeight: longEdge,
    unit: "in",
  };
}

/**
 * Validates that a finished size falls within the allowed bounds (0.5–48 in).
 * Shared between client UI validation, preflight, and server validation.
 */
export function isValidFinishedSize(
  width: number,
  height: number,
): boolean {
  return (
    width >= CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches &&
    width <= CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches &&
    height >= CUSTOM_DESIGN_LIMITS.minCustomPageSizeInches &&
    height <= CUSTOM_DESIGN_LIMITS.maxCustomPageSizeInches
  );
}
