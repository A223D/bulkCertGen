import {
  PDFBool,
  PDFDocument,
  PDFName,
  PDFRawStream,
  rgb,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { PDFFont, PDFPage } from "pdf-lib";
import { normalizedRectToPoints } from "./coordinates.ts";
import { calculateCropMarks } from "./crop-marks.ts";
import { resolveSheetLayoutForExport } from "./export-options.ts";
import { resolveDesignItemSizeForPreflight } from "./preflight.ts";
import { resolveTextFit } from "./text-fit.ts";
import { estimateTextBlockHeightPt } from "./text-measurement.ts";
import { resolveFontSource } from "./fonts/server-fonts.ts";
import {
  calculateTextStartPosition,
  parseHexColorToRgb,
} from "./pdf-text.ts";
import type { CsvRow } from "../types.ts";
import type { CustomFieldBox, DesignAsset, ExportOptions, TextBoxStyle } from "./types.ts";

export type CustomRenderInput = {
  designBytes: Uint8Array;
  designAsset: DesignAsset;
  row: CsvRow;
  fieldBoxes: CustomFieldBox[];
  exportOptions: ExportOptions;
};

// Item rectangle in top-left logical points (y measured from the page top).
export type ItemRect = {
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
};

type FontFactory = (
  fontFamily: TextBoxStyle["fontFamily"],
  fontWeight: TextBoxStyle["fontWeight"],
) => Promise<PDFFont>;

// Draws the design background into an item rectangle on the given page.
type BackgroundDrawer = (page: PDFPage, itemRect: ItemRect) => void;

// Some lightweight and older PDF viewers fail to resolve pdf-lib's compressed
// object/xref streams and display an otherwise valid custom export as a blank
// page. Classic indirect objects and an xref table are larger, but maximize
// compatibility for files intended to be downloaded and opened anywhere.
const COMPATIBLE_PDF_SAVE_OPTIONS = { useObjectStreams: false } as const;

async function saveCompatiblePdf(document: PDFDocument): Promise<Uint8Array> {
  const bytes = await document.save(COMPATIBLE_PDF_SAVE_OPTIONS);

  // pdf-lib's classic writer always advertises PDF 1.7. This renderer only
  // uses PDF 1.4 features, and the version strings have equal length, so the
  // one-byte change preserves every xref offset while avoiding viewer-specific
  // PDF 1.7 rendering paths.
  if (
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d && // -
    bytes[5] === 0x31 && // 1
    bytes[6] === 0x2e // .
  ) {
    bytes[7] = 0x34; // 4
  }

  return bytes;
}

// ---------------------------------------------------------------------------
// One PDF per row (Phase 11 behavior, refactored onto the shared item renderer)
// ---------------------------------------------------------------------------

export async function renderCustomDesignPdfForRow(
  input: CustomRenderInput,
): Promise<Uint8Array> {
  const { designBytes, designAsset, row, fieldBoxes, exportOptions } = input;

  const sizeResult = resolveDesignItemSizeForPreflight({
    design: designAsset,
    exportOptions,
  });

  if (!sizeResult.ok) {
    throw new Error(
      "Image design requires a physical item size. Set width and height in the export options.",
    );
  }

  const pageWidthPt = sizeResult.value.widthPt;
  const pageHeightPt = sizeResult.value.heightPt;

  const outputDoc = await PDFDocument.create();
  const page = outputDoc.addPage([pageWidthPt, pageHeightPt]);

  await drawCustomDesignItemOnPage({
    outputPdf: outputDoc,
    page,
    designBytes,
    designAsset,
    row,
    fieldBoxes,
    exportOptions,
    itemRect: { xPt: 0, yPt: 0, widthPt: pageWidthPt, heightPt: pageHeightPt },
  });

  return saveCompatiblePdf(outputDoc);
}

// ---------------------------------------------------------------------------
// Print sheets — fit multiple per page
// ---------------------------------------------------------------------------

export async function renderCustomDesignPrintSheets(args: {
  designBytes: Uint8Array;
  designAsset: DesignAsset;
  rows: CsvRow[];
  fieldBoxes: CustomFieldBox[];
  exportOptions: ExportOptions;
}): Promise<Uint8Array> {
  const { designBytes, designAsset, rows, fieldBoxes, exportOptions } = args;

  // Resolves item + page size and the chosen orientation (fewest pages for "auto").
  const resolved = resolveSheetLayoutForExport({
    exportOptions,
    designAsset,
    rowCount: rows.length,
  });
  if (!resolved.ok) {
    throw new Error("Could not lay out the print sheet with these options.");
  }

  const layout = resolved.value.layout;

  const outputPdf = await PDFDocument.create();
  const drawBackground = await embedBackgroundDrawer(outputPdf, designBytes, designAsset);
  const getFont = makeFontFactory(outputPdf);

  // Always produce at least one (possibly empty) page so the PDF is valid.
  const pages = layout.pages.length > 0 ? layout.pages : [{ pageIndex: 0, items: [] }];

  for (const layoutPage of pages) {
    const pdfPage = outputPdf.addPage([layout.pageWidthPt, layout.pageHeightPt]);

    for (const item of layoutPage.items) {
      const row = rows[item.rowIndex] ?? {};
      await drawItemContent({
        page: pdfPage,
        drawBackground,
        getFont,
        row,
        fieldBoxes,
        exportOptions,
        itemRect: {
          xPt: item.xPt,
          yPt: item.yPt,
          widthPt: item.widthPt,
          heightPt: item.heightPt,
        },
      });
    }
  }

  return saveCompatiblePdf(outputPdf);
}

// ---------------------------------------------------------------------------
// Reusable item renderer
// ---------------------------------------------------------------------------

export async function drawCustomDesignItemOnPage(args: {
  outputPdf: PDFDocument;
  page: PDFPage;
  designBytes: Uint8Array;
  designAsset: DesignAsset;
  row: CsvRow;
  fieldBoxes: CustomFieldBox[];
  exportOptions: ExportOptions;
  itemRect: ItemRect;
}): Promise<void> {
  const { outputPdf, page, designBytes, designAsset, row, fieldBoxes, exportOptions, itemRect } =
    args;

  const drawBackground = await embedBackgroundDrawer(outputPdf, designBytes, designAsset);
  const getFont = makeFontFactory(outputPdf);

  await drawItemContent({
    page,
    drawBackground,
    getFont,
    row,
    fieldBoxes,
    exportOptions,
    itemRect,
  });
}

async function drawItemContent(args: {
  page: PDFPage;
  drawBackground: BackgroundDrawer;
  getFont: FontFactory;
  row: CsvRow;
  fieldBoxes: CustomFieldBox[];
  exportOptions: ExportOptions;
  itemRect: ItemRect;
}): Promise<void> {
  const { page, drawBackground, getFont, row, fieldBoxes, exportOptions, itemRect } = args;

  drawBackground(page, itemRect);

  await drawFieldBoxesInRect({
    page,
    pageHeightPt: page.getHeight(),
    row,
    fieldBoxes,
    itemRect,
    getFont,
  });

  if (exportOptions.cropMarks) {
    const bottomLeftY = page.getHeight() - itemRect.yPt - itemRect.heightPt;
    const lines = calculateCropMarks({
      xPt: itemRect.xPt,
      yPt: bottomLeftY,
      widthPt: itemRect.widthPt,
      heightPt: itemRect.heightPt,
    });

    for (const line of lines) {
      page.drawLine({
        start: { x: line.x1, y: line.y1 },
        end: { x: line.x2, y: line.y2 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Background embedding
// ---------------------------------------------------------------------------

async function embedBackgroundDrawer(
  outputPdf: PDFDocument,
  designBytes: Uint8Array,
  designAsset: DesignAsset,
): Promise<BackgroundDrawer> {
  const image =
    designAsset.kind === "png"
      ? await outputPdf.embedPng(designBytes)
      : await outputPdf.embedJpg(designBytes);

  // Embed now so we can set the image rendering intent before the document is
  // saved. Interpolation improves the appearance of raster designs whenever a
  // viewer displays or prints them at a size different from their pixel grid.
  await image.embed();
  const imageStream = outputPdf.context.lookup(image.ref);
  if (imageStream instanceof PDFRawStream) {
    imageStream.dict.set(PDFName.of("Interpolate"), PDFBool.True);
  }

  return (page, itemRect) => {
    const bottomLeftY = page.getHeight() - itemRect.yPt - itemRect.heightPt;
    page.drawImage(image, {
      x: itemRect.xPt,
      y: bottomLeftY,
      width: itemRect.widthPt,
      height: itemRect.heightPt,
    });
  };
}

function makeFontFactory(doc: PDFDocument): FontFactory {
  const fontCache = new Map<string, PDFFont>();
  // Required before embedding any custom (non-standard) font.
  doc.registerFontkit(fontkit);

  return async (fontFamily, fontWeight) => {
    const cacheKey = `${fontFamily}/${fontWeight}`;
    const cached = fontCache.get(cacheKey);
    if (cached) return cached;
    const source = await resolveFontSource(fontFamily, fontWeight);
    const font =
      source.kind === "standard"
        ? await doc.embedFont(source.name)
        : await doc.embedFont(source.bytes, { subset: true });
    fontCache.set(cacheKey, font);
    return font;
  };
}

// ---------------------------------------------------------------------------
// Field box drawing
// ---------------------------------------------------------------------------

function getRawTextForBox(row: CsvRow, box: CustomFieldBox): string {
  if (box.source.type === "staticText") return box.source.value;
  return row[box.source.column] ?? "";
}

/**
 * Draws each field box's text inside the given item rectangle.
 *
 * Field box rects are normalized relative to the item, not the full page.
 * Browser/editor coordinates use a top-left origin; pdf-lib uses bottom-left,
 * so the y axis is inverted here using the full page height.
 */
async function drawFieldBoxesInRect(args: {
  page: PDFPage;
  pageHeightPt: number;
  row: CsvRow;
  fieldBoxes: CustomFieldBox[];
  itemRect: ItemRect;
  getFont: FontFactory;
}): Promise<void> {
  const { page, pageHeightPt, row, fieldBoxes, itemRect, getFont } = args;

  for (const box of fieldBoxes) {
    const rawText = getRawTextForBox(row, box);

    // Missing optional value → render blank (no drawing needed).
    if (rawText === "" && !box.required) {
      continue;
    }

    // Convert normalized rect (relative to the item) into item-local points.
    const localRect = normalizedRectToPoints({
      rect: box.rect,
      pageWidthPt: itemRect.widthPt,
      pageHeightPt: itemRect.heightPt,
    });

    // Offset by the item's position within the page, then invert y for pdf-lib.
    const absXFromLeft = itemRect.xPt + localRect.x;
    const absYFromTop = itemRect.yPt + localRect.y;

    const boxX = absXFromLeft;
    const boxY = pageHeightPt - absYFromTop - localRect.height;
    const boxWidth = localRect.width;
    const boxHeight = localRect.height;

    const fitResult = resolveTextFit({
      text: rawText,
      box: { widthPt: boxWidth, heightPt: boxHeight },
      style: box.style,
    });

    // Skip if export is blocked (preflight should have caught this already).
    if (fitResult.blocksExport || !fitResult.renderedText) {
      continue;
    }

    const font = await getFont(box.style.fontFamily, box.style.fontWeight);
    const fontSize = fitResult.fontSize;

    const colorResult = parseHexColorToRgb(box.style.color);
    const pdfColor = colorResult.ok
      ? rgb(colorResult.value.r, colorResult.value.g, colorResult.value.b)
      : rgb(0, 0, 0);

    const lineHeightPt = fontSize * box.style.lineHeight;

    if (box.style.overflowMode === "wrap" && fitResult.lineCount > 1) {
      const lines = fitResult.renderedText.split("\n");
      const totalHeight = estimateTextBlockHeightPt({
        lineCount: lines.length,
        fontSize,
        lineHeight: box.style.lineHeight,
      });

      const { y: startY } = calculateTextStartPosition({
        boxX,
        boxY,
        boxWidth,
        boxHeight,
        textWidth: 0,
        textHeight: totalHeight,
        fontSize,
        align: box.style.align,
        verticalAlign: box.style.verticalAlign,
      });

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        if (!lineText) continue;

        const lineWidth = font.widthOfTextAtSize(lineText, fontSize);
        const lineX = resolveLineX(lineWidth, boxX, boxWidth, box.style.align);
        const lineY = startY - i * lineHeightPt;

        page.drawText(lineText, {
          x: lineX,
          y: lineY,
          size: fontSize,
          font,
          color: pdfColor,
        });
      }
    } else {
      const displayText = fitResult.renderedText;
      const textWidth = font.widthOfTextAtSize(displayText, fontSize);
      const textHeight = lineHeightPt;

      const { x, y } = calculateTextStartPosition({
        boxX,
        boxY,
        boxWidth,
        boxHeight,
        textWidth,
        textHeight,
        fontSize,
        align: box.style.align,
        verticalAlign: box.style.verticalAlign,
      });

      page.drawText(displayText, {
        x,
        y,
        size: fontSize,
        font,
        color: pdfColor,
      });
    }
  }
}

function resolveLineX(
  lineWidth: number,
  boxX: number,
  boxWidth: number,
  align: TextBoxStyle["align"],
): number {
  switch (align) {
    case "right":
      return boxX + boxWidth - lineWidth;
    case "center":
      return boxX + (boxWidth - lineWidth) / 2;
    default:
      return boxX;
  }
}
