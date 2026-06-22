"use client";

import { ControlGroup } from "./exportControls";
import { Select } from "@/components/ui/select";
import type { ExportOptions } from "@/lib/batch-pdf/custom/types";

const AUTO_VALUE = "__auto__";

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
      <Select
        aria-label="Filename column"
        value={options.filenameColumn ?? AUTO_VALUE}
        onValueChange={(value) =>
          onChange({ filenameColumn: value === AUTO_VALUE ? undefined : value })
        }
        options={[
          { value: AUTO_VALUE, label: "Automatic" },
          ...csvHeaders.map((header) => ({ value: header, label: header })),
        ]}
      />
    </ControlGroup>
  );
}
