import { describe, expect, it } from "vitest";
import { calculateCropMarks } from "../../lib/batch-pdf/custom/crop-marks.ts";

describe("calculateCropMarks", () => {
  it("returns 8 line segments (two per corner)", () => {
    const lines = calculateCropMarks({ xPt: 100, yPt: 100, widthPt: 200, heightPt: 120 });
    expect(lines).toHaveLength(8);
  });

  it("produces only finite, non-negative coordinates", () => {
    const lines = calculateCropMarks({ xPt: 0, yPt: 0, widthPt: 50, heightPt: 50 });
    for (const line of lines) {
      for (const v of [line.x1, line.y1, line.x2, line.y2]) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("uses default mark length and offset", () => {
    const lines = calculateCropMarks({ xPt: 100, yPt: 100, widthPt: 200, heightPt: 100 });
    // Bottom-left horizontal mark: from (x-offset-len, y) to (x-offset, y)
    // defaults: offset 3, length 9 -> from 88 to 97 at y=100
    const blHorizontal = lines[0];
    expect(blHorizontal.x1).toBe(88);
    expect(blHorizontal.x2).toBe(97);
    expect(blHorizontal.y1).toBe(100);
    expect(blHorizontal.y2).toBe(100);
  });

  it("respects custom mark length and offset", () => {
    const lines = calculateCropMarks({
      xPt: 100,
      yPt: 100,
      widthPt: 200,
      heightPt: 100,
      markLengthPt: 20,
      offsetPt: 5,
    });
    const blHorizontal = lines[0];
    // from (100-5-20)=75 to (100-5)=95
    expect(blHorizontal.x1).toBe(75);
    expect(blHorizontal.x2).toBe(95);
  });

  it("places marks around the item bounds, not inside", () => {
    const x = 100;
    const y = 100;
    const w = 200;
    const h = 100;
    const lines = calculateCropMarks({ xPt: x, yPt: y, widthPt: w, heightPt: h });
    // No segment endpoint should land strictly inside the trim rectangle.
    for (const line of lines) {
      const insideStart = line.x1 > x && line.x1 < x + w && line.y1 > y && line.y1 < y + h;
      const insideEnd = line.x2 > x && line.x2 < x + w && line.y2 > y && line.y2 < y + h;
      expect(insideStart).toBe(false);
      expect(insideEnd).toBe(false);
    }
  });

  it("returns an empty array for invalid dimensions", () => {
    expect(calculateCropMarks({ xPt: 0, yPt: 0, widthPt: 0, heightPt: 100 })).toHaveLength(0);
    expect(calculateCropMarks({ xPt: 0, yPt: 0, widthPt: -5, heightPt: 100 })).toHaveLength(0);
    expect(
      calculateCropMarks({ xPt: Number.NaN, yPt: 0, widthPt: 50, heightPt: 50 }),
    ).toHaveLength(0);
  });
});
