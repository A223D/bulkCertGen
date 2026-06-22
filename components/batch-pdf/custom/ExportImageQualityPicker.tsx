"use client";

import { ControlGroup, SegmentedControl } from "./exportControls";
import type { ExportOptions } from "@/lib/batch-pdf/custom/types";

type BackgroundEncoding = NonNullable<ExportOptions["backgroundEncoding"]>;

export function ExportImageQualityPicker({
  value,
  onChange,
}: {
  value: BackgroundEncoding;
  onChange: (value: BackgroundEncoding) => void;
}) {
  return (
    <ControlGroup
      label="Image quality"
      hint="Best keeps your PNG lossless. Smaller re-encodes it as JPEG for much smaller, faster files (slightly lower quality)."
    >
      <SegmentedControl<BackgroundEncoding>
        ariaLabel="Background image quality"
        value={value}
        onChange={onChange}
        options={[
          { value: "preservePng", label: "Best (PNG)" },
          { value: "baselineJpeg", label: "Smaller (JPEG)" },
        ]}
      />
    </ControlGroup>
  );
}
