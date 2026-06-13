import {
  formatAspectRatio,
  formatFileSize,
} from "@/lib/batch-pdf/custom/design-asset";
import type { DesignAsset } from "@/lib/batch-pdf/custom/types";

type CustomDesignMetadataPanelProps = {
  asset: DesignAsset | null;
};

function formatDimension(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function CustomDesignMetadataPanel({
  asset,
}: CustomDesignMetadataPanelProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4" aria-labelledby="custom-design-metadata-heading">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Design metadata
      </p>
      <h2 id="custom-design-metadata-heading" className="mt-2 text-lg font-semibold">
        File details
      </h2>

      {!asset ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Upload a design file to read dimensions, aspect ratio, and page details.
        </p>
      ) : (
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium uppercase text-ink">{asset.kind}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
            <dt className="text-muted-foreground">Size</dt>
            <dd className="font-medium text-ink">{formatFileSize(asset.sizeBytes)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
            <dt className="text-muted-foreground">Dimensions</dt>
            <dd className="font-medium text-ink">
              {formatDimension(asset.intrinsicWidth)} x {formatDimension(asset.intrinsicHeight)} {asset.intrinsicUnit}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
            <dt className="text-muted-foreground">Aspect ratio</dt>
            <dd className="font-medium text-ink">{formatAspectRatio(asset.aspectRatio)}</dd>
          </div>
          {asset.kind === "pdf" ? (
            <>
              <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
                <dt className="text-muted-foreground">PDF pages</dt>
                <dd className="font-medium text-ink">{asset.pageCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
                <dt className="text-muted-foreground">Selected page</dt>
                <dd className="font-medium text-ink">Page {asset.selectedPageIndex + 1}</dd>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
              <dt className="text-muted-foreground">Selected page</dt>
              <dd className="font-medium text-ink">Page 1</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
