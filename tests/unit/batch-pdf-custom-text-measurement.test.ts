import { describe, expect, it } from "vitest";
import {
  estimateLineHeightPt,
  estimateTextBlockHeightPt,
  estimateTextWidthPt,
  normalizeTextForMeasurement,
} from "../../lib/batch-pdf/custom/text-measurement.ts";

describe("text measurement utilities", () => {
  describe("normalizeTextForMeasurement", () => {
    it("returns text unchanged when uppercase is false", () => {
      expect(normalizeTextForMeasurement({ text: "hello World", uppercase: false })).toBe(
        "hello World",
      );
    });

    it("converts text to uppercase when uppercase is true", () => {
      expect(normalizeTextForMeasurement({ text: "hello", uppercase: true })).toBe("HELLO");
    });

    it("defaults to no uppercase when option is omitted", () => {
      expect(normalizeTextForMeasurement({ text: "hello" })).toBe("hello");
    });

    it("handles empty string", () => {
      expect(normalizeTextForMeasurement({ text: "", uppercase: true })).toBe("");
    });
  });

  describe("estimateTextWidthPt - empty and zero", () => {
    it("returns 0 for empty string regardless of font", () => {
      expect(estimateTextWidthPt({ text: "", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12 })).toBe(0);
      expect(estimateTextWidthPt({ text: "", fontFamily: "Times", fontWeight: "bold", fontSize: 18 })).toBe(0);
      expect(estimateTextWidthPt({ text: "", fontFamily: "Courier", fontWeight: "normal", fontSize: 10 })).toBe(0);
    });
  });

  describe("estimateTextWidthPt - longer text is wider", () => {
    it("longer text estimates wider than shorter text (Helvetica)", () => {
      const short = estimateTextWidthPt({ text: "ab", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12 });
      const long = estimateTextWidthPt({ text: "abcdefg", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12 });
      expect(long).toBeGreaterThan(short);
    });

    it("longer text estimates wider than shorter text (Times)", () => {
      const short = estimateTextWidthPt({ text: "hi", fontFamily: "Times", fontWeight: "normal", fontSize: 14 });
      const long = estimateTextWidthPt({ text: "hello world", fontFamily: "Times", fontWeight: "normal", fontSize: 14 });
      expect(long).toBeGreaterThan(short);
    });

    it("longer text estimates wider than shorter text (Courier)", () => {
      const short = estimateTextWidthPt({ text: "ab", fontFamily: "Courier", fontWeight: "normal", fontSize: 12 });
      const long = estimateTextWidthPt({ text: "abcdefghij", fontFamily: "Courier", fontWeight: "normal", fontSize: 12 });
      expect(long).toBeGreaterThan(short);
    });
  });

  describe("estimateTextWidthPt - uppercase transformation", () => {
    it("uppercase flag converts text before measuring", () => {
      const lower = estimateTextWidthPt({ text: "hello", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12, uppercase: false });
      const upper = estimateTextWidthPt({ text: "hello", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12, uppercase: true });
      // "HELLO" contains uppercase letters which may differ from lowercase
      // At minimum both should be positive
      expect(lower).toBeGreaterThan(0);
      expect(upper).toBeGreaterThan(0);
      // Pre-uppercased text measured without flag should equal measured-with-flag
      const preUpper = estimateTextWidthPt({ text: "HELLO", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12, uppercase: false });
      expect(upper).toBe(preUpper);
    });
  });

  describe("estimateTextWidthPt - Courier monospaced behavior", () => {
    it("all single characters have the same width in Courier", () => {
      const chars = ["a", "m", "i", "W", "1", " "];
      const widths = chars.map((c) =>
        estimateTextWidthPt({ text: c, fontFamily: "Courier", fontWeight: "normal", fontSize: 12 }),
      );
      const first = widths[0];
      for (const w of widths) {
        expect(w).toBe(first);
      }
    });

    it("Courier width scales linearly with character count", () => {
      const one = estimateTextWidthPt({ text: "a", fontFamily: "Courier", fontWeight: "normal", fontSize: 12 });
      const five = estimateTextWidthPt({ text: "aaaaa", fontFamily: "Courier", fontWeight: "normal", fontSize: 12 });
      expect(five).toBeCloseTo(one * 5, 6);
    });
  });

  describe("estimateTextWidthPt - bold is wider than normal", () => {
    it("bold Helvetica is wider than normal Helvetica for typical text", () => {
      const normal = estimateTextWidthPt({ text: "Hello World", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12 });
      const bold = estimateTextWidthPt({ text: "Hello World", fontFamily: "Helvetica", fontWeight: "bold", fontSize: 12 });
      expect(bold).toBeGreaterThan(normal);
    });

    it("bold Times is wider than normal Times for typical text", () => {
      const normal = estimateTextWidthPt({ text: "Batch PDF", fontFamily: "Times", fontWeight: "normal", fontSize: 14 });
      const bold = estimateTextWidthPt({ text: "Batch PDF", fontFamily: "Times", fontWeight: "bold", fontSize: 14 });
      expect(bold).toBeGreaterThan(normal);
    });
  });

  describe("estimateTextWidthPt - spaces are counted but narrower than wide letters", () => {
    it("text with spaces is wider than just the non-space characters counted alone", () => {
      const spaceOnly = estimateTextWidthPt({ text: " ", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12 });
      const wideChar = estimateTextWidthPt({ text: "W", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12 });
      // Space should be narrower than a wide letter like W
      expect(spaceOnly).toBeGreaterThan(0);
      expect(spaceOnly).toBeLessThan(wideChar);
    });

    it("sentence with spaces is wider than same chars without spaces", () => {
      const withSpaces = estimateTextWidthPt({ text: "a b c", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12 });
      const noSpaces = estimateTextWidthPt({ text: "abc", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12 });
      expect(withSpaces).toBeGreaterThan(noSpaces);
    });
  });

  describe("estimateTextWidthPt - font size scaling", () => {
    it("width scales proportionally with font size", () => {
      const at12 = estimateTextWidthPt({ text: "Hello", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 12 });
      const at24 = estimateTextWidthPt({ text: "Hello", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 24 });
      expect(at24).toBeCloseTo(at12 * 2, 6);
    });
  });

  describe("estimateLineHeightPt", () => {
    it("line height is fontSize times lineHeight multiplier", () => {
      expect(estimateLineHeightPt({ fontSize: 12, lineHeight: 1.2 })).toBeCloseTo(14.4, 6);
      expect(estimateLineHeightPt({ fontSize: 18, lineHeight: 1.0 })).toBeCloseTo(18, 6);
    });
  });

  describe("estimateTextBlockHeightPt", () => {
    it("zero lines returns 0", () => {
      expect(estimateTextBlockHeightPt({ lineCount: 0, fontSize: 12, lineHeight: 1.2 })).toBe(0);
    });

    it("scales with line count", () => {
      const one = estimateTextBlockHeightPt({ lineCount: 1, fontSize: 12, lineHeight: 1.1 });
      const three = estimateTextBlockHeightPt({ lineCount: 3, fontSize: 12, lineHeight: 1.1 });
      expect(three).toBeCloseTo(one * 3, 6);
    });

    it("scales with font size", () => {
      const small = estimateTextBlockHeightPt({ lineCount: 2, fontSize: 10, lineHeight: 1.0 });
      const large = estimateTextBlockHeightPt({ lineCount: 2, fontSize: 20, lineHeight: 1.0 });
      expect(large).toBeCloseTo(small * 2, 6);
    });
  });

  describe("no DOM APIs required", () => {
    it("all functions operate without document or window", () => {
      // These calls would throw if they touched DOM globals
      expect(() => {
        estimateTextWidthPt({ text: "test", fontFamily: "Helvetica", fontWeight: "normal", fontSize: 14 });
        estimateLineHeightPt({ fontSize: 14, lineHeight: 1.2 });
        estimateTextBlockHeightPt({ lineCount: 3, fontSize: 14, lineHeight: 1.2 });
        normalizeTextForMeasurement({ text: "test", uppercase: true });
      }).not.toThrow();
    });
  });
});
