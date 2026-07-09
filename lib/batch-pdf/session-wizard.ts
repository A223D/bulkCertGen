import type { CustomFieldBox, DesignAsset, ExportOptions } from "./custom/types.ts";

export const SESSION_WIZARD_KEY = "batch_pdf_wizard_v1";

export type StoredWizardStep =
  | "choose-design"
  | "setup-design"
  | "mapping"
  | "preview"
  | "export-options"
  | "export";

export type StoredWizardState = {
  step: StoredWizardStep;
  csvFileName: string;
  csvHeaders: string[];
  fieldBoxes: CustomFieldBox[];
  selectedFieldBoxId: string | null;
  exportOptions: ExportOptions;
  lockAspectRatio: boolean;
  designAsset: DesignAsset | null;
  builtInDesignId: string | null;
};

const VALID_STEPS = new Set<StoredWizardStep>([
  "choose-design",
  "setup-design",
  "mapping",
  "preview",
  "export-options",
  "export",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isStoredDesignAsset(value: unknown): value is DesignAsset {
  if (!isPlainObject(value)) return false;

  return (
    (value.kind === "png" || value.kind === "jpeg") &&
    typeof value.fileName === "string" &&
    typeof value.sizeBytes === "number" &&
    Number.isFinite(value.sizeBytes) &&
    value.sizeBytes >= 0 &&
    typeof value.selectedPageIndex === "number" &&
    Number.isInteger(value.selectedPageIndex) &&
    value.selectedPageIndex >= 0 &&
    isPositiveFiniteNumber(value.intrinsicWidth) &&
    isPositiveFiniteNumber(value.intrinsicHeight) &&
    isPositiveFiniteNumber(value.aspectRatio) &&
    value.intrinsicUnit === "px"
  );
}

export function resolveRestoredWizardStep(state: Pick<StoredWizardState, "step" | "designAsset" | "builtInDesignId">): StoredWizardStep {
  if (
    state.designAsset &&
    !state.builtInDesignId &&
    state.step !== "choose-design"
  ) {
    return "setup-design";
  }

  return state.step;
}

export function saveSessionWizard(state: StoredWizardState): void {
  try {
    sessionStorage.setItem(SESSION_WIZARD_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

export function loadSessionWizard(): StoredWizardState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_WIZARD_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!isPlainObject(data)) return null;
    if (typeof data.step !== "string" || !VALID_STEPS.has(data.step as StoredWizardStep)) return null;
    if (typeof data.csvFileName !== "string") return null;
    if (!Array.isArray(data.csvHeaders) || !data.csvHeaders.every((header) => typeof header === "string")) return null;
    if (!Array.isArray(data.fieldBoxes)) return null;
    if (!isPlainObject(data.exportOptions)) return null;

    return {
      step: data.step as StoredWizardStep,
      csvFileName: data.csvFileName,
      csvHeaders: data.csvHeaders,
      fieldBoxes: data.fieldBoxes as CustomFieldBox[],
      selectedFieldBoxId: typeof data.selectedFieldBoxId === "string" ? data.selectedFieldBoxId : null,
      exportOptions: data.exportOptions as ExportOptions,
      lockAspectRatio: typeof data.lockAspectRatio === "boolean" ? data.lockAspectRatio : true,
      designAsset: isStoredDesignAsset(data.designAsset) ? data.designAsset : null,
      builtInDesignId: typeof data.builtInDesignId === "string" ? data.builtInDesignId : null,
    };
  } catch {
    return null;
  }
}

export function clearSessionWizard(): void {
  try {
    sessionStorage.removeItem(SESSION_WIZARD_KEY);
  } catch {
    return;
  }
}
