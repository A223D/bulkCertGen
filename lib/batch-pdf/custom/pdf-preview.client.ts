"use client";

import { createPdfDesignAsset } from "./design-asset.ts";
import type { Result } from "../types.ts";
import type { DesignAsset } from "./types.ts";

const MAX_PREVIEW_EDGE_PX = 900;
const MAX_PREVIEW_SCALE = 1.5;

type PreviewRenderTask = {
  promise: Promise<unknown>;
  cancel: () => void;
};

function safeError(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

export async function renderPdfPreviewToCanvas(args: {
  file: File;
  canvas: HTMLCanvasElement;
}): Promise<Result<DesignAsset>> {
  let renderTask: PreviewRenderTask | null = null;

  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const data = await args.file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    if (pageCount !== 1) {
      await loadingTask.destroy();
      return safeError(
        "custom_design_page_count_unsupported",
        "For now, upload a one-page PDF design.",
      );
    }

    const page = await pdf.getPage(1);
    const intrinsicViewport = page.getViewport({ scale: 1 });
    const longestEdge = Math.max(intrinsicViewport.width, intrinsicViewport.height);
    const scale = Math.min(
      MAX_PREVIEW_SCALE,
      longestEdge > 0 ? MAX_PREVIEW_EDGE_PX / longestEdge : 1,
    );
    const previewViewport = page.getViewport({ scale });
    const canvasContext = args.canvas.getContext("2d");

    if (!canvasContext) {
      await loadingTask.destroy();
      return safeError(
        "custom_design_pdf_preview_failed",
        "PDF preview is unavailable for this file.",
      );
    }

    args.canvas.width = Math.max(1, Math.floor(previewViewport.width));
    args.canvas.height = Math.max(1, Math.floor(previewViewport.height));
    renderTask = page.render({
      canvas: args.canvas,
      canvasContext,
      viewport: previewViewport,
    });
    await renderTask.promise;
    await pdf.cleanup();
    await loadingTask.destroy();

    return createPdfDesignAsset({
      fileName: args.file.name,
      sizeBytes: args.file.size,
      pageCount,
      selectedPageIndex: 0,
      pageWidthPt: intrinsicViewport.width,
      pageHeightPt: intrinsicViewport.height,
    });
  } catch {
    try {
      renderTask?.cancel();
    } catch {
      // Ignore cancellation errors. Users only need a safe preview failure.
    }

    return safeError(
      "custom_design_pdf_preview_failed",
      "PDF preview is unavailable for this file.",
    );
  }
}
