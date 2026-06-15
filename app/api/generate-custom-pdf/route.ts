import { validateDesignFileMetadata } from "@/lib/batch-pdf/custom/design-file";
import {
  getRowsForFreeCustomExport,
  parseCustomExportPayload,
  validateCustomExportPayload,
} from "@/lib/batch-pdf/custom/export-request";
import { runCustomDesignPreflight } from "@/lib/batch-pdf/custom/preflight";
import { renderCustomDesignPdfForRow } from "@/lib/batch-pdf/custom/compositor";
import { makeSafeCustomPdfFilename } from "@/lib/batch-pdf/custom/custom-filenames";
import { createPdfZip } from "@/lib/batch-pdf/zip";

export const runtime = "nodejs";

const SAFE_ERROR =
  "Custom design export is not ready. Fix the highlighted issues and try again.";
const SAFE_RENDER_ERROR =
  "We could not generate this ZIP. Try again with fewer rows.";

function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError(SAFE_ERROR);
  }

  const designFile = formData.get("designFile");
  const payloadRaw = formData.get("payload");

  if (!(designFile instanceof File)) {
    return jsonError(SAFE_ERROR);
  }

  if (typeof payloadRaw !== "string") {
    return jsonError(SAFE_ERROR);
  }

  // Validate file metadata before reading bytes.
  const fileMetaResult = validateDesignFileMetadata({
    fileName: designFile.name,
    sizeBytes: designFile.size,
    mimeType: designFile.type || undefined,
  });

  if (!fileMetaResult.ok) {
    return jsonError(fileMetaResult.errors[0]?.message ?? SAFE_ERROR);
  }

  // Parse and validate payload shape.
  let parsed: unknown;

  try {
    parsed = JSON.parse(payloadRaw);
  } catch {
    return jsonError(SAFE_ERROR);
  }

  const parseResult = parseCustomExportPayload(parsed);

  if (!parseResult.ok) {
    return jsonError(parseResult.errors[0]?.message ?? SAFE_ERROR);
  }

  const validationResult = validateCustomExportPayload(parseResult.value);

  if (!validationResult.ok) {
    return jsonError(validationResult.errors[0]?.message ?? SAFE_ERROR);
  }

  const payload = validationResult.value;

  // Read design file bytes only after all shape/metadata checks pass.
  let designBytes: Uint8Array;

  try {
    const buffer = await designFile.arrayBuffer();
    designBytes = new Uint8Array(buffer);
  } catch {
    return jsonError(SAFE_ERROR);
  }

  const cappedRows = getRowsForFreeCustomExport(payload.rows);

  // Run server-side preflight on the capped row set before rendering.
  const preflightResult = runCustomDesignPreflight({
    design: payload.designAsset,
    rows: cappedRows,
    fieldBoxes: payload.fieldBoxes,
    exportOptions: payload.exportOptions,
    csvHeaders: payload.csvHeaders,
  });

  if (!preflightResult.ok) {
    return jsonError(SAFE_ERROR);
  }

  const preflight = preflightResult.value;

  if (preflight.status === "blocked" || preflight.status === "needsOutputSize") {
    return jsonError(SAFE_ERROR);
  }

  // Render one PDF per row, then ZIP.
  try {
    const files = await Promise.all(
      cappedRows.map(async (row, index) => {
        const bytes = await renderCustomDesignPdfForRow({
          designBytes,
          designAsset: payload.designAsset,
          row,
          fieldBoxes: payload.fieldBoxes,
          exportOptions: payload.exportOptions,
        });

        return {
          filename: makeSafeCustomPdfFilename({
            index: index + 1,
            row,
            exportOptions: payload.exportOptions,
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
          'attachment; filename="batch-pdf-custom-export.zip"',
      },
    });
  } catch {
    return jsonError(SAFE_RENDER_ERROR, 500);
  }
}
