import { describe, expect, it } from "vitest";
import {
  DESKTOP_MIN_WIDTH,
  FORCE_DESKTOP_STORAGE_KEY,
  LARGE_TABLET_MAX_WIDTH,
  readForceDesktop,
  resolveGateStatus,
} from "@/lib/desktop-gate";

const base = { mounted: true, meetsWidth: true, isCoarseSmall: false, overridden: false };

describe("constants", () => {
  it("pins the documented threshold values", () => {
    expect(DESKTOP_MIN_WIDTH).toBe(1024);
    expect(LARGE_TABLET_MAX_WIDTH).toBe(1280);
    expect(FORCE_DESKTOP_STORAGE_KEY).toBe("batch_pdf_force_desktop_v1");
  });
});

describe("resolveGateStatus", () => {
  it("is pending until mounted, regardless of other inputs", () => {
    expect(resolveGateStatus({ ...base, mounted: false })).toBe("pending");
    expect(resolveGateStatus({ ...base, mounted: false, meetsWidth: false })).toBe("pending");
  });

  it("is desktop on a wide, fine-pointer viewport", () => {
    expect(resolveGateStatus(base)).toBe("desktop");
  });

  it("is blocked on a narrow viewport", () => {
    expect(resolveGateStatus({ ...base, meetsWidth: false })).toBe("blocked");
  });

  it("is blocked on a wide but coarse-pointer small device (large tablet)", () => {
    expect(resolveGateStatus({ ...base, isCoarseSmall: true })).toBe("blocked");
  });

  it("is desktop when overridden, even on a narrow coarse device", () => {
    expect(
      resolveGateStatus({ mounted: true, meetsWidth: false, isCoarseSmall: true, overridden: true }),
    ).toBe("desktop");
  });
});

describe("readForceDesktop", () => {
  it("returns false when storage is unavailable (node env)", () => {
    expect(readForceDesktop()).toBe(false);
  });
});
