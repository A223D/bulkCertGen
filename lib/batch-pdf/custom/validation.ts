import type { Result } from "../types.ts";
import {
  getDesignFileKindFromMimeType,
  getDesignFileKindFromName,
  validateDesignAsset,
  validateDesignFileMetadata,
} from "./design-file.ts";
import { validateExportOptions } from "./export-options.ts";
import {
  createDefaultTextBoxStyle,
  validateCustomFieldBox,
  validateCustomFieldBoxes,
  validateCustomFieldBoxesForExport,
  validateFieldSource,
  validateTextBoxStyle,
} from "./field-boxes.ts";
import type {
  CustomFieldBox,
  DesignAsset,
  ExportOptions,
} from "./types.ts";

export {
  clampNormalizedRect,
  isFiniteNumber,
  normalizedRectToPoints,
  validateNormalizedRect,
} from "./coordinates.ts";
export {
  getDesignFileKindFromMimeType,
  getDesignFileKindFromName,
  validateDesignAsset,
  validateDesignFileMetadata,
} from "./design-file.ts";
export {
  createDefaultExportOptions,
  getCommonPageSizes,
  getPageSizeDefinition,
  inchesToPoints,
  measurementToPoints,
  mmToPoints,
  resolveExportPageSizePoints,
  validateExportOptions,
} from "./export-options.ts";
export {
  createDefaultTextBoxStyle,
  validateCustomFieldBox,
  validateCustomFieldBoxes,
  validateCustomFieldBoxesForExport,
  validateFieldSource,
  validateTextBoxStyle,
} from "./field-boxes.ts";
export type {
  CustomFieldBox,
  DesignAsset,
  DesignFileKind,
  ExportOptions,
  FieldSource,
  MeasurementUnit,
  NormalizedRect,
  PageSizeKey,
  TextBoxStyle,
  TextOverflowMode,
} from "./types.ts";

export function validateCustomDesignSetup(args: {
  design: DesignAsset;
  fieldBoxes: CustomFieldBox[];
  exportOptions: ExportOptions;
  csvHeaders: string[];
}): Result<{
  design: DesignAsset;
  fieldBoxes: CustomFieldBox[];
  exportOptions: ExportOptions;
}> {
  const designResult = validateDesignAsset(args.design);

  if (!designResult.ok) {
    return designResult;
  }

  const fieldBoxesResult = validateCustomFieldBoxes(
    args.fieldBoxes,
    args.csvHeaders,
  );

  if (!fieldBoxesResult.ok) {
    return fieldBoxesResult;
  }

  const exportOptionsResult = validateExportOptions(
    args.exportOptions,
    args.csvHeaders,
  );

  if (!exportOptionsResult.ok) {
    return exportOptionsResult;
  }

  return {
    ok: true,
    value: {
      design: designResult.value,
      fieldBoxes: fieldBoxesResult.value,
      exportOptions: exportOptionsResult.value,
    },
  };
}
