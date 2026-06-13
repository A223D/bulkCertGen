import { describe, expect, it } from "vitest";
import {
  doesTextFit,
  resolveTextFit,
  truncateTextToFit,
  wrapTextToLines,
  type TextFitBox,
} from "../../lib/batch-pdf/custom/text-fit.ts";
import { createDefaultTextBoxStyle } from "../../lib/batch-pdf/custom/field-boxes.ts";
import type { TextBoxStyle } from "../../lib/batch-pdf/custom/types.ts";

function makeStyle(overrides: Partial<TextBoxStyle> = {}): TextBoxStyle {
  return { ...createDefaultTextBoxStyle(), ...overrides };
}

// A box large enough to fit most text
const LARGE_BOX: TextFitBox = { widthPt: 500, heightPt: 200 };
// A box too small to fit anything meaningful
const TINY_BOX: TextFitBox = { widthPt: 10, heightPt: 10 };
// A medium box (roughly 4in x 0.5in at 72pt/in)
const MEDIUM_BOX: TextFitBox = { widthPt: 288, heightPt: 36 };

const SHRINK_STYLE = makeStyle({ overflowMode: "shrinkToFit", fontSize: 18, minFontSize: 8 });
const WRAP_STYLE = makeStyle({ overflowMode: "wrap", fontSize: 14, lineHeight: 1.1 });
const TRUNCATE_STYLE = makeStyle({ overflowMode: "truncate", fontSize: 14 });
const ERROR_STYLE = makeStyle({ overflowMode: "errorIfOverflow", fontSize: 14 });

describe("wrapTextToLines", () => {
  it("returns single line for short text", () => {
    const lines = wrapTextToLines({ text: "Hi", boxWidthPt: 200, style: WRAP_STYLE });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("Hi");
  });

  it("wraps long text into multiple lines", () => {
    const text = "The quick brown fox jumps over the lazy dog and keeps on running";
    const lines = wrapTextToLines({ text, boxWidthPt: 80, style: WRAP_STYLE });
    expect(lines.length).toBeGreaterThan(1);
  });

  it("always puts a word on its own line even if it exceeds box width", () => {
    const text = "superlongwordthatcannotfit";
    const lines = wrapTextToLines({ text, boxWidthPt: 5, style: WRAP_STYLE });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("superlongwordthatcannotfit");
  });

  it("applies uppercase style before wrapping", () => {
    const lines = wrapTextToLines({
      text: "hello world",
      boxWidthPt: 200,
      style: makeStyle({ overflowMode: "wrap", uppercase: true, fontSize: 12, lineHeight: 1.2 }),
    });
    expect(lines.join(" ")).toContain("HELLO");
  });

  it("returns array with one empty string for empty input", () => {
    const lines = wrapTextToLines({ text: "", boxWidthPt: 200, style: WRAP_STYLE });
    expect(lines).toHaveLength(1);
  });

  it("uses override fontSize when provided", () => {
    const text = "Hello World Testing";
    // At large font, more wrapping; at small font, less wrapping
    const linesSmall = wrapTextToLines({ text, boxWidthPt: 60, style: WRAP_STYLE, fontSize: 6 });
    const linesBig = wrapTextToLines({ text, boxWidthPt: 60, style: WRAP_STYLE, fontSize: 20 });
    expect(linesSmall.length).toBeLessThanOrEqual(linesBig.length);
  });
});

describe("truncateTextToFit", () => {
  it("returns original text unchanged when it fits", () => {
    const result = truncateTextToFit({ text: "Hi", boxWidthPt: 500, style: TRUNCATE_STYLE });
    expect(result).toBe("Hi");
  });

  it("returns ellipsis-terminated string when text is too long", () => {
    const result = truncateTextToFit({
      text: "This is a very long text that will not fit inside a small box",
      boxWidthPt: 30,
      style: TRUNCATE_STYLE,
    });
    expect(result.endsWith("...")).toBe(true);
  });

  it("truncated result is shorter than the original", () => {
    const original = "Superlongvalue that exceeds the box width significantly";
    const result = truncateTextToFit({ text: original, boxWidthPt: 40, style: TRUNCATE_STYLE });
    expect(result.length).toBeLessThan(original.length);
  });

  it("applies uppercase before truncation", () => {
    const result = truncateTextToFit({
      text: "hello world example text that is quite long",
      boxWidthPt: 40,
      style: makeStyle({ overflowMode: "truncate", uppercase: true, fontSize: 14 }),
    });
    expect(result).toMatch(/^[A-Z .]+\.{3}$|^[A-Z .]+$/);
  });
});

