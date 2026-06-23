"use client";

import { useCallback } from "react";
import { ExportLayoutModePicker } from "./ExportLayoutModePicker";
import { ExportOutputModePicker } from "./ExportOutputModePicker";
import { ExportImageQualityPicker } from "./ExportImageQualityPicker";
import { PageSizeControls } from "./PageSizeControls";
import { ItemSizeControls } from "./ItemSizeControls";
import { SheetSpacingControls } from "./SheetSpacingControls";
import { FilenameColumnControl } from "./FilenameColumnControl";
import { ExportAddOnsControl } from "./ExportAddOnsControl";
import {
  recommendLayoutMode,
  resolveExportItemSizePoints,
} from "@/lib/batch-pdf/custom/export-options";
import type { DesignAsset, ExportOptions } from "@/lib/batch-pdf/custom/types";

type Props = {
  exportOptions: ExportOptions;
  design: DesignAsset;
  csvHeaders: string[];
  onChange: (next: ExportOptions) => void;
  showItemSizeControls?: boolean;
};

export function CustomExportOptionsPanel({
  exportOptions,
  design,
  csvHeaders,
  onChange,
  showItemSizeControls = true,
}: Props) {
  const isImageDesign = design.intrinsicUnit === "px";
  const isPrintSheets = exportOptions.layoutMode === "fitMultiplePerPage";

  // Recommend a layout based on the current finished size so the likely choice
  // is labelled and explained — never a silent default a user accepts blindly.
  const itemSize = resolveExportItemSizePoints({ exportOptions, designAsset: design });
  const recommendation = itemSize.ok
    ? recommendLayoutMode({
        itemWidthPt: itemSize.value.widthPt,
        itemHeightPt: itemSize.value.heightPt,
      })
    : null;
  const recommendationReason =
    recommendation?.mode === "fitMultiplePerPage"
      ? `Your item is small — about ${recommendation.itemsPerLetterSheet} fit on a Letter sheet — so several on a page is the usual choice.`
      : recommendation?.mode === "onePerPage"
        ? "Your item is large enough to fill a page, so one per page is the usual choice."
        : undefined;

  const patch = useCallback(
    (changes: Partial<ExportOptions>) => {
      onChange({ ...exportOptions, ...changes });
    },
    [exportOptions, onChange],
  );

  return (
    <section className="space-y-5 rounded-lg border border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Export options
      </p>

      <p className="rounded-lg border border-warning-line bg-warning-soft px-3 py-2 text-sm leading-6 text-warning">
        Tip: choose one per page for certificates, or several on a page for badges, cards, labels, and tickets you will cut out.
      </p>

      <ExportLayoutModePicker
        value={exportOptions.layoutMode}
        recommendedValue={recommendation?.mode}
        recommendationReason={recommendationReason}
        onChange={(layoutMode) =>
          patch({
            layoutMode,
            // "Same as design" makes the page equal to the item, so no item can
            // fit once margins are applied. Move to a real page size for sheets,
            // and let orientation auto-optimize for the fewest pages.
            ...(layoutMode === "fitMultiplePerPage"
              ? {
                  orientation: "auto" as const,
                  ...(exportOptions.pageSize === "sameAsDesign"
                    ? { pageSize: "letter" as const }
                    : {}),
                }
              : // One per page has no surrounding paper, so crop marks would land
                // on the page edge and be clipped — turn them off when switching.
                { cropMarks: false }),
          })
        }
      />

      {showItemSizeControls ? (
        <ItemSizeControls options={exportOptions} isImageDesign={isImageDesign} onChange={patch} />
      ) : (
        <p className="rounded-lg border border-line bg-muted px-3 py-2 text-sm leading-6 text-muted-foreground">
          The finished size is set on the preview step because it affects text fit.
        </p>
      )}

      {isPrintSheets ? (
        <>
          <PageSizeControls options={exportOptions} onChange={patch} />
          <SheetSpacingControls options={exportOptions} onChange={patch} />
        </>
      ) : (
        <ExportOutputModePicker
          value={exportOptions.outputMode ?? "combinedPdf"}
          onChange={(outputMode) => patch({ outputMode })}
        />
      )}

      {design.kind === "png" ? (
        <ExportImageQualityPicker
          value={exportOptions.backgroundEncoding ?? "preservePng"}
          onChange={(backgroundEncoding) => patch({ backgroundEncoding })}
        />
      ) : null}

      <FilenameColumnControl options={exportOptions} csvHeaders={csvHeaders} onChange={patch} />

      <ExportAddOnsControl options={exportOptions} showCropMarks={isPrintSheets} onChange={patch} />
    </section>
  );
}
