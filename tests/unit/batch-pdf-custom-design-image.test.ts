import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  encodeDesignAsBaselineJpeg,
  normalizeDesignImageBytes,
} from "@/lib/batch-pdf/custom/design-image";
import { renderCustomDesignPdfForRow } from "@/lib/batch-pdf/custom/compositor";
import { createDefaultExportOptions } from "@/lib/batch-pdf/custom/export-options";
import { createDefaultTextBoxStyle } from "@/lib/batch-pdf/custom/field-boxes";
import type {
  CustomFieldBox,
  DesignAsset,
  ExportOptions,
} from "@/lib/batch-pdf/custom/types";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures");

const PROGRESSIVE_JPEG = new Uint8Array(
  readFileSync(path.join(FIXTURES, "progressive-design.jpg")),
);

function isProgressiveJpeg(d: Uint8Array): boolean {
  for (let i = 2; i < d.length - 1; i++) {
    if (d[i] === 0xff && d[i + 1] === 0xc2) return true;
  }
  return false;
}

describe("normalizeDesignImageBytes", () => {
  it("the fixture really is a progressive JPEG", () => {
    expect(isProgressiveJpeg(PROGRESSIVE_JPEG)).toBe(true);
  });

  it("re-encodes a progressive JPEG to baseline", () => {
    const out = normalizeDesignImageBytes(PROGRESSIVE_JPEG);
    // Still a JPEG…
    expect(out[0]).toBe(0xff);
    expect(out[1]).toBe(0xd8);
    // …but no longer progressive, so it embeds as a renderable DCTDecode image.
    expect(isProgressiveJpeg(out)).toBe(false);
  });

  it("embeds into a PDF as a non-progressive image", async () => {
    const out = normalizeDesignImageBytes(PROGRESSIVE_JPEG);
    const doc = await PDFDocument.create();
    const img = await doc.embedJpg(out);
    expect(img.width).toBeGreaterThan(0);
    expect(img.height).toBeGreaterThan(0);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    const bytes = await doc.save();
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });

  it("passes non-JPEG bytes through unchanged", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
    expect(normalizeDesignImageBytes(png)).toBe(png);
  });
});

// Build a valid RGBA PNG with sharp so the test exercises a real image (tiny
// hand-crafted PNGs trip libpng's stricter reader).
const require = createRequire(import.meta.url);
const sharp = require("sharp") as (input?: unknown) => {
  png: () => { toBuffer: () => Promise<Buffer> };
};

async function makeTestPng(): Promise<Uint8Array> {
  const buf = await sharp({
    create: {
      width: 8,
      height: 8,
      channels: 4,
      background: { r: 200, g: 30, b: 30, alpha: 0.5 },
    },
  } as unknown)
    .png()
    .toBuffer();
  return new Uint8Array(buf);
}

describe("encodeDesignAsBaselineJpeg", () => {
  it("re-encodes a PNG to a baseline JPEG that pdf-lib can embed", async () => {
    const out = await encodeDesignAsBaselineJpeg(await makeTestPng());
    expect(out).not.toBeNull();
    if (!out) throw new Error("expected JPEG bytes");

    // JPEG SOI marker.
    expect(out[0]).toBe(0xff);
    expect(out[1]).toBe(0xd8);
    // Not progressive, so it embeds as a renderable DCTDecode image.
    expect(isProgressiveJpeg(out)).toBe(false);

    const doc = await PDFDocument.create();
    const img = await doc.embedJpg(out);
    expect(img.width).toBe(8);
    expect(img.height).toBe(8);
  });

  it("returns null for bytes that are not a decodable image", async () => {
    const out = await encodeDesignAsBaselineJpeg(new Uint8Array([0, 1, 2, 3, 4]));
    expect(out).toBeNull();
  });
});

describe("end-to-end: progressive JPEG design renders (regression)", () => {
  const asset: DesignAsset = {
    kind: "jpeg",
    fileName: "progressive-design.jpg",
    sizeBytes: PROGRESSIVE_JPEG.length,
    selectedPageIndex: 0,
    intrinsicWidth: 547,
    intrinsicHeight: 350,
    intrinsicUnit: "px",
    aspectRatio: 547 / 350,
  };
  const exportOptions: ExportOptions = {
    ...defaultExportOptions(),
  };
  const box: CustomFieldBox = {
    id: "b1",
    label: "Name",
    source: { type: "staticText", value: "Jane Smith" },
    rect: { x: 0.3, y: 0.4, width: 0.4, height: 0.15 },
    style: createDefaultTextBoxStyle(),
    required: false,
  };

  function defaultExportOptions(): ExportOptions {
    return {
      ...createDefaultExportOptions(),
      layoutMode: "onePerPage",
      pageSize: "sameAsDesign",
      orientation: "auto",
      itemSizeMode: "custom",
      customItemWidth: 11,
      customItemHeight: 8.5,
      unit: "in",
      cropMarks: false,
      includeOverflowReport: false,
    };
  }

  it("embeds the normalized (baseline) image, not the progressive original", async () => {
    // Without normalization the embedded image is still progressive (the bug).
    const buggy = await renderCustomDesignPdfForRow({
      designBytes: PROGRESSIVE_JPEG,
      designAsset: asset,
      row: {},
      fieldBoxes: [box],
      exportOptions,
    });
    expect(isProgressiveJpeg(buggy)).toBe(true);

    // The route normalizes first, so the embedded image is baseline → renders.
    const fixed = await renderCustomDesignPdfForRow({
      designBytes: normalizeDesignImageBytes(PROGRESSIVE_JPEG),
      designAsset: asset,
      row: {},
      fieldBoxes: [box],
      exportOptions,
    });
    expect(isProgressiveJpeg(fixed)).toBe(false);
  });
});
