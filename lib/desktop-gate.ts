export const DESKTOP_MIN_WIDTH = 1024;
export const LARGE_TABLET_MAX_WIDTH = 1280;
export const FORCE_DESKTOP_STORAGE_KEY = "batch_pdf_force_desktop_v1";

export type GateStatus = "pending" | "desktop" | "blocked";

export type GateInput = {
  mounted: boolean;
  meetsWidth: boolean;
  isCoarseSmall: boolean;
  overridden: boolean;
};

export function resolveGateStatus(input: GateInput): GateStatus {
  if (!input.mounted) return "pending";
  if (input.overridden) return "desktop";
  if (input.meetsWidth && !input.isCoarseSmall) return "desktop";
  return "blocked";
}

export function readForceDesktop(): boolean {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    return window.sessionStorage.getItem(FORCE_DESKTOP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeForceDesktop(): void {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.setItem(FORCE_DESKTOP_STORAGE_KEY, "1");
  } catch {
    // ignore storage failures (private mode, quota) — override is best-effort
  }
}
