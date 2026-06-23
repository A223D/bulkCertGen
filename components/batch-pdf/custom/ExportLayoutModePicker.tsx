"use client";

import { ControlGroup, SegmentedControl } from "./exportControls";
import type { ExportOptions } from "@/lib/batch-pdf/custom/types";

type LayoutMode = ExportOptions["layoutMode"];

export function ExportLayoutModePicker({
  value,
  onChange,
  recommendedValue,
  recommendationReason,
}: {
  value: LayoutMode;
  onChange: (value: LayoutMode) => void;
  recommendedValue?: LayoutMode;
  recommendationReason?: string;
}) {
  const labelFor = (mode: LayoutMode, base: string) =>
    mode === recommendedValue ? `${base} (recommended)` : base;

  return (
    <ControlGroup label="Layout" hint={recommendationReason}>
      <SegmentedControl<LayoutMode>
        ariaLabel="Layout mode"
        value={value}
        onChange={onChange}
        options={[
          { value: "onePerPage", label: labelFor("onePerPage", "One per page") },
          {
            value: "fitMultiplePerPage",
            label: labelFor("fitMultiplePerPage", "Several on a page (to cut out)"),
          },
        ]}
      />
    </ControlGroup>
  );
}
