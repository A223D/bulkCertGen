import { mapRowToTemplateData } from "./mapping.ts";
import type {
  BatchPdfTemplate,
  CsvRow,
  FieldMapping,
  MappedDocumentData,
  Result,
} from "./types.ts";

export type PreviewDataResult = {
  rowIndex: number;
  rowCount: number;
  data: MappedDocumentData;
};

export function clampPreviewRowIndex(rowIndex: number, rowCount: number): number {
  if (rowCount <= 0) {
    return 0;
  }

  if (!Number.isFinite(rowIndex)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(rowIndex), 0), rowCount - 1);
}

export function getPreviewData(args: {
  rows: CsvRow[];
  rowIndex: number;
  mapping: FieldMapping;
  template: BatchPdfTemplate;
}): Result<PreviewDataResult> {
  if (args.rows.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: "preview_no_rows",
          message: "Upload a CSV with at least one data row before previewing.",
        },
      ],
    };
  }

  const rowIndex = clampPreviewRowIndex(args.rowIndex, args.rows.length);
  const row = args.rows[rowIndex];

  return {
    ok: true,
    value: {
      rowIndex,
      rowCount: args.rows.length,
      data: mapRowToTemplateData(row, args.mapping, args.template),
    },
  };
}
