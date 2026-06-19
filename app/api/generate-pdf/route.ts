import { makeSafePdfFilename } from "@/lib/batch-pdf/filenames";
import { mapRowToTemplateData } from "@/lib/batch-pdf/mapping";
import { renderPdfForTemplate } from "@/lib/batch-pdf/render";
import { validateGeneratePdfRequest } from "@/lib/batch-pdf/validation";
import { createPdfZip } from "@/lib/batch-pdf/zip";

export const runtime = "nodejs";

function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("This export request is invalid. Review your CSV and mapping.");
  }

  const validation = validateGeneratePdfRequest(payload);

  if (!validation.ok) {
    const firstError = validation.errors[0];
    return jsonError(firstError?.message ?? "Unable to generate this export.", 400);
  }

  try {
    const files = await Promise.all(
      validation.value.rowsForExport.map(async (row, rowIndex) => {
        const data = mapRowToTemplateData(
          row,
          validation.value.mapping,
          validation.value.template,
        );
        const bytes = await renderPdfForTemplate({
          template: validation.value.template,
          data,
        });

        return {
          filename: makeSafePdfFilename({
            templateId: validation.value.templateId,
            index: rowIndex + 1,
            data,
          }),
          bytes,
        };
      }),
    );
    const zipBytes = await createPdfZip(files);

    return new Response(Buffer.from(zipBytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="batch-pdf-free-export.zip"',
      },
    });
  } catch {
    return jsonError("We could not generate this ZIP. Try again with fewer rows.", 500);
  }
}
