"use client";

import { ControlGroup, SegmentedControl } from "./exportControls";
import type { ExportOptions } from "@/lib/batch-pdf/custom/types";

type OutputMode = NonNullable<ExportOptions["outputMode"]>;

export function ExportOutputModePicker({
  value,
  onChange,
}: {
  value: OutputMode;
  onChange: (value: OutputMode) => void;
}) {
  return (
    <ControlGroup
      label="Output"
      hint="A single combined PDF is fastest and smallest. Choose separate files if you need one PDF per row."
    >
      <SegmentedControl<OutputMode>
        ariaLabel="Output format"
        value={value}
        onChange={onChange}
        options={[
          { value: "combinedPdf", label: "Single combined PDF" },
          { value: "separateFiles", label: "Separate files (ZIP)" },
        ]}
      />
    </ControlGroup>
  );
}
