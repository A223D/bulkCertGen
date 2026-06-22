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

      <ExportLayoutModePicker
        value={exportOptions.layoutMode}
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
              : {}),
          })
        }
      />

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
        Tip: choose one per page for certificates, or several on a page for badges, cards, labels, and tickets you will cut out.
      </p>

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

      <ExportAddOnsControl options={exportOptions} showCropMarks onChange={patch} />
    </section>
  );
}
