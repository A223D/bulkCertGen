"use client";

import { CustomDesignPreview } from "./CustomDesignPreview";
import { CustomDesignUpload } from "./CustomDesignUpload";
import type { BatchPdfError } from "@/lib/batch-pdf/types";
import type {
  CustomDesignPreviewStatus,
  CustomDesignState,
} from "@/lib/batch-pdf/custom/design-upload-state";
import type { DesignAsset } from "@/lib/batch-pdf/custom/types";

type CustomDesignSetupPanelProps = {
  state: CustomDesignState;
  onAcceptedFile: (file: File) => void;
  onRejectedFile: (errors: BatchPdfError[]) => void;
  onReset: () => void;
  onAssetReady: (asset: DesignAsset) => void;
  onPreviewUrlChange: (previewUrl: string | null) => void;
  onPreviewStatusChange: (status: CustomDesignPreviewStatus) => void;
  onErrorsChange: (errors: BatchPdfError[]) => void;
};

export function CustomDesignSetupPanel({
  state,
  onAcceptedFile,
  onRejectedFile,
  onReset,
  onAssetReady,
  onPreviewUrlChange,
  onPreviewStatusChange,
  onErrorsChange,
}: CustomDesignSetupPanelProps) {
  return (
    <div className="space-y-6">
      <CustomDesignUpload
        state={state}
        onAcceptedFile={onAcceptedFile}
        onRejectedFile={onRejectedFile}
        onReset={onReset}
      />
      <CustomDesignPreview
        file={state.file}
        previewUrl={state.previewUrl}
        previewStatus={state.previewStatus}
        onAssetReady={onAssetReady}
        onPreviewUrlChange={onPreviewUrlChange}
        onStatusChange={onPreviewStatusChange}
        onErrorsChange={onErrorsChange}
      />
      <section className="rounded-lg border border-line bg-panel p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Add fields
        </p>
        <h2 className="mt-2 text-lg font-semibold">Field placement comes next</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This phase only uploads and previews your design. Dragging CSV fields onto the design is planned for the next phase.
        </p>
      </section>
    </div>
  );
}
