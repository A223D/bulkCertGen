import { CUSTOM_DESIGN_LIMITS } from "../limits.ts";
import type { Result } from "../types.ts";
import type { DesignAsset, DesignFileKind } from "./types.ts";

const extensionToKind: Record<string, DesignFileKind> = {
  ".pdf": "pdf",
  ".png": "png",
  ".jpg": "jpeg",
  ".jpeg": "jpeg",
};

const mimeTypeToKind: Record<string, DesignFileKind> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpeg",
};

function safeError(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function getDesignFileKindFromName(fileName: string): DesignFileKind | null {
  const normalized = fileName.trim().toLowerCase();
  const extension = Object.keys(extensionToKind).find((candidate) =>
    normalized.endsWith(candidate),
  );

  return extension ? extensionToKind[extension] : null;
}

export function getDesignFileKindFromMimeType(
  mimeType: string,
): DesignFileKind | null {
  return mimeTypeToKind[mimeType.trim().toLowerCase()] ?? null;
}

export function validateDesignFileMetadata(args: {
  fileName: string;
  sizeBytes: number;
  mimeType?: string;
}): Result<{
  kind: DesignFileKind;
  fileName: string;
  sizeBytes: number;
}> {
  const extensionKind = getDesignFileKindFromName(args.fileName);

  if (!extensionKind) {
    return safeError(
      "custom_design_unsupported_file",
      "Upload a PDF, PNG, JPG, or JPEG design file.",
    );
  }

  if (
    !Number.isFinite(args.sizeBytes) ||
    args.sizeBytes < 0 ||
    args.sizeBytes > CUSTOM_DESIGN_LIMITS.maxDesignFileSizeBytes
  ) {
    return safeError(
      "custom_design_file_too_large",
      "This design file is too large. Upload a file under 10 MB.",
    );
  }

  if (args.mimeType && args.mimeType.trim() !== "") {
    const mimeTypeKind = getDesignFileKindFromMimeType(args.mimeType);

    if (!mimeTypeKind) {
      return safeError(
        "custom_design_unsupported_file",
        "Upload a PDF, PNG, JPG, or JPEG design file.",
      );
    }

    if (mimeTypeKind !== extensionKind) {
      return safeError(
        "custom_design_type_mismatch",
        "The file extension and file type do not match.",
      );
    }
  }

  return {
    ok: true,
    value: {
      kind: extensionKind,
      fileName: args.fileName,
      sizeBytes: args.sizeBytes,
    },
  };
}

export function validateDesignAsset(design: DesignAsset): Result<DesignAsset> {
  const metadataResult = validateDesignFileMetadata({
    fileName: design.fileName,
    sizeBytes: design.sizeBytes,
  });

  if (!metadataResult.ok) {
    return metadataResult;
  }

  if (metadataResult.value.kind !== design.kind) {
    return safeError(
      "custom_design_type_mismatch",
      "The file extension and file type do not match.",
    );
  }

  if (
    design.pageCount !== undefined &&
    (!Number.isInteger(design.pageCount) ||
      design.pageCount < 1 ||
      design.pageCount > CUSTOM_DESIGN_LIMITS.maxPdfPagesAccepted)
  ) {
    return safeError(
      "custom_design_page_count_unsupported",
      "This custom design supports one PDF page for now.",
    );
  }

  if (
    !Number.isInteger(design.selectedPageIndex) ||
    design.selectedPageIndex < 0 ||
    (design.pageCount !== undefined && design.selectedPageIndex >= design.pageCount)
  ) {
    return safeError(
      "custom_design_invalid_selected_page",
      "Choose a valid design page.",
    );
  }

  if (
    !isPositiveFiniteNumber(design.intrinsicWidth) ||
    !isPositiveFiniteNumber(design.intrinsicHeight) ||
    !isPositiveFiniteNumber(design.aspectRatio)
  ) {
    return safeError(
      "custom_design_invalid_dimensions",
      "This design has invalid dimensions.",
    );
  }

  if (design.intrinsicUnit !== "px" && design.intrinsicUnit !== "pt") {
    return safeError(
      "custom_design_invalid_dimensions",
      "This design has invalid dimensions.",
    );
  }

  return { ok: true, value: design };
}
