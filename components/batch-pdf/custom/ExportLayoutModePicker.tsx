"use client";

import { ControlGroup, SegmentedControl } from "./exportControls";
import type { ExportOptions } from "@/lib/batch-pdf/custom/types";

type LayoutMode = ExportOptions["layoutMode"];

export function ExportLayoutModePicker({
  value,
  onChange,
}: {
  value: LayoutMode;
  onChange: (value: LayoutMode) => void;
}) {
  return (
    <ControlGroup label="Layout">
      <SegmentedControl<LayoutMode>
        ariaLabel="Layout mode"
        value={value}
        onChange={onChange}
        options={[
          { value: "onePerPage", label: "One per page" },
          { value: "fitMultiplePerPage", label: "Several on a page (to cut out)" },
        ]}
      />
    </ControlGroup>
  );
}
