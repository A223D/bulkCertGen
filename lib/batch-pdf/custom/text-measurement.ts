import type { TextBoxStyle } from "./types.ts";

export type TextMeasureInput = {
  text: string;
  fontFamily: TextBoxStyle["fontFamily"];
  fontWeight: TextBoxStyle["fontWeight"];
  fontSize: number;
  uppercase?: boolean;
};

// Character widths in 1000-unit space, sourced from Adobe AFM files for the
// standard PDF base fonts. Used only for deterministic estimation — not
// exact typography. Unknown characters fall back to a conservative value.

const H_REGULAR: Record<string, number> = {
  " ": 278, "!": 278, '"': 355, "#": 556, $: 556, "%": 889, "&": 667,
  "'": 222, "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333,
  ".": 278, "/": 278,
  "0": 556, "1": 556, "2": 556, "3": 556, "4": 556,
  "5": 556, "6": 556, "7": 556, "8": 556, "9": 556,
  ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778,
  H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722,
  O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722,
  V: 667, W: 944, X: 667, Y: 667, Z: 611,
  "[": 278, "\\": 278, "]": 278, "^": 469, _: 556, "`": 222,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556,
  h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556,
  o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556,
  v: 500, w: 722, x: 500, y: 500, z: 500,
  "{": 334, "|": 260, "}": 334, "~": 584,
};

const H_BOLD: Record<string, number> = {
  " ": 278, "!": 333, '"': 474, "#": 556, $: 556, "%": 889, "&": 722,
  "'": 278, "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333,
  ".": 278, "/": 278,
  "0": 556, "1": 556, "2": 556, "3": 556, "4": 556,
  "5": 556, "6": 556, "7": 556, "8": 556, "9": 556,
  ":": 333, ";": 333, "<": 584, "=": 584, ">": 584, "?": 611, "@": 975,
  A: 722, B: 722, C: 722, D: 722, E: 667, F: 611, G: 778,
  H: 722, I: 278, J: 556, K: 722, L: 611, M: 833, N: 722,
  O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722,
  V: 667, W: 944, X: 667, Y: 667, Z: 611,
  "[": 333, "\\": 278, "]": 333, "^": 584, _: 556, "`": 278,
  a: 556, b: 611, c: 556, d: 611, e: 556, f: 333, g: 611,
  h: 611, i: 278, j: 278, k: 556, l: 278, m: 889, n: 611,
  o: 611, p: 611, q: 611, r: 389, s: 556, t: 333, u: 611,
  v: 556, w: 778, x: 556, y: 556, z: 500,
  "{": 389, "|": 280, "}": 389, "~": 584,
};

const T_REGULAR: Record<string, number> = {
  " ": 250, "!": 333, '"': 408, "#": 500, $: 500, "%": 833, "&": 778,
  "'": 180, "(": 333, ")": 333, "*": 500, "+": 564, ",": 250, "-": 333,
  ".": 250, "/": 278,
  "0": 500, "1": 500, "2": 500, "3": 500, "4": 500,
  "5": 500, "6": 500, "7": 500, "8": 500, "9": 500,
  ":": 278, ";": 278, "<": 564, "=": 564, ">": 564, "?": 444, "@": 921,
  A: 722, B: 667, C: 667, D: 722, E: 611, F: 556, G: 722,
  H: 722, I: 333, J: 389, K: 722, L: 611, M: 889, N: 722,
  O: 722, P: 556, Q: 722, R: 667, S: 556, T: 611, U: 722,
  V: 722, W: 944, X: 722, Y: 722, Z: 611,
  "[": 333, "\\": 278, "]": 333, "^": 469, _: 500, "`": 333,
  a: 444, b: 500, c: 444, d: 500, e: 444, f: 333, g: 500,
  h: 500, i: 278, j: 278, k: 500, l: 278, m: 778, n: 500,
  o: 500, p: 500, q: 500, r: 333, s: 389, t: 278, u: 500,
  v: 500, w: 722, x: 500, y: 500, z: 444,
  "{": 480, "|": 200, "}": 480, "~": 541,
};

