import { validateDesignFileMetadata } from "@/lib/batch-pdf/custom/design-file";
import {
  getRowsForFreeCustomExport,
  parseCustomExportPayload,
  validateCustomExportPayload,
} from "@/lib/batch-pdf/custom/export-request";
import { runCustomDesignPreflight } from "@/lib/batch-pdf/custom/preflight";
import type { CustomDesignPreflightResult } from "@/lib/batch-pdf/custom/preflight";
import {
  createSeparateFileRenderer,
  isCustomRenderError,
  renderCustomDesignCombinedPdf,
  renderCustomDesignPrintSheets,
} from "@/lib/batch-pdf/custom/compositor";
import { resolveOutputMode } from "@/lib/batch-pdf/custom/export-options";
import { makeSafeCustomPdfFilename } from "@/lib/batch-pdf/custom/custom-filenames";
import { resolveFontSource } from "@/lib/batch-pdf/custom/fonts/server-fonts";
import {
  encodeDesignAsBaselineJpeg,
  normalizeDesignImageBytes,
} from "@/lib/batch-pdf/custom/design-image";
import {
  createPreflightReportCsv,
  PREFLIGHT_REPORT_FILENAME,
} from "@/lib/batch-pdf/custom/export-report";
import { createPdfZip, createPdfZipStream } from "@/lib/batch-pdf/zip";
import { mapWithConcurrency } from "@/lib/batch-pdf/concurrency";
import { getCustomExportConcurrency } from "@/lib/batch-pdf/limits";
import {
  getWorkerPoolSize,
  renderSeparateFilesWithWorkers,
  workersEnabled,
  WORKER_ROW_THRESHOLD,
} from "@/lib/batch-pdf/worker-pool";

export const runtime = "nodejs";