describe("doesTextFit", () => {
  it("returns true for short text in a large box", () => {
    expect(doesTextFit({ text: "Hi", box: LARGE_BOX, style: SHRINK_STYLE })).toBe(true);
  });

  it("returns false for text that is too wide", () => {
    const longText = "W".repeat(200);
    expect(doesTextFit({ text: longText, box: TINY_BOX, style: ERROR_STYLE })).toBe(false);
  });

  it("returns true for empty text", () => {
    expect(doesTextFit({ text: "", box: TINY_BOX, style: ERROR_STYLE })).toBe(true);
  });

  it("with allowWrap uses height check after wrapping", () => {
    // A tall narrow box — with wrapping should fit; without wrapping might not
    const text = "word1 word2 word3";
    const narrowTallBox: TextFitBox = { widthPt: 30, heightPt: 300 };
    const result = doesTextFit({ text, box: narrowTallBox, style: WRAP_STYLE, allowWrap: true });
    expect(result).toBe(true);
  });

  it("uses override fontSize", () => {
    const text = "Hello World";
    const fitsSmall = doesTextFit({ text, box: MEDIUM_BOX, style: ERROR_STYLE, fontSize: 8 });
    const fitsLarge = doesTextFit({ text, box: MEDIUM_BOX, style: ERROR_STYLE, fontSize: 100 });
    expect(fitsSmall).toBe(true);
    expect(fitsLarge).toBe(false);
  });
});

describe("resolveTextFit - empty text", () => {
  it("empty text always returns fits status", () => {
    for (const style of [SHRINK_STYLE, WRAP_STYLE, TRUNCATE_STYLE, ERROR_STYLE]) {
      const result = resolveTextFit({ text: "", box: TINY_BOX, style });
      expect(result.status).toBe("fits");
      expect(result.blocksExport).toBe(false);
      expect(result.lineCount).toBe(0);
    }
  });
});

describe("resolveTextFit - shrinkToFit", () => {
  it("short text fits in a large box at configured size", () => {
    const result = resolveTextFit({ text: "Hi", box: LARGE_BOX, style: SHRINK_STYLE });
    expect(result.status).toBe("fits");
    expect(result.blocksExport).toBe(false);
    expect(result.overflowMode).toBe("shrinkToFit");
    expect(result.fontSize).toBe(SHRINK_STYLE.fontSize);
  });

  it("long text forces font size reduction", () => {
    const text = "W".repeat(60);
    const result = resolveTextFit({ text, box: MEDIUM_BOX, style: SHRINK_STYLE });
    expect(["fitsWithShrink", "overflow"]).toContain(result.status);
    if (result.status === "fitsWithShrink") {
      expect(result.fontSize).toBeLessThan(SHRINK_STYLE.fontSize);
      expect(result.blocksExport).toBe(false);
      expect(result.warningCode).toBe("text_shrunk");
    }
  });

  it("blocks export when text cannot fit at minFontSize", () => {
    const text = "W".repeat(200);
    const result = resolveTextFit({ text, box: TINY_BOX, style: SHRINK_STYLE });
    expect(result.status).toBe("overflow");
    expect(result.blocksExport).toBe(true);
    expect(result.warningCode).toBe("text_overflow");
    expect(result.fontSize).toBe(SHRINK_STYLE.minFontSize);
  });

  it("reports originalTextLength correctly", () => {
    const text = "Hello";
    const result = resolveTextFit({ text, box: LARGE_BOX, style: SHRINK_STYLE });
    expect(result.originalTextLength).toBe(5);
  });

  it("uppercase is applied to renderedText", () => {
    const style = makeStyle({ overflowMode: "shrinkToFit", uppercase: true, fontSize: 14, minFontSize: 8 });
    const result = resolveTextFit({ text: "hello", box: LARGE_BOX, style });
    expect(result.renderedText).toBe("HELLO");
  });
});

