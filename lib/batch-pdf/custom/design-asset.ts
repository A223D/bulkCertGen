import { CUSTOM_DESIGN_LIMITS } from "../limits.ts";
import type { Result } from "../types.ts";
import { validateDesignAsset } from "./design-file.ts";
import type { DesignAsset } from "./types.ts";

function safeError(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

function isPositiveFiniteDimension(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function validateDimensions(width: number, height: number): Result<{
  width: number;
  height: number;
}> {
  if (!isPositiveFiniteDimension(width) || !isPositiveFiniteDimension(height)) {
    return safeError(
      "custom_design_invalid_dimensions",
      "This design has invalid dimensions.",
    );
  }

  return { ok: true, value: { width, height } };
}

export function createImageDesignAsset(args: {
  kind: "png" | "jpeg";
  fileName: string;
  sizeBytes: number;
  intrinsicWidth: number;
  intrinsicHeight: number;
}): Result<DesignAsset> {
  const dimensions = validateDimensions(args.intrinsicWidth, args.intrinsicHeight);

  if (!dimensions.ok) {
    return dimensions;
  }

  const asset: DesignAsset = {
    kind: args.kind,
    fileName: args.fileName,
    sizeBytes: args.sizeBytes,
    selectedPageIndex: 0,
    intrinsicWidth: dimensions.value.width,
    intrinsicHeight: dimensions.value.height,
    intrinsicUnit: "px",
    aspectRatio: dimensions.value.width / dimensions.value.height,
  };

  return validateDesignAsset(asset);
}

export function createPdfDesignAsset(args: {
  fileName: string;
  sizeBytes: number;
  pageCount: number;
  selectedPageIndex: number;
  pageWidthPt: number;
  pageHeightPt: number;
}): Result<DesignAsset> {
  if (
    !Number.isInteger(args.pageCount) ||
    args.pageCount < 1 ||
    args.pageCount > CUSTOM_DESIGN_LIMITS.maxPdfPagesAccepted
  ) {
    return safeError(
      "custom_design_page_count_unsupported",
      args.pageCount > CUSTOM_DESIGN_LIMITS.maxPdfPagesAccepted
        ? "For now, upload a one-page PDF design."
        : "This custom design supports one PDF page for now.",
    );
  }

  const dimensions = validateDimensions(args.pageWidthPt, args.pageHeightPt);

  if (!dimensions.ok) {
    return dimensions;
  }

  const asset: DesignAsset = {
    kind: "pdf",
    fileName: args.fileName,
    sizeBytes: args.sizeBytes,
    pageCount: args.pageCount,
    selectedPageIndex: 0,
    intrinsicWidth: dimensions.value.width,
    intrinsicHeight: dimensions.value.height,
    intrinsicUnit: "pt",
    aspectRatio: dimensions.value.width / dimensions.value.height,
  };

  return validateDesignAsset(asset);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAspectRatio(aspectRatio: number): string {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return "Unknown";
  }

  if (Number.isInteger(aspectRatio)) {
    return `${aspectRatio}:1`;
  }

  return `${aspectRatio.toFixed(2)}:1`;
}
