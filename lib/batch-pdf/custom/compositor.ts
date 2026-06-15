import { PDFDocument, rgb } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";
import { normalizedRectToPoints } from "./coordinates.ts";
import { resolveDesignItemSizeForPreflight } from "./preflight.ts";
import { resolveTextFit } from "./text-fit.ts";
import { estimateTextBlockHeightPt } from "./text-measurement.ts";
import {
  calculateTextStartPosition,
  parseHexColorToRgb,
  resolvePdfFontName,
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

export async function renderCustomDesignPdfForRow(
  input: CustomRenderInput,
): Promise<Uint8Array> {
  const { designBytes, designAsset, row, fieldBoxes, exportOptions } = input;

  const outputDoc = await PDFDocument.create();

  let page: PDFPage;
  let pageWidthPt: number;
  let pageHeightPt: number;

  if (designAsset.kind === "pdf") {
    const designDoc = await PDFDocument.load(designBytes);
    const designPages = designDoc.getPages();

    if (designPages.length === 0) {
      throw new Error("Design PDF has no pages.");
    }

    const { width, height } = designPages[0].getSize();
    pageWidthPt = width;
    pageHeightPt = height;

    const [embeddedPage] = await outputDoc.embedPdf(designDoc, [0]);
    page = outputDoc.addPage([pageWidthPt, pageHeightPt]);
    page.drawPage(embeddedPage, { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt });
  } else {
    const sizeResult = resolveDesignItemSizeForPreflight({
      design: designAsset,
      exportOptions,
    });

    if (!sizeResult.ok) {
      throw new Error(
        "Image design requires a physical item size. Set width and height in the preflight panel.",
      );
    }

    pageWidthPt = sizeResult.value.widthPt;
    pageHeightPt = sizeResult.value.heightPt;
    page = outputDoc.addPage([pageWidthPt, pageHeightPt]);

    const image =
      designAsset.kind === "png"
        ? await outputDoc.embedPng(designBytes)
        : await outputDoc.embedJpg(designBytes);

    page.drawImage(image, { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt });
  }

  await drawFieldBoxesOnPage(
    outputDoc,
    page,
    row,
    fieldBoxes,
    pageWidthPt,
    pageHeightPt,
  );

  return outputDoc.save();
}

// ---------------------------------------------------------------------------
// Field box drawing
// ---------------------------------------------------------------------------

function getRawTextForBox(row: CsvRow, box: CustomFieldBox): string {
  if (box.source.type === "staticText") return box.source.value;
  return row[box.source.column] ?? "";
}

async function drawFieldBoxesOnPage(
  doc: PDFDocument,
  page: PDFPage,
  row: CsvRow,
  fieldBoxes: CustomFieldBox[],
  pageWidthPt: number,
  pageHeightPt: number,
): Promise<void> {
  const fontCache = new Map<string, PDFFont>();

  async function getFont(
    fontFamily: TextBoxStyle["fontFamily"],
    fontWeight: TextBoxStyle["fontWeight"],
  ): Promise<PDFFont> {
    const cacheKey = `${fontFamily}/${fontWeight}`;
    const cached = fontCache.get(cacheKey);
    if (cached) return cached;
    const fontName = resolvePdfFontName({ fontFamily, fontWeight });
    const font = await doc.embedFont(fontName);
    fontCache.set(cacheKey, font);
    return font;
  }

  for (const box of fieldBoxes) {
    const rawText = getRawTextForBox(row, box);

    // Missing optional value → render blank (no drawing needed).
    if (rawText === "" && !box.required) {
      continue;
    }

    // Convert normalized rect to physical coordinates in pdf-lib space.
    // normalizedRectToPoints returns x,y where y is from page TOP (browser origin).
    const physRect = normalizedRectToPoints({
      rect: box.rect,
      pageWidthPt,
      pageHeightPt,
    });

    const boxX = physRect.x;
    // Convert top-left y to bottom-left y for pdf-lib.
    const boxY = pageHeightPt - physRect.y - physRect.height;
    const boxWidth = physRect.width;
    const boxHeight = physRect.height;

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

      // Compute y start from calculateTextStartPosition (x handled per line).
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
        const lineX = resolveLineX(lineText, lineWidth, boxX, boxWidth, box.style.align);
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
  _lineText: string,
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