describe("resolveTextFit - wrap", () => {
  it("short text fits without wrapping", () => {
    const result = resolveTextFit({ text: "Hi", box: LARGE_BOX, style: WRAP_STYLE });
    expect(result.status).toBe("fits");
    expect(result.lineCount).toBe(1);
    expect(result.blocksExport).toBe(false);
  });

  it("long text wraps to multiple lines", () => {
    const text = "The quick brown fox jumps over the lazy dog and keeps running";
    const narrowBox: TextFitBox = { widthPt: 100, heightPt: 400 };
    const result = resolveTextFit({ text, box: narrowBox, style: WRAP_STYLE });
    expect(result.status).toBe("fitsWithWrap");
    expect(result.lineCount).toBeGreaterThan(1);
    expect(result.blocksExport).toBe(false);
    expect(result.warningCode).toBe("text_wrapped");
  });

  it("blocks export when wrapped height exceeds box height", () => {
    const text = "word1 word2 word3 word4 word5 word6 word7 word8";
    const tinyTall: TextFitBox = { widthPt: 30, heightPt: 12 };
    const result = resolveTextFit({ text, box: tinyTall, style: WRAP_STYLE });
    expect(result.status).toBe("overflow");
    expect(result.blocksExport).toBe(true);
    expect(result.warningCode).toBe("text_overflow");
  });
});

describe("resolveTextFit - truncate", () => {
  it("short text fits without truncation", () => {
    const result = resolveTextFit({ text: "Hi", box: LARGE_BOX, style: TRUNCATE_STYLE });
    expect(result.status).toBe("fits");
    expect(result.blocksExport).toBe(false);
    expect(result.warningCode).toBeUndefined();
  });

  it("long text is truncated with ellipsis and does not block export", () => {
    const text = "This is a very long string that will absolutely not fit in a small box";
    const result = resolveTextFit({ text, box: TINY_BOX, style: TRUNCATE_STYLE });
    expect(result.status).toBe("fitsWithTruncation");
    expect(result.blocksExport).toBe(false);
    expect(result.warningCode).toBe("text_truncated");
    expect(result.renderedText.endsWith("...")).toBe(true);
    expect(result.renderedText.length).toBeLessThan(text.length);
  });

  it("originalTextLength reflects the input text", () => {
    const text = "truncate me because I am too long for the box";
    const result = resolveTextFit({ text, box: TINY_BOX, style: TRUNCATE_STYLE });
    expect(result.originalTextLength).toBe(text.length);
  });

  it("result never includes raw warning codes with text content", () => {
    const text = "sensitive:data:here";
    const result = resolveTextFit({ text, box: TINY_BOX, style: TRUNCATE_STYLE });
    // warningCode should be a fixed code string, not derived from text
    if (result.warningCode) {
      expect(result.warningCode).toBe("text_truncated");
      expect(result.warningCode).not.toContain(text);
    }
  });
});

describe("resolveTextFit - errorIfOverflow", () => {
  it("short text fits in a large box", () => {
    const result = resolveTextFit({ text: "Hello", box: LARGE_BOX, style: ERROR_STYLE });
    expect(result.status).toBe("fits");
    expect(result.blocksExport).toBe(false);
  });

  it("long text blocks export", () => {
    const text = "W".repeat(100);
    const result = resolveTextFit({ text, box: TINY_BOX, style: ERROR_STYLE });
    expect(result.status).toBe("overflow");
    expect(result.blocksExport).toBe(true);
    expect(result.warningCode).toBe("text_overflow");
  });

  it("does not shrink or wrap — just checks fit", () => {
    const text = "Hello World";
    const result = resolveTextFit({ text, box: MEDIUM_BOX, style: ERROR_STYLE });
    expect(result.fontSize).toBe(ERROR_STYLE.fontSize);
    expect(result.lineCount).toBe(1);
  });
});

describe("resolveTextFit - overflow mode affects result", () => {
  // 25 "W"s: at 14pt (fontSize) → ~330pt wide → overflows MEDIUM_BOX (288pt)
  // At 8pt (minFontSize) → ~189pt → fits MEDIUM_BOX
  // So shrinkToFit succeeds while errorIfOverflow at 14pt blocks.
  const text = "W".repeat(25);

  it("shrinkToFit fits where errorIfOverflow blocks", () => {
    const shrinkResult = resolveTextFit({ text, box: MEDIUM_BOX, style: SHRINK_STYLE });
    const errorResult = resolveTextFit({ text, box: MEDIUM_BOX, style: ERROR_STYLE });
    expect(errorResult.blocksExport).toBe(true);
    expect(shrinkResult.status).not.toBe("overflow");
    expect(shrinkResult.blocksExport).toBe(false);
  });

  it("truncate never blocks export", () => {
    const result = resolveTextFit({ text, box: TINY_BOX, style: TRUNCATE_STYLE });
    expect(result.blocksExport).toBe(false);
  });
});
