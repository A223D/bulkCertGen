import { describe, expect, it } from "vitest";
import { StandardFonts } from "pdf-lib";
import {
  calculateTextStartPosition,
  parseHexColorToRgb,
  resolvePdfFontName,
} from "../../lib/batch-pdf/custom/pdf-text.ts";

// ---------------------------------------------------------------------------
// parseHexColorToRgb
// ---------------------------------------------------------------------------

describe("parseHexColorToRgb", () => {
  it("parses black #000000", () => {
    const result = parseHexColorToRgb("#000000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.r).toBe(0);
      expect(result.value.g).toBe(0);
      expect(result.value.b).toBe(0);
    }
  });

  it("parses white #ffffff", () => {
    const result = parseHexColorToRgb("#ffffff");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.r).toBeCloseTo(1, 5);
      expect(result.value.g).toBeCloseTo(1, 5);
      expect(result.value.b).toBeCloseTo(1, 5);
    }
  });

  it("parses color without leading #", () => {
    const result = parseHexColorToRgb("ff0000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.r).toBeCloseTo(1, 5);
      expect(result.value.g).toBe(0);
      expect(result.value.b).toBe(0);
    }
  });

  it("parses uppercase hex", () => {
    const result = parseHexColorToRgb("#FF8800");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.r).toBeCloseTo(1, 5);
      expect(result.value.g).toBeCloseTo(0x88 / 255, 4);
      expect(result.value.b).toBe(0);
    }
  });

  it("rejects 3-digit hex", () => {
    const result = parseHexColorToRgb("#fff");
    expect(result.ok).toBe(false);
  });

  it("rejects non-hex characters", () => {
    const result = parseHexColorToRgb("#zzzzzz");
    expect(result.ok).toBe(false);
  });

  it("rejects empty string", () => {
    const result = parseHexColorToRgb("");
    expect(result.ok).toBe(false);
  });

  it("normalizes values to 0-1 range", () => {
    const result = parseHexColorToRgb("#804020");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.r).toBeGreaterThanOrEqual(0);
      expect(result.value.r).toBeLessThanOrEqual(1);
      expect(result.value.g).toBeGreaterThanOrEqual(0);
      expect(result.value.g).toBeLessThanOrEqual(1);
      expect(result.value.b).toBeGreaterThanOrEqual(0);
      expect(result.value.b).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// resolvePdfFontName
// ---------------------------------------------------------------------------

describe("resolvePdfFontName", () => {
  it("returns Helvetica for normal weight", () => {
    expect(resolvePdfFontName({ fontFamily: "Helvetica", fontWeight: "normal" })).toBe(
      StandardFonts.Helvetica,
    );
  });

  it("returns HelveticaBold for bold weight", () => {
    expect(resolvePdfFontName({ fontFamily: "Helvetica", fontWeight: "bold" })).toBe(
      StandardFonts.HelveticaBold,
    );
  });

  it("returns TimesRoman for Times normal", () => {
    expect(resolvePdfFontName({ fontFamily: "Times", fontWeight: "normal" })).toBe(
      StandardFonts.TimesRoman,
    );
  });

  it("returns TimesRomanBold for Times bold", () => {
    expect(resolvePdfFontName({ fontFamily: "Times", fontWeight: "bold" })).toBe(
      StandardFonts.TimesRomanBold,
    );
  });

  it("returns Courier for Courier normal", () => {
    expect(resolvePdfFontName({ fontFamily: "Courier", fontWeight: "normal" })).toBe(
      StandardFonts.Courier,
    );
  });

  it("returns CourierBold for Courier bold", () => {
    expect(resolvePdfFontName({ fontFamily: "Courier", fontWeight: "bold" })).toBe(
      StandardFonts.CourierBold,
    );
  });
});

// ---------------------------------------------------------------------------
// calculateTextStartPosition
// ---------------------------------------------------------------------------

describe("calculateTextStartPosition", () => {
  const baseArgs = {
    boxX: 0,
    boxY: 0,
    boxWidth: 100,
    boxHeight: 50,
    textWidth: 60,
    textHeight: 18,
    fontSize: 14,
    align: "left" as const,
    verticalAlign: "top" as const,
  };

  describe("horizontal alignment", () => {
    it("left align starts at boxX", () => {
      const { x } = calculateTextStartPosition({ ...baseArgs, align: "left" });
      expect(x).toBe(baseArgs.boxX);
    });

    it("right align ends text at right edge", () => {
      const { x } = calculateTextStartPosition({ ...baseArgs, align: "right" });
      expect(x).toBe(baseArgs.boxX + baseArgs.boxWidth - baseArgs.textWidth);
    });

    it("center align centers text in box", () => {
      const { x } = calculateTextStartPosition({ ...baseArgs, align: "center" });
      const expected = baseArgs.boxX + (baseArgs.boxWidth - baseArgs.textWidth) / 2;
      expect(x).toBeCloseTo(expected, 5);
    });
  });

  describe("vertical alignment", () => {
    it("top align places text near box top (y near top)", () => {
      const { y } = calculateTextStartPosition({ ...baseArgs, verticalAlign: "top" });
      // Should be below top of box (boxY + boxHeight) but not by much more than fontSize
      const boxTop = baseArgs.boxY + baseArgs.boxHeight;
      expect(y).toBeLessThanOrEqual(boxTop);
      expect(y).toBeGreaterThan(boxTop - baseArgs.fontSize);
    });

    it("bottom align places text near box bottom", () => {
      const { y } = calculateTextStartPosition({ ...baseArgs, verticalAlign: "bottom" });
      // Should be below the top but above the bottom
      const boxTop = baseArgs.boxY + baseArgs.boxHeight;
      const boxBottom = baseArgs.boxY;
      expect(y).toBeLessThan(boxTop);
      expect(y).toBeGreaterThan(boxBottom - 1);
    });

    it("middle align places text between top and bottom alignments", () => {
      const { y: yTop } = calculateTextStartPosition({ ...baseArgs, verticalAlign: "top" });
      const { y: yBottom } = calculateTextStartPosition({ ...baseArgs, verticalAlign: "bottom" });
      const { y: yMiddle } = calculateTextStartPosition({ ...baseArgs, verticalAlign: "middle" });
      // Middle should be between top and bottom
      expect(yMiddle).toBeLessThanOrEqual(yTop);
      expect(yMiddle).toBeGreaterThanOrEqual(yBottom);
    });
  });

  it("returns finite numbers for all outputs", () => {
    const { x, y } = calculateTextStartPosition(baseArgs);
    expect(Number.isFinite(x)).toBe(true);
    expect(Number.isFinite(y)).toBe(true);
  });
});
