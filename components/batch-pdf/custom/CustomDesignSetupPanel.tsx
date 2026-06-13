"use client";

import { CustomFieldPlacementEditor } from "./CustomFieldPlacementEditor";
import { CustomDesignPreview } from "./CustomDesignPreview";
import { CustomDesignUpload } from "./CustomDesignUpload";
import { isCustomDesignPreviewReady } from "@/lib/batch-pdf/custom/design-upload-state";
import type { BatchPdfError } from "@/lib/batch-pdf/types";
import type {
  CustomDesignPreviewStatus,
  CustomDesignState,
} from "@/lib/batch-pdf/custom/design-upload-state";
import type { CustomFieldBox, DesignAsset } from "@/lib/batch-pdf/custom/types";

type CustomDesignSetupPanelProps = {
  state: CustomDesignState;
  onAcceptedFile: (file: File) => void;
  onRejectedFile: (errors: BatchPdfError[]) => void;
  onReset: () => void;
  onAssetReady: (asset: DesignAsset) => void;
  onPreviewUrlChange: (previewUrl: string | null) => void;
  onPreviewStatusChange: (status: CustomDesignPreviewStatus) => void;
  onErrorsChange: (errors: BatchPdfError[]) => void;
  csvHeaders: string[];
  onFieldBoxesChange: (boxes: CustomFieldBox[]) => void;
  onSelectedFieldBoxChange: (boxId: string | null) => void;
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
  csvHeaders,
  onFieldBoxesChange,
  onSelectedFieldBoxChange,
}: CustomDesignSetupPanelProps) {
  const isReady = isCustomDesignPreviewReady(state);

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
        hideWhenReady={isReady}
      />
      {isReady ? (
        <CustomFieldPlacementEditor
          file={state.file}
          asset={state.asset}
          previewUrl={state.previewUrl}
          csvHeaders={csvHeaders}
          boxes={state.fieldBoxes}
          selectedBoxId={state.selectedFieldBoxId}
          onBoxesChange={onFieldBoxesChange}
          onSelectedBoxChange={onSelectedFieldBoxChange}
        />
      ) : null}
    </div>
  );
}
