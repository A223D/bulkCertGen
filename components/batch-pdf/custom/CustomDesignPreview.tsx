"use client";

/* eslint-disable @next/next/no-img-element -- Local object URLs cannot be optimized by next/image. */

import { useEffect } from "react";
import {
  createImageDesignAsset,
} from "@/lib/batch-pdf/custom/design-asset";
import { validateDesignFileMetadata } from "@/lib/batch-pdf/custom/design-file";
import type { BatchPdfError } from "@/lib/batch-pdf/types";
import type { DesignAsset } from "@/lib/batch-pdf/custom/types";
import type { CustomDesignPreviewStatus } from "@/lib/batch-pdf/custom/design-upload-state";

type CustomDesignPreviewProps = {
  file: File | null;
  previewUrl: string | null;
  previewStatus: CustomDesignPreviewStatus;
  onAssetReady: (asset: DesignAsset) => void;
  onPreviewUrlChange: (previewUrl: string | null) => void;
  onStatusChange: (status: CustomDesignPreviewStatus) => void;
  onErrorsChange: (errors: BatchPdfError[]) => void;
  hideWhenReady?: boolean;
};

function safeError(code: string, message: string): BatchPdfError {
  return { code, message };
}

export function CustomDesignPreview({
  file,
  previewUrl,
  previewStatus,
  onAssetReady,
  onPreviewUrlChange,
  onStatusChange,
  onErrorsChange,
  hideWhenReady = false,
}: CustomDesignPreviewProps) {
  useEffect(() => {
    if (!file) {
      onPreviewUrlChange(null);
      onStatusChange("idle");
      return;
    }

    let isCancelled = false;
    const metadata = validateDesignFileMetadata({
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });

    if (!metadata.ok) {
      onErrorsChange(metadata.errors);
      onStatusChange("error");
      return;
    }

    onErrorsChange([]);
    onStatusChange("loading");

    const imageKind = metadata.value.kind;
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    onPreviewUrlChange(objectUrl);

    image.onload = () => {
      if (isCancelled) {
        return;
      }

      const asset = createImageDesignAsset({
        kind: imageKind,
        fileName: file.name,
        sizeBytes: file.size,
        intrinsicWidth: image.naturalWidth,
        intrinsicHeight: image.naturalHeight,
      });

      if (!asset.ok) {
        onErrorsChange(asset.errors);
        onStatusChange("error");
        return;
      }

      onAssetReady(asset.value);
      onStatusChange("ready");
    };

    image.onerror = () => {
      if (isCancelled) {
        return;
      }

      onErrorsChange([
        safeError(
          "custom_design_image_dimensions_failed",
          "Image dimensions could not be read. Try exporting the design again.",
        ),
      ]);
      onStatusChange("error");
    };

    image.src = objectUrl;

    return () => {
      isCancelled = true;
      URL.revokeObjectURL(objectUrl);
      onPreviewUrlChange(null);
    };
  }, [
    file,
    onAssetReady,
    onErrorsChange,
    onPreviewUrlChange,
    onStatusChange,
  ]);

  const isLoading = previewStatus === "loading";
  const isReady = previewStatus === "ready";

  if (hideWhenReady && isReady) {
    return null;
  }

  return (
    <section className="rounded-lg border border-line bg-panel p-4" aria-labelledby="custom-design-preview-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preview
          </p>
          <h2 id="custom-design-preview-heading" className="mt-2 text-xl font-semibold">
            Design preview
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Preview runs in your browser. Field placement appears after the design is ready.
          </p>
        </div>
        <span className="w-fit rounded-full border border-line bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Fields next
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-dashed border-line bg-muted">
        {!file ? (
          <div className="flex min-h-80 items-center justify-center p-6 text-center">
            <div className="max-w-sm">
              <p className="text-sm font-semibold text-ink">No design selected</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Upload a PNG, JPG, or JPEG file to preview the design before adding fields.
              </p>
            </div>
          </div>
        ) : null}

        {file ? (
          <div className="relative flex min-h-80 items-center justify-center p-3">
            {isLoading ? (
              <div className="absolute inset-x-3 top-3 rounded-lg border border-line bg-panel/95 px-3 py-2 text-sm text-muted-foreground" role="status">
                Loading design preview...
              </div>
            ) : null}

            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className={[
                  "max-h-[70vh] w-auto max-w-full object-contain shadow-sm",
                  isReady ? "opacity-100" : "opacity-70",
                ].join(" ")}
              />
            ) : null}

            {previewStatus === "error" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted p-6 text-center">
                <div className="max-w-sm">
                  <p className="text-sm font-semibold text-ink">Preview unavailable</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Try a supported PNG, JPG, or JPEG design.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
