// Server-only font resolution for PDF embedding. Standard PDF base fonts map
// to pdf-lib's built-ins; Google fonts are fetched from fonts.gstatic.com at
// export time (URLs recorded by scripts/generate-fonts.mjs) and cached in
// memory so a batch only downloads each font once.

import { StandardFonts } from "pdf-lib";
import {
  getFontEntry,
  resolveAvailableWeight,
  type FontWeightName,
} from "./catalog.ts";
import { FONT_FILE_URLS } from "./font-urls.generated.ts";

function fileBaseName(id: string): string {
  return id.replace(/\s+/g, "_");
}

const bytesCache = new Map<string, Uint8Array>();
const inflight = new Map<string, Promise<Uint8Array>>();

export type FontSource =
  | { kind: "standard"; name: StandardFonts }
  | { kind: "embedded"; bytes: Uint8Array };

function standardFontName(
  fontFamily: string,
  weight: FontWeightName,
): StandardFonts {
  const bold = weight === "bold";
  switch (fontFamily) {
    case "Times":
      return bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
    case "Courier":
      return bold ? StandardFonts.CourierBold : StandardFonts.Courier;
    case "Helvetica":
    default:
      return bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  }
}

async function fetchFontBytes(key: string, url: string): Promise<Uint8Array> {
  const cached = bytesCache.get(key);
  if (cached) return cached;

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Font fetch failed (${res.status}) for ${key}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    bytesCache.set(key, bytes);
    return bytes;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

export async function resolveFontSource(
  fontFamily: string,
  fontWeight: FontWeightName,
): Promise<FontSource> {
  const entry = getFontEntry(fontFamily);

  // Unknown id or a standard base font → use a built-in PDF font.
  if (!entry || entry.source === "standard") {
    return { kind: "standard", name: standardFontName(fontFamily, fontWeight) };
  }

  const weight = resolveAvailableWeight(fontFamily, fontWeight);
  const key = `${fileBaseName(fontFamily)}-${weight}`;
  const url = FONT_FILE_URLS[key];

  if (!url) {
    return { kind: "standard", name: standardFontName("Helvetica", fontWeight) };
  }

  try {
    const bytes = await fetchFontBytes(key, url);
    return { kind: "embedded", bytes };
  } catch {
    // Network failure → fall back to Helvetica so export never fails.
    return { kind: "standard", name: standardFontName("Helvetica", fontWeight) };
  }
}
