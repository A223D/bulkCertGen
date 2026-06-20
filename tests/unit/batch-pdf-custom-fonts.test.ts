import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  DEFAULT_FONT_FAMILY,
  FONT_CATALOG,
  cssFontStack,
  getFontEntry,
  isKnownFontFamily,
  resolveAvailableWeight,
} from "@/lib/batch-pdf/custom/fonts/catalog";
import { FONT_METRICS } from "@/lib/batch-pdf/custom/fonts/metrics.generated";
import { FONT_FILE_URLS } from "@/lib/batch-pdf/custom/fonts/font-urls.generated";
import { resolveFontSource } from "@/lib/batch-pdf/custom/fonts/server-fonts";

// Real TTF used to stand in for any CDN font fetch so embedding stays hermetic.
const FIXTURE_FONT = new Uint8Array(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../fixtures/sample-font.ttf",
    ),
  ),
);

function stubFontFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(FIXTURE_FONT, { status: 200 })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});
import { estimateTextWidthPt } from "@/lib/batch-pdf/custom/text-measurement";
import { validateTextBoxStyle } from "@/lib/batch-pdf/custom/field-boxes";
import { createDefaultTextBoxStyle } from "@/lib/batch-pdf/custom/field-boxes";

describe("font catalog", () => {
  it("includes the default font and standard base fonts", () => {
    expect(isKnownFontFamily(DEFAULT_FONT_FAMILY)).toBe(true);
    for (const id of ["Helvetica", "Times", "Courier"]) {
      expect(getFontEntry(id)?.source).toBe("standard");
    }
  });

  it("offers a broad set of Google fonts", () => {
    const google = FONT_CATALOG.filter((f) => f.source === "google");
    expect(google.length).toBeGreaterThanOrEqual(40);
  });

  it("rejects unknown font families", () => {
    expect(isKnownFontFamily("Comic Papyrus 9000")).toBe(false);
  });

  it("falls back single-weight fonts to normal", () => {
    const single = FONT_CATALOG.find(
      (f) => f.source === "google" && !f.weights.includes("bold"),
    );
    expect(single).toBeDefined();
    expect(resolveAvailableWeight(single!.id, "bold")).toBe("normal");
  });

  it("builds a quoted CSS stack for Google fonts", () => {
    expect(cssFontStack("Roboto")).toContain('"Roboto"');
    expect(cssFontStack("Helvetica")).toContain("Helvetica");
  });
});

describe("font style validation against the catalog", () => {
  it("accepts a Google font id", () => {
    const style = { ...createDefaultTextBoxStyle(), fontFamily: "Montserrat" };
    expect(validateTextBoxStyle(style).ok).toBe(true);
  });

  it("rejects an unknown font id", () => {
    const style = { ...createDefaultTextBoxStyle(), fontFamily: "Not A Font" };
    expect(validateTextBoxStyle(style).ok).toBe(false);
  });
});

describe("text measurement with Google font metrics", () => {
  it("uses the generated width table rather than the Helvetica estimate", () => {
    const roboto = FONT_METRICS["Roboto"]?.normal;
    expect(roboto).toBeDefined();
    // 'W' is wide; the generated table should match the measured advance.
    const expected = ((roboto!.widths["W"]) / 1000) * 40;
    const measured = estimateTextWidthPt({
      text: "W",
      fontFamily: "Roboto",
      fontWeight: "normal",
      fontSize: 40,
    });
    expect(measured).toBeCloseTo(expected, 5);
  });

  it("falls back to Helvetica width for unknown families", () => {
    const unknown = estimateTextWidthPt({
      text: "Hello",
      fontFamily: "Totally Unknown",
      fontWeight: "normal",
      fontSize: 24,
    });
    const helvetica = estimateTextWidthPt({
      text: "Hello",
      fontFamily: "Helvetica",
      fontWeight: "normal",
      fontSize: 24,
    });
    expect(unknown).toBeCloseTo(helvetica, 5);
  });
});

describe("server-side font embedding", () => {
  it("records a CDN URL for every Google font weight", () => {
    expect(FONT_FILE_URLS["Roboto-normal"]).toMatch(/^https:\/\/fonts\.gstatic\.com\//);
    expect(FONT_FILE_URLS["Playfair_Display-bold"]).toMatch(/\.ttf$/);
  });

  it("resolves standard fonts to built-ins without fetching", async () => {
    stubFontFetch();
    const src = await resolveFontSource("Helvetica", "bold");
    expect(src.kind).toBe("standard");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches Google fonts from the CDN and caches the bytes", async () => {
    stubFontFetch();
    const src = await resolveFontSource("Lato", "bold");
    expect(src.kind).toBe("embedded");
    // Second resolution of the same font is served from cache (no extra fetch).
    await resolveFontSource("Lato", "bold");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to Helvetica when the fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 503 })),
    );
    const src = await resolveFontSource("Anton", "normal");
    expect(src.kind).toBe("standard");
  });

  it("embeds a fetched Google font into a PDF document", async () => {
    stubFontFetch();
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const src = await resolveFontSource("Montserrat", "normal");
    expect(src.kind).toBe("embedded");
    if (src.kind !== "embedded") return;
    const font = await doc.embedFont(src.bytes, { subset: true });
    const page = doc.addPage([200, 100]);
    page.drawText("Sample", { x: 10, y: 40, size: 24, font });
    const bytes = await doc.save();
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
