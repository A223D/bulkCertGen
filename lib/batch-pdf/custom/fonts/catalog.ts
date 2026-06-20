import fontList from "./font-list.json";

export type FontCategory =
  | "sans"
  | "serif"
  | "display"
  | "handwriting"
  | "mono";

export type FontSource = "standard" | "google";

export type FontWeightName = "normal" | "bold";

export type FontCatalogEntry = {
  /** Stable id stored on the field box style (`fontFamily`). */
  id: string;
  /** Human-readable name shown in the picker. */
  label: string;
  category: FontCategory;
  source: FontSource;
  /** Weights with their own glyph file. `bold` falls back to `normal` when absent. */
  weights: FontWeightName[];
  /** CSS font-family stack for preview (standard fonts only; Google fonts use the id). */
  css?: string;
};

export const FONT_CATALOG: FontCatalogEntry[] = (
  fontList.fonts as FontCatalogEntry[]
);

export const DEFAULT_FONT_FAMILY = "Helvetica";

const BY_ID = new Map<string, FontCatalogEntry>(
  FONT_CATALOG.map((entry) => [entry.id, entry]),
);

export function getFontEntry(id: string): FontCatalogEntry | undefined {
  return BY_ID.get(id);
}

export function isKnownFontFamily(id: string): boolean {
  return BY_ID.has(id);
}

/** Weight that actually has glyphs for this font (bold may fall back to normal). */
export function resolveAvailableWeight(
  id: string,
  weight: FontWeightName,
): FontWeightName {
  const entry = BY_ID.get(id);
  if (!entry) return "normal";
  return entry.weights.includes(weight) ? weight : "normal";
}

export const CATEGORY_LABELS: Record<FontCategory, string> = {
  sans: "Sans serif",
  serif: "Serif",
  display: "Display",
  handwriting: "Handwriting",
  mono: "Monospace",
};

/** Google families that need a web-font stylesheet for preview rendering. */
export function googleFontFamilies(): string[] {
  return FONT_CATALOG.filter((entry) => entry.source === "google").map(
    (entry) => entry.id,
  );
}

const GENERIC_FALLBACK: Record<FontCategory, string> = {
  sans: "sans-serif",
  serif: "serif",
  display: "cursive",
  handwriting: "cursive",
  mono: "monospace",
};

/** CSS `font-family` stack used to render a field box in the browser preview. */
export function cssFontStack(id: string): string {
  const entry = BY_ID.get(id);
  if (!entry) return "Arial, Helvetica, sans-serif";
  if (entry.css) return entry.css;
  return `"${entry.id}", ${GENERIC_FALLBACK[entry.category]}`;
}

/** Builds a Google Fonts CSS2 stylesheet URL covering every Google catalog font. */
export function googleFontsStylesheetUrl(): string {
  const families = FONT_CATALOG.filter((entry) => entry.source === "google")
    .map((entry) => {
      const name = entry.id.replace(/\s+/g, "+");
      const weights = entry.weights.includes("bold") ? "wght@400;700" : "wght@400";
      return `family=${name}:${weights}`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
