"use client";

import { useCallback } from "react";
import { ExportLayoutModePicker } from "./ExportLayoutModePicker";
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
};

export function CustomExportOptionsPanel({ exportOptions, design, csvHeaders, onChange }: Props) {
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
            // Keep output mode aligned with the chosen layout for the route.
            outputMode:
              layoutMode === "fitMultiplePerPage" ? "printSheetsZip" : "individualPdfsZip",
          })
        }
      />

      <ItemSizeControls options={exportOptions} isImageDesign={isImageDesign} onChange={patch} />

      {isPrintSheets ? (
        <>
          <PageSizeControls options={exportOptions} onChange={patch} />
          <SheetSpacingControls options={exportOptions} onChange={patch} />
        </>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Each row becomes its own PDF at the item size above.
        </p>
      )}

      <FilenameColumnControl options={exportOptions} csvHeaders={csvHeaders} onChange={patch} />

      <ExportAddOnsControl options={exportOptions} showCropMarks onChange={patch} />
    </section>
  );
}
