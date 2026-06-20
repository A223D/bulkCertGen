"use client";

import { useEffect } from "react";
import { googleFontsStylesheetUrl } from "@/lib/batch-pdf/custom/fonts/catalog";

const LINK_ID = "batch-pdf-google-fonts";

/**
 * Injects a single Google Fonts stylesheet for every catalog font so the field
 * box preview can render each typeface. Individual font files are only fetched
 * by the browser when a glyph is actually painted in that family.
 */
export function useGoogleFonts(): void {
  useEffect(() => {
    if (document.getElementById(LINK_ID)) return;

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://fonts.gstatic.com";
    preconnect.crossOrigin = "anonymous";
    document.head.appendChild(preconnect);

    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = googleFontsStylesheetUrl();
    document.head.appendChild(link);
  }, []);
}
