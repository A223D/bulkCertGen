import { describe, expect, it } from "vitest";
import {
  createImageDesignAsset,
  formatAspectRatio,
  formatFileSize,
} from "../../lib/batch-pdf/custom/design-asset.ts";

describe("custom design asset helpers", () => {
  it("creates a PNG design asset from valid dimensions", () => {
    const result = createImageDesignAsset({
      kind: "png",
      fileName: "design.png",
      sizeBytes: 2048,
      intrinsicWidth: 1200,
      intrinsicHeight: 800,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.kind).toBe("png");
      expect(result.value.intrinsicUnit).toBe("px");
      expect(result.value.selectedPageIndex).toBe(0);
      expect(result.value.aspectRatio).toBe(1.5);
    }
  });

  it("creates a JPEG design asset from valid dimensions", () => {
    const result = createImageDesignAsset({
      kind: "jpeg",
      fileName: "design.jpg",
      sizeBytes: 2048,
      intrinsicWidth: 600,
      intrinsicHeight: 900,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.kind).toBe("jpeg");
      expect(result.value.intrinsicUnit).toBe("px");
      expect(result.value.aspectRatio).toBeCloseTo(0.6667, 4);
    }
  });

  it("rejects zero image width", () => {
    const result = createImageDesignAsset({
      kind: "png",
      fileName: "design.png",
      sizeBytes: 1,
      intrinsicWidth: 0,
      intrinsicHeight: 100,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects zero image height", () => {
    const result = createImageDesignAsset({
      kind: "png",
      fileName: "design.png",
      sizeBytes: 1,
      intrinsicWidth: 100,
      intrinsicHeight: 0,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects non-finite dimensions", () => {
    const result = createImageDesignAsset({
      kind: "png",
      fileName: "design.png",
      sizeBytes: 1,
      intrinsicWidth: Number.POSITIVE_INFINITY,
      intrinsicHeight: 100,
    });

    expect(result.ok).toBe(false);
  });

  it("computes aspect ratio correctly", () => {
    const result = createImageDesignAsset({
      kind: "png",
      fileName: "wide.png",
      sizeBytes: 1,
      intrinsicWidth: 1920,
      intrinsicHeight: 1080,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.aspectRatio).toBeCloseTo(16 / 9, 4);
    }
  });

  it("formats file size correctly", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });

  it("formats aspect ratio for display", () => {
    expect(formatAspectRatio(2)).toBe("2:1");
    expect(formatAspectRatio(16 / 9)).toBe("1.78:1");
    expect(formatAspectRatio(Number.NaN)).toBe("Unknown");
  });

  it("returns safe errors", () => {
    const privateContents = "Private Person Sentinel";
    const result = createImageDesignAsset({
      kind: "png",
      fileName: `design-${privateContents}.png`,
      sizeBytes: 1,
      intrinsicWidth: Number.NaN,
      intrinsicHeight: 100,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const messages = result.errors.map((error) => error.message).join(" ");

      expect(messages).not.toContain(privateContents);
      expect(messages).not.toContain("ArrayBuffer");
      expect(messages).not.toContain("Uint8Array");
    }
  });
});
