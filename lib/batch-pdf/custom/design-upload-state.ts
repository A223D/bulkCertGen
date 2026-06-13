import type { BatchPdfError, BatchPdfWarning } from "../types.ts";
import type { DesignAsset } from "./types.ts";

export type CustomDesignPreviewStatus = "idle" | "loading" | "ready" | "error";

export type CustomDesignState = {
  file: File | null;
  asset: DesignAsset | null;
  previewUrl: string | null;
  previewStatus: CustomDesignPreviewStatus;
  errors: BatchPdfError[];
  warnings: BatchPdfWarning[];
};

export function createEmptyCustomDesignState(): CustomDesignState {
  return {
    file: null,
    asset: null,
    previewUrl: null,
    previewStatus: "idle",
    errors: [],
    warnings: [],
  };
}

export function resetCustomDesignState(): CustomDesignState {
  return createEmptyCustomDesignState();
}

export function isCustomDesignPreviewReady(state: CustomDesignState): boolean {
  return Boolean(state.asset) && state.previewStatus === "ready" && state.errors.length === 0;
}

export function isCustomDesignExportReady(_state: CustomDesignState): boolean {
  return false;
}
