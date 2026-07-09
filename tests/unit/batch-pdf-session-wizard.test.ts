import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearSessionWizard,
  loadSessionWizard,
  resolveRestoredWizardStep,
  saveSessionWizard,
  SESSION_WIZARD_KEY,
  type StoredWizardState,
} from "../../lib/batch-pdf/session-wizard.ts";
import { createDefaultExportOptions } from "../../lib/batch-pdf/custom/export-options.ts";
import { createDefaultCsvFieldBox } from "../../lib/batch-pdf/custom/field-box-state.ts";
import type { DesignAsset } from "../../lib/batch-pdf/custom/types.ts";

function installSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  });
  return store;
}

function makeImageDesign(overrides: Partial<DesignAsset> = {}): DesignAsset {
  return {
    kind: "png",
    fileName: "design.png",
    sizeBytes: 80000,
    selectedPageIndex: 0,
    intrinsicWidth: 1000,
    intrinsicHeight: 1000,
    intrinsicUnit: "px",
    aspectRatio: 1,
    ...overrides,
  };
}

function makeStoredWizardState(overrides: Partial<StoredWizardState> = {}): StoredWizardState {
  const fieldBox = createDefaultCsvFieldBox({ column: "name", existingBoxes: [] });
  return {
    step: "preview",
    csvFileName: "people.csv",
    csvHeaders: ["name"],
    fieldBoxes: [fieldBox],
    selectedFieldBoxId: fieldBox.id,
    exportOptions: {
      ...createDefaultExportOptions(),
      itemSizeMode: "custom",
      customItemWidth: 4,
      customItemHeight: 3,
      unit: "in",
    },
    lockAspectRatio: false,
    designAsset: makeImageDesign(),
    builtInDesignId: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("session wizard persistence", () => {
  it("round-trips serializable wizard state", () => {
    installSessionStorage();
    const state = makeStoredWizardState();

    saveSessionWizard(state);
    const loaded = loadSessionWizard();

    expect(loaded).toMatchObject({
      step: "preview",
      csvFileName: "people.csv",
      csvHeaders: ["name"],
      selectedFieldBoxId: state.selectedFieldBoxId,
      lockAspectRatio: false,
      designAsset: { fileName: "design.png" },
    });
    expect(loaded?.fieldBoxes).toHaveLength(1);
    expect(loaded?.exportOptions.customItemWidth).toBe(4);
  });

  it("clears stored wizard state", () => {
    const store = installSessionStorage();
    saveSessionWizard(makeStoredWizardState());

    clearSessionWizard();

    expect(store.has(SESSION_WIZARD_KEY)).toBe(false);
    expect(loadSessionWizard()).toBeNull();
  });

  it("returns null for invalid stored JSON", () => {
    const store = installSessionStorage();
    store.set(SESSION_WIZARD_KEY, "{not-json");

    expect(loadSessionWizard()).toBeNull();
  });

  it("drops invalid stored design metadata instead of trusting stale payloads", () => {
    const store = installSessionStorage();
    store.set(
      SESSION_WIZARD_KEY,
      JSON.stringify({
        ...makeStoredWizardState(),
        designAsset: { fileName: "certificate-classic.png" },
      }),
    );

    expect(loadSessionWizard()?.designAsset).toBeNull();
  });

  it("sends restored uploaded designs back to setup so the file can be re-added", () => {
    expect(
      resolveRestoredWizardStep(
        makeStoredWizardState({
          step: "preview",
          designAsset: makeImageDesign(),
          builtInDesignId: null,
        }),
      ),
    ).toBe("setup-design");
  });

  it("keeps built-in designs on their restored step because the file can be reloaded", () => {
    expect(
      resolveRestoredWizardStep(
        makeStoredWizardState({
          step: "preview",
          designAsset: makeImageDesign({ fileName: "certificate-classic.png" }),
          builtInDesignId: "certificate-classic",
        }),
      ),
    ).toBe("preview");
  });
});
