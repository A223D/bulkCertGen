import { StandardFonts } from "pdf-lib";
import type { Result } from "../types.ts";
import type { TextBoxStyle } from "./types.ts";

// Approximate fraction of fontSize that represents the ascent above baseline.
// Used to align text visually within a box. Tuned for Helvetica/Times/Courier.
const ASCENT_FRACTION = 0.75;

export function parseHexColorToRgb(
  hex: string,
): Result<{ r: number; g: number; b: number }> {
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return {
      ok: false,
      errors: [
        {
          code: "invalid_hex_color",
          message: "Color must be a 6-digit hex code such as #000000.",
        },
      ],
    };
  }

  return {
    ok: true,
    value: {
      r: parseInt(clean.slice(0, 2), 16) / 255,
      g: parseInt(clean.slice(2, 4), 16) / 255,
      b: parseInt(clean.slice(4, 6), 16) / 255,
    },
  };
}

export function resolvePdfFontName(args: {
  fontFamily: TextBoxStyle["fontFamily"];
  fontWeight: TextBoxStyle["fontWeight"];
}): StandardFonts {
  const bold = args.fontWeight === "bold";

  switch (args.fontFamily) {
    case "Helvetica":
      return bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    case "Times":
      return bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
    case "Courier":
      return bold ? StandardFonts.CourierBold : StandardFonts.Courier;
    default:
      return StandardFonts.Helvetica;
  }
}

/**
 * Calculates the drawing position (baseline of first text line) for placing
 * text within a box using pdf-lib's bottom-left coordinate system.
 *
 * @param boxX      Left edge of box from page left (pt)
 * @param boxY      Bottom edge of box from page bottom (pt) — pdf-lib coords
 * @param boxWidth  Box width (pt)
 * @param boxHeight Box height (pt)
 * @param textWidth Width of a single line of text (pt) — used for horizontal align
 * @param textHeight Total height of the text block (pt) — all lines combined
 * @param fontSize  Font size in points
 * @param align     Horizontal alignment
 * @param verticalAlign Vertical alignment
 */
export function calculateTextStartPosition(args: {
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  textWidth: number;
  textHeight: number;
  fontSize: number;
  align: TextBoxStyle["align"];
  verticalAlign: TextBoxStyle["verticalAlign"];
}): { x: number; y: number } {
  const {
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    textWidth,
    textHeight,
    fontSize,
    align,
    verticalAlign,
  } = args;

  let x: number;

  switch (align) {
    case "right":
      x = boxX + boxWidth - textWidth;
      break;
    case "center":
      x = boxX + (boxWidth - textWidth) / 2;
      break;
    default:
      x = boxX;
  }

  // y is the baseline of the first text line in pdf-lib coords (from page bottom).
  // ASCENT_FRACTION * fontSize ≈ distance from baseline to visual cap top.
  let y: number;

  switch (verticalAlign) {
    case "bottom":
      // Last line sits near the bottom of the box.
      y = boxY + textHeight - fontSize * ASCENT_FRACTION;
      break;
    case "middle":
      // Center the text block vertically.
      y = boxY + (boxHeight + textHeight) / 2 - fontSize * ASCENT_FRACTION;
      break;
    default: // "top"
      // First line sits near the top of the box.
      y = boxY + boxHeight - fontSize * ASCENT_FRACTION;
      break;
  }

  return { x, y };
}