const T_BOLD: Record<string, number> = {
  " ": 250, "!": 333, '"': 555, "#": 500, $: 500, "%": 1000, "&": 833,
  "'": 333, "(": 333, ")": 333, "*": 500, "+": 570, ",": 250, "-": 333,
  ".": 250, "/": 278,
  "0": 500, "1": 500, "2": 500, "3": 500, "4": 500,
  "5": 500, "6": 500, "7": 500, "8": 500, "9": 500,
  ":": 333, ";": 333, "<": 570, "=": 570, ">": 570, "?": 500, "@": 930,
  A: 722, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778,
  H: 778, I: 389, J: 500, K: 778, L: 667, M: 944, N: 722,
  O: 778, P: 611, Q: 778, R: 722, S: 556, T: 667, U: 722,
  V: 722, W: 1000, X: 722, Y: 722, Z: 667,
  "[": 333, "\\": 278, "]": 333, "^": 581, _: 500, "`": 333,
  a: 500, b: 556, c: 444, d: 556, e: 444, f: 333, g: 500,
  h: 556, i: 278, j: 333, k: 556, l: 278, m: 833, n: 556,
  o: 500, p: 556, q: 556, r: 444, s: 389, t: 333, u: 556,
  v: 500, w: 722, x: 500, y: 500, z: 444,
  "{": 394, "|": 220, "}": 394, "~": 520,
};

// Courier is monospaced at 600 units per character regardless of weight.
const COURIER_CHAR_UNITS = 600;

// Conservative fallback for characters not in the width tables (e.g. Unicode).
const HELVETICA_FALLBACK = 556;
const TIMES_FALLBACK = 500;

function getCharUnits(
  char: string,
  fontFamily: TextBoxStyle["fontFamily"],
  fontWeight: TextBoxStyle["fontWeight"],
): number {
  if (fontFamily === "Courier") return COURIER_CHAR_UNITS;

  if (fontFamily === "Times") {
    const table = fontWeight === "bold" ? T_BOLD : T_REGULAR;
    return table[char] ?? TIMES_FALLBACK;
  }

  // Helvetica (default)
  const table = fontWeight === "bold" ? H_BOLD : H_REGULAR;
  return table[char] ?? HELVETICA_FALLBACK;
}

export function normalizeTextForMeasurement(args: {
  text: string;
  uppercase?: boolean;
}): string {
  return args.uppercase ? args.text.toUpperCase() : args.text;
}

export function estimateTextWidthPt(input: TextMeasureInput): number {
  if (input.text.length === 0) return 0;

  const text = input.uppercase ? input.text.toUpperCase() : input.text;
  let totalUnits = 0;

  for (const char of text) {
    totalUnits += getCharUnits(char, input.fontFamily, input.fontWeight);
  }

  return (totalUnits / 1000) * input.fontSize;
}

export function estimateLineHeightPt(args: {
  fontSize: number;
  lineHeight: number;
}): number {
  return args.fontSize * args.lineHeight;
}

export function estimateTextBlockHeightPt(args: {
  lineCount: number;
  fontSize: number;
  lineHeight: number;
}): number {
  if (args.lineCount <= 0) return 0;
  return args.lineCount * estimateLineHeightPt({ fontSize: args.fontSize, lineHeight: args.lineHeight });
}

// Exported for use by text-fit internals without re-normalizing text.
export function estimateNormalizedTextWidthUnits(
  text: string,
  fontFamily: TextBoxStyle["fontFamily"],
  fontWeight: TextBoxStyle["fontWeight"],
): number {
  let total = 0;
  for (const char of text) {
    total += getCharUnits(char, fontFamily, fontWeight);
  }
  return total;
}
