"use client";

import { Checkbox } from "./exportControls";
import type { ExportOptions } from "@/lib/batch-pdf/custom/types";

export function ExportAddOnsControl({
  options,
  showCropMarks,
  onChange,
}: {
  options: ExportOptions;
  showCropMarks: boolean;
  onChange: (patch: Partial<ExportOptions>) => void;
}) {
  return (
    <div className="space-y-2.5">
      {showCropMarks ? (
        <Checkbox
          label="Add crop marks"
          hint="Draws trim guides around each item — useful when cutting print sheets."
          checked={options.cropMarks}
          onChange={(cropMarks) => onChange({ cropMarks })}
        />
      ) : null}
      <Checkbox
        label="Include preflight report"
        hint="Adds a privacy-safe CSV summary of any text-fit issues to the ZIP."
        checked={options.includeOverflowReport}
        onChange={(includeOverflowReport) => onChange({ includeOverflowReport })}
      />
    </div>
  );
}