async function trackFlowCompleted(): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  await fetch(`${url}/incr/flows:${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

const SAFE_ERROR =
  "Custom design export is not ready. Fix the highlighted issues and try again.";
const SAFE_RENDER_ERROR =
  "We could not generate your download. Check the highlighted issues and try again.";

function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

function preflightBlockedMessage(preflight: CustomDesignPreflightResult): string {
  const issue = preflight.issues.find((candidate) => candidate.severity === "error");
  if (!issue) return SAFE_ERROR;

  if (issue.code === "unsupported_characters") {
    const row = typeof issue.rowIndex === "number" ? `Row ${issue.rowIndex + 1}` : "A row";
    const field = issue.fieldLabel ? `, field "${issue.fieldLabel}"` : "";
    const font = issue.fontFamily ? ` with "${issue.fontFamily}"` : "";
    const codes = issue.unsupportedCodePoints?.length
      ? ` (${issue.unsupportedCodePoints.join(", ")})`
      : "";
    const recommendations = issue.recommendedFonts?.length
      ? ` Try ${issue.recommendedFonts.join(", ")} for that field.`
      : " Choose a different font for that field.";
    return `${row}${field} contains characters that cannot be printed${font}${codes}.${recommendations}`;
  }

  if (issue.code === "text_overflow") {
    return issue.message;
  }

  return SAFE_ERROR;
}

function renderErrorMessage(error: unknown): string {
  if (!isCustomRenderError(error)) return SAFE_RENDER_ERROR;

  if (error.code === "unsupported_characters") {
    const field = error.fieldLabel ? `Field "${error.fieldLabel}"` : "A field";
    const font = error.fontFamily ? ` with "${error.fontFamily}"` : "";
    const codes = error.unsupportedCodePoints?.length
      ? ` (${error.unsupportedCodePoints.join(", ")})`
      : "";
    return `${field} contains characters that cannot be printed${font}${codes}. Choose a different font for that field.`;
  }

  return error.message;
}

async function ensureExportFontsAvailable(
  fieldBoxes: Parameters<typeof renderCustomDesignCombinedPdf>[0]["fieldBoxes"],
): Promise<Response | null> {
  const seen = new Set<string>();

  for (const box of fieldBoxes) {
    const key = `${box.style.fontFamily}/${box.style.fontWeight}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const source = await resolveFontSource(box.style.fontFamily, box.style.fontWeight);
    if (source.kind === "unavailable") {
      return jsonError(
        `The font "${box.style.fontFamily}" could not be loaded for export. Try again or choose a different font.`,
      );
    }
  }

  return null;
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
    // Re-encode progressive/CMYK JPEGs to baseline so the design renders in the
    // PDF instead of embedding as an undecodable image. Done once here, then
    // reused for every row. PNGs remain lossless.
    designBytes = normalizeDesignImageBytes(new Uint8Array(buffer));
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
    return jsonError(preflightBlockedMessage(preflight));
  }

  const fontError = await ensureExportFontsAvailable(payload.fieldBoxes);
  if (fontError) return fontError;

  trackFlowCompleted().catch(() => {});

  const outputMode = resolveOutputMode(payload.exportOptions);
  const includeReport = payload.exportOptions.includeOverflowReport;

  // Optional baseline-JPEG background: re-encode the image once so pdf-lib
  // embeds it directly via DCTDecode (no per-document deflate). Falls back to
  // the original image if conversion fails, so export never breaks.
  let renderDesignBytes = designBytes;
  let renderDesignAsset = payload.designAsset;

  if (payload.exportOptions.backgroundEncoding === "baselineJpeg") {
    const jpegBytes = await encodeDesignAsBaselineJpeg(designBytes);
    if (jpegBytes) {
      renderDesignBytes = jpegBytes;
      renderDesignAsset = { ...payload.designAsset, kind: "jpeg" };
    }
  }

  // Render PDFs according to the selected layout mode, then ZIP.
  try {
    // Default fast path: one combined multi-page PDF for one-per-page exports.
    // Background + fonts are embedded once for the whole batch. When no report
    // is requested we can return the bare PDF; otherwise the report CSV forces
    // a ZIP wrapper since a single PDF cannot carry it.
    if (
      payload.exportOptions.layoutMode === "onePerPage" &&
      outputMode === "combinedPdf"
    ) {
      const combinedBytes = await renderCustomDesignCombinedPdf({
        designBytes: renderDesignBytes,
        designAsset: renderDesignAsset,
        rows: cappedRows,
        fieldBoxes: payload.fieldBoxes,
        exportOptions: payload.exportOptions,
      });

      if (!includeReport) {
        return new Response(Buffer.from(combinedBytes), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition":
              'attachment; filename="batch-pdf-custom-export.pdf"',
          },
        });
      }

      const csv = createPreflightReportCsv({ result: preflight });
      const zipBytes = await createPdfZip([
        { filename: "batch-pdf-custom-export.pdf", bytes: combinedBytes },
        {
          filename: PREFLIGHT_REPORT_FILENAME,
          bytes: new TextEncoder().encode(csv),
        },
      ]);

      return new Response(Buffer.from(zipBytes), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition":
            'attachment; filename="batch-pdf-custom-export.zip"',
        },
      });
    }

    // Separate files with a single row and no report is just one PDF — skip the
    // ZIP wrapper and return the bare PDF (the client names it from the headers).
    if (
      payload.exportOptions.layoutMode === "onePerPage" &&
      cappedRows.length === 1 &&
      !includeReport
    ) {
      const renderer = await createSeparateFileRenderer({
        designBytes: renderDesignBytes,
        designAsset: renderDesignAsset,
        fieldBoxes: payload.fieldBoxes,
        exportOptions: payload.exportOptions,
      });
      const bytes = await renderer.renderRow(cappedRows[0]);
      const filename = makeSafeCustomPdfFilename({
        index: 1,
        row: cappedRows[0],
        exportOptions: payload.exportOptions,
      });

      return new Response(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Separate files: embed the background once into a base document and clone
    // it per row, then stream each PDF straight into the ZIP so we never hold
    // every per-row document (nor the whole archive) in memory at once.
    if (payload.exportOptions.layoutMode === "onePerPage") {
      const useWorkers =
        workersEnabled() && cappedRows.length >= WORKER_ROW_THRESHOLD;

      const zipStream = createPdfZipStream(async (append) => {
        const appendRow = (index: number, bytes: Uint8Array) =>
          append(
            makeSafeCustomPdfFilename({
              index: index + 1,
              row: cappedRows[index],
              exportOptions: payload.exportOptions,
            }),
            bytes,
          );

        if (useWorkers) {
          // Spread rendering across CPU cores; each worker streams PDFs back.
          await renderSeparateFilesWithWorkers({
            designBytes: renderDesignBytes,
            designAsset: renderDesignAsset,
            fieldBoxes: payload.fieldBoxes,
            exportOptions: payload.exportOptions,
            rows: cappedRows,
            poolSize: getWorkerPoolSize(),
            onResult: appendRow,
          });
        } else {
          const renderer = await createSeparateFileRenderer({
            designBytes: renderDesignBytes,
            designAsset: renderDesignAsset,
            fieldBoxes: payload.fieldBoxes,
            exportOptions: payload.exportOptions,
          });

          // Bound concurrency to cap how many per-row documents exist at once.
          await mapWithConcurrency(
            cappedRows,
            getCustomExportConcurrency(),
            async (row, index) => {
              const bytes = await renderer.renderRow(row);
              appendRow(index, bytes);
            },
          );
        }

        if (includeReport) {
          const csv = createPreflightReportCsv({ result: preflight });
          append(PREFLIGHT_REPORT_FILENAME, new TextEncoder().encode(csv));
        }
      });

      return new Response(zipStream, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition":
            'attachment; filename="batch-pdf-custom-export.zip"',
        },
      });
    }

    // Print sheets: a single multi-page PDF. Return it bare unless the report is
    // requested, in which case the two files are bundled into a ZIP.
    const sheetBytes = await renderCustomDesignPrintSheets({
      designBytes: renderDesignBytes,
      designAsset: renderDesignAsset,
      rows: cappedRows,
      fieldBoxes: payload.fieldBoxes,
      exportOptions: payload.exportOptions,
    });

    if (!includeReport) {
      return new Response(Buffer.from(sheetBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'attachment; filename="custom-print-sheets.pdf"',
        },
      });
    }

    const csv = createPreflightReportCsv({ result: preflight });
    const zipBytes = await createPdfZip([
      { filename: "custom-print-sheets.pdf", bytes: sheetBytes },
      {
        filename: PREFLIGHT_REPORT_FILENAME,
        bytes: new TextEncoder().encode(csv),
      },
    ]);

    return new Response(Buffer.from(zipBytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="batch-pdf-custom-export.zip"',
      },
    });
  } catch (error) {
    return jsonError(renderErrorMessage(error), isCustomRenderError(error) ? 400 : 500);
  }
}
