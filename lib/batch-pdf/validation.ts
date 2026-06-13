import { z } from "zod";
import { BATCH_PDF_LIMITS } from "./limits.ts";
import { validateMapping } from "./mapping.ts";
import { getTemplateById } from "./template-registry.ts";
import type {
  BatchPdfTemplate,
  CsvRow,
  FieldMapping,
  GeneratePdfRequest,
  Result,
} from "./types.ts";

const csvRowSchema = z.record(z.string(), z.string());

const generatePdfRequestSchema = z.object({
  templateId: z.string().min(1),
  rows: z.array(csvRowSchema),
  mapping: z.record(z.string(), z.string()),
  mode: z.enum(["free", "paid"]),
});

export type ValidatedGeneratePdfRequest = {
  template: BatchPdfTemplate;
  templateId: string;
  rows: CsvRow[];
  rowsForExport: CsvRow[];
  mapping: FieldMapping;
  mode: "free";
};

function getHeadersFromRows(rows: CsvRow[]): string[] {
  return Array.from(
    rows.reduce<Set<string>>((headers, row) => {
      for (const header of Object.keys(row)) {
        headers.add(header);
      }

      return headers;
    }, new Set<string>()),
  );
}

export function validateGeneratePdfRequest(
  input: unknown,
): Result<ValidatedGeneratePdfRequest> {
  const parsed = generatePdfRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: [
        {
          code: "generate_invalid_request",
          message: "This export request is invalid. Review your CSV and mapping.",
        },
      ],
    };
  }

  const request: GeneratePdfRequest = parsed.data;

  if (request.mode === "paid") {
    return {
      ok: false,
      errors: [
        {
          code: "generate_paid_unavailable",
          message: "Paid export is not available yet.",
        },
      ],
    };
  }

  const template = getTemplateById(request.templateId);

  if (!template) {
    return {
      ok: false,
      errors: [
        {
          code: "generate_unknown_template",
          message: "Choose a valid template before exporting.",
        },
      ],
    };
  }

  if (request.rows.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: "generate_no_rows",
          message: "Upload a CSV with at least one data row before exporting.",
        },
      ],
    };
  }

  if (request.rows.length > BATCH_PDF_LIMITS.maxRowsParsed) {
    return {
      ok: false,
      errors: [
        {
          code: "generate_too_many_rows",
          message: `Upload ${BATCH_PDF_LIMITS.maxRowsParsed} rows or fewer before exporting.`,
        },
      ],
    };
  }

  for (const row of request.rows) {
    for (const value of Object.values(row)) {
      if (value.length > BATCH_PDF_LIMITS.maxFieldLength) {
        return {
          ok: false,
          errors: [
            {
              code: "generate_field_too_long",
              message: `CSV values must be ${BATCH_PDF_LIMITS.maxFieldLength} characters or fewer.`,
            },
          ],
        };
      }
    }
  }

  const headers = getHeadersFromRows(request.rows);
  const mappingResult = validateMapping(template, headers, request.mapping);

  if (!mappingResult.ok) {
    return mappingResult;
  }

  return {
    ok: true,
    value: {
      template,
      templateId: request.templateId,
      rows: request.rows,
      rowsForExport: request.rows.slice(0, BATCH_PDF_LIMITS.freeExportRows),
      mapping: mappingResult.value,
      mode: "free",
    },
  };
}
