import { BATCH_PDF_TEMPLATES } from "./templates.ts";
import type { BatchPdfTemplate, TemplateField } from "./types.ts";

export function getAllTemplates(): BatchPdfTemplate[] {
  return [...BATCH_PDF_TEMPLATES];
}

export function getTemplateById(id: string): BatchPdfTemplate | null {
  return BATCH_PDF_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function assertTemplateExists(id: string): BatchPdfTemplate {
  const template = getTemplateById(id);

  if (!template) {
    throw new Error(`Unknown batch PDF template: ${id}`);
  }

  return template;
}

export function getTemplateFields(id: string): TemplateField[] {
  return [...assertTemplateExists(id).fields];
}
