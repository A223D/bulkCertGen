"use client";

import { ControlGroup, inputClass } from "./exportControls";
import type { ExportOptions } from "@/lib/batch-pdf/custom/types";

export function FilenameColumnControl({
  options,
  csvHeaders,
  onChange,
}: {
  options: ExportOptions;
  csvHeaders: string[];
  onChange: (patch: Partial<ExportOptions>) => void;
}) {
  return (
    <ControlGroup
      label="Filename column"
      hint="Used to name each PDF. Defaults to a safe name when left automatic."
    >
      <select
        aria-label="Filename column"
        value={options.filenameColumn ?? ""}
        onChange={(event) =>
          onChange({ filenameColumn: event.target.value === "" ? undefined : event.target.value })
        }
        className={inputClass}
      >
        <option value="">Automatic</option>
        {csvHeaders.map((header) => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
    </ControlGroup>
  );
}
