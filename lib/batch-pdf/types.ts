export type TemplateCategory =
  | "certificate"
  | "badge"
  | "label"
  | "card"
  | "document";

export type FieldType =
  | "text"
  | "multiline"
  | "date"
  | "email"
  | "phone"
  | "address";

export type TemplateField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  aliases: string[];
  maxLength?: number;
  placeholder?: string;
  helpText?: string;
};

export type BatchPdfTemplate = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: TemplateCategory;
  version: number;
  fields: TemplateField[];
  recommendedFor: string[];
  free: boolean;
};

export type CsvParseResult = {
  headers: string[];
  rows: CsvRow[];
  rowCount: number;
  warnings: BatchPdfWarning[];
};

export type CsvRow = Record<string, string>;

export type FieldMapping = Record<string, string>;

export type MappedDocumentData = Record<string, string>;

export type BatchPdfWarning = {
  code: string;
  message: string;
  rowIndex?: number;
  fieldKey?: string;
};

export type BatchPdfError = {
  code: string;
  message: string;
  fieldKey?: string;
};

export type GeneratePdfRequest = {
  templateId: string;
  rows: CsvRow[];
  mapping: FieldMapping;
  mode: "free" | "paid";
  paidSessionId?: string;
};

export type GeneratePdfResult = {
  fileName: string;
  contentType: "application/zip";
};
