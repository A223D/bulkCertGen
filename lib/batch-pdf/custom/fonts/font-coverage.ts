import { FONT_METRICS } from "./metrics.generated.ts";
import { FONT_CATALOG, getFontEntry, resolveAvailableWeight } from "./catalog.ts";
import type { TextBoxStyle } from "../types.ts";

const WIN_ANSI_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6,
  0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c,
  0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);

export function formatCodePoint(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

function isWinAnsiCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x20 && codePoint <= 0x7e) ||
    (codePoint >= 0xa0 && codePoint <= 0xff) ||
    WIN_ANSI_EXTRA.has(codePoint)
  );
}

export function canFontEncodeChar(args: {
  char: string;
  fontFamily: TextBoxStyle["fontFamily"];
  fontWeight: TextBoxStyle["fontWeight"];
}): boolean {
  const codePoint = args.char.codePointAt(0);
  if (typeof codePoint !== "number") return true;

  const entry = getFontEntry(args.fontFamily);
  if (!entry || entry.source === "standard") {
    return isWinAnsiCodePoint(codePoint);
  }

  const weight = resolveAvailableWeight(args.fontFamily, args.fontWeight);
  const table = FONT_METRICS[args.fontFamily]?.[weight];
  return Boolean(table?.widths[args.char]);
}

export function getUnsupportedCodePoints(args: {
  text: string;
  fontFamily: TextBoxStyle["fontFamily"];
  fontWeight: TextBoxStyle["fontWeight"];
  uppercase?: boolean;
}): string[] {
  const text = args.uppercase ? args.text.toUpperCase() : args.text;
  const seen = new Set<string>();

  for (const char of text) {
    if (!canFontEncodeChar({ char, fontFamily: args.fontFamily, fontWeight: args.fontWeight })) {
      const codePoint = char.codePointAt(0);
      if (typeof codePoint === "number") seen.add(formatCodePoint(codePoint));
    }
  }

  return [...seen];
}

export function fontSupportsText(args: {
  text: string;
  fontFamily: TextBoxStyle["fontFamily"];
  fontWeight: TextBoxStyle["fontWeight"];
  uppercase?: boolean;
}): boolean {
  return getUnsupportedCodePoints(args).length === 0;
}

export function findFontsSupportingText(args: {
  text: string;
  fontWeight: TextBoxStyle["fontWeight"];
  uppercase?: boolean;
  limit?: number;
}): string[] {
  const limit = args.limit ?? 3;
  const preferred = [
    "Noto Sans",
    "Noto Sans Arabic",
    "Noto Sans Devanagari",
    "Noto Sans Hebrew",
    "Noto Sans JP",
    "Noto Sans KR",
    "Noto Sans SC",
    "Noto Sans TC",
    "Noto Sans Thai",
  ];
  const ordered = [
    ...preferred,
    ...FONT_CATALOG.map((entry) => entry.id).filter((id) => !preferred.includes(id)),
  ];
  const matches: string[] = [];

  for (const fontFamily of ordered) {
    if (
      fontSupportsText({
        text: args.text,
        fontFamily,
        fontWeight: args.fontWeight,
        uppercase: args.uppercase,
      })
    ) {
      matches.push(fontFamily);
      if (matches.length >= limit) break;
    }
  }

  return matches;
}
