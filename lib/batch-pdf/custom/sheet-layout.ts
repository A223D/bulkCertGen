import type { Result } from "../types.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SheetLayoutItem = {
  rowIndex: number;
  pageIndex: number;
  // Top-left logical coordinates in PDF points (y measured from the page top).
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
};

export type SheetLayoutPage = {
  pageIndex: number;
  items: SheetLayoutItem[];
};

export type SheetLayoutResult = {
  pageWidthPt: number;
  pageHeightPt: number;
  itemWidthPt: number;
  itemHeightPt: number;
  usableWidthPt: number;
  usableHeightPt: number;
  columns: number;
  rows: number;
  itemsPerPage: number;
  pageCount: number;
  pages: SheetLayoutPage[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function error(code: string, message: string): Result<never> {
  return { ok: false, errors: [{ code, message }] };
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

// ---------------------------------------------------------------------------
// Layout engine
// ---------------------------------------------------------------------------

/**
 * Calculates a print-sheet grid layout in PDF points.
 *
 * Coordinates are returned using a top-left logical origin (y measured from the
 * page top). The compositor is responsible for converting to pdf-lib's
 * bottom-left coordinate space.
 */
export function calculateSheetLayout(args: {
  rowCount: number;
  pageWidthPt: number;
  pageHeightPt: number;
  itemWidthPt: number;
  itemHeightPt: number;
  marginTopPt: number;
  marginRightPt: number;
  marginBottomPt: number;
  marginLeftPt: number;
  gapXPt: number;
  gapYPt: number;
}): Result<SheetLayoutResult> {
  const {
    rowCount,
    pageWidthPt,
    pageHeightPt,
    itemWidthPt,
    itemHeightPt,
    marginTopPt,
    marginRightPt,
    marginBottomPt,
    marginLeftPt,
    gapXPt,
    gapYPt,
  } = args;

  if (
    !isNonNegativeFinite(rowCount) ||
    !Number.isInteger(rowCount)
  ) {
    return error("custom_sheet_invalid_row_count", "Row count must be a whole number of zero or more.");
  }

  if (!isPositiveFinite(pageWidthPt) || !isPositiveFinite(pageHeightPt)) {
    return error("custom_sheet_invalid_page_size", "Page size must be greater than zero.");
  }

  if (!isPositiveFinite(itemWidthPt) || !isPositiveFinite(itemHeightPt)) {
    return error("custom_sheet_invalid_item_size", "Item size must be greater than zero.");
  }

  if (
    !isNonNegativeFinite(marginTopPt) ||
    !isNonNegativeFinite(marginRightPt) ||
    !isNonNegativeFinite(marginBottomPt) ||
    !isNonNegativeFinite(marginLeftPt) ||
    !isNonNegativeFinite(gapXPt) ||
    !isNonNegativeFinite(gapYPt)
  ) {
    return error("custom_sheet_invalid_spacing", "Margins and gaps must be zero or greater.");
  }

  const usableWidthPt = pageWidthPt - marginLeftPt - marginRightPt;
  const usableHeightPt = pageHeightPt - marginTopPt - marginBottomPt;

  if (usableWidthPt <= 0 || usableHeightPt <= 0) {
    return error(
      "custom_sheet_no_usable_area",
      "Margins leave no printable area on the page.",
    );
  }

  const columns = Math.floor((usableWidthPt + gapXPt) / (itemWidthPt + gapXPt));
  const rows = Math.floor((usableHeightPt + gapYPt) / (itemHeightPt + gapYPt));

  if (columns < 1 || rows < 1) {
    return error(
      "custom_sheet_item_too_large",
      "The item is too large to fit on the page with these margins.",
    );
  }

  const itemsPerPage = columns * rows;

  if (itemsPerPage < 1) {
    return error(
      "custom_sheet_item_too_large",
      "The item is too large to fit on the page with these margins.",
    );
  }

  const pageCount = rowCount === 0 ? 0 : Math.ceil(rowCount / itemsPerPage);
  const pages: SheetLayoutPage[] = [];

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    pages.push({ pageIndex, items: [] });
  }

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const pageIndex = Math.floor(rowIndex / itemsPerPage);
    const withinPage = rowIndex % itemsPerPage;
    const col = withinPage % columns;
    const rowInPage = Math.floor(withinPage / columns);

    const xPt = marginLeftPt + col * (itemWidthPt + gapXPt);
    const yPt = marginTopPt + rowInPage * (itemHeightPt + gapYPt);

    pages[pageIndex].items.push({
      rowIndex,
      pageIndex,
      xPt,
      yPt,
      widthPt: itemWidthPt,
      heightPt: itemHeightPt,
    });
  }

  return {
    ok: true,
    value: {
      pageWidthPt,
      pageHeightPt,
      itemWidthPt,
      itemHeightPt,
      usableWidthPt,
      usableHeightPt,
      columns,
      rows,
      itemsPerPage,
      pageCount,
      pages,
    },
  };
}
