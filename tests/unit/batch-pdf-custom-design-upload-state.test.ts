import { describe, expect, it } from "vitest";
import {
  createEmptyCustomDesignState,
  isCustomDesignExportReady,
  isCustomDesignPreviewReady,
  resetCustomDesignState,
  type CustomDesignState,
} from "../../lib/batch-pdf/custom/design-upload-state.ts";

function readyState(): CustomDesignState {
  return {
    ...createEmptyCustomDesignState(),
    asset: {
      kind: "png",
      fileName: "design.png",
      sizeBytes: 100,
      selectedPageIndex: 0,
      intrinsicWidth: 100,
      intrinsicHeight: 50,
      intrinsicUnit: "px",
      aspectRatio: 2,
    },
    previewStatus: "ready",
  };
}

describe("custom design upload state helpers", () => {
  it("initial custom design state is empty", () => {
    expect(createEmptyCustomDesignState()).toEqual({
      file: null,
      asset: null,
      previewUrl: null,
      previewStatus: "idle",
      errors: [],
      warnings: [],
    });
  });

  it("reset custom design state clears file, asset, preview URL, errors, and warnings", () => {
    expect(resetCustomDesignState()).toEqual(createEmptyCustomDesignState());
  });

  it("custom design readiness is true only when a valid asset is present", () => {
    expect(isCustomDesignPreviewReady(readyState())).toBe(true);
    expect(isCustomDesignPreviewReady(createEmptyCustomDesignState())).toBe(false);
    expect(
      isCustomDesignPreviewReady({
        ...readyState(),
        previewStatus: "error",
      }),
    ).toBe(false);
  });

  it("custom design export readiness remains false in Phase 8", () => {
    expect(isCustomDesignExportReady(readyState())).toBe(false);
  });
});
