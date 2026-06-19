import { describe, expect, it } from "vitest";
import { calculateSheetLayout } from "../../lib/batch-pdf/custom/sheet-layout.ts";

// Letter page in PDF points.
const LETTER_W = 612;
const LETTER_H = 792;

function baseArgs(overrides: Partial<Parameters<typeof calculateSheetLayout>[0]> = {}) {
  return {
    rowCount: 5,
    pageWidthPt: LETTER_W,
    pageHeightPt: LETTER_H,
    itemWidthPt: 180,
    itemHeightPt: 90,
    marginTopPt: 18,
    marginRightPt: 18,
    marginBottomPt: 18,
    marginLeftPt: 18,
    gapXPt: 9,
    gapYPt: 9,
    ...overrides,
  };
}

describe("calculateSheetLayout", () => {
  it("calculates columns/rows/itemsPerPage for Letter page and small badge item", () => {
    const result = calculateSheetLayout(baseArgs({ rowCount: 1 }));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected layout");

    // usableWidth = 612 - 36 = 576; columns = floor((576+9)/(180+9)) = 3
    // usableHeight = 792 - 36 = 756; rows = floor((756+9)/(90+9)) = 7
    expect(result.value.columns).toBe(3);
    expect(result.value.rows).toBe(7);
    expect(result.value.itemsPerPage).toBe(21);
    expect(result.value.usableWidthPt).toBe(576);
    expect(result.value.usableHeightPt).toBe(756);
  });

  it("uses PDF points consistently (page dims pass through)", () => {
    const result = calculateSheetLayout(baseArgs({ rowCount: 1 }));
    if (!result.ok) throw new Error("expected layout");
    expect(result.value.pageWidthPt).toBe(LETTER_W);
    expect(result.value.pageHeightPt).toBe(LETTER_H);
    expect(result.value.itemWidthPt).toBe(180);
    expect(result.value.itemHeightPt).toBe(90);
  });

  it("supports landscape page dimensions", () => {
    const result = calculateSheetLayout(
      baseArgs({ rowCount: 1, pageWidthPt: LETTER_H, pageHeightPt: LETTER_W }),
    );
    if (!result.ok) throw new Error("expected layout");
    // usableWidth = 792 - 36 = 756; columns = floor(765/189) = 4
    expect(result.value.columns).toBe(4);
  });

  it("places multiple pages when more items than fit on one page", () => {
    // Force a 1-per-page layout, then request 3 rows.
    const result = calculateSheetLayout(
      baseArgs({
        rowCount: 3,
        itemWidthPt: 400,
        itemHeightPt: 700,
        marginTopPt: 0,
        marginRightPt: 0,
        marginBottomPt: 0,
        marginLeftPt: 0,
        gapXPt: 0,
        gapYPt: 0,
      }),
    );
    if (!result.ok) throw new Error("expected layout");
    expect(result.value.itemsPerPage).toBe(1);
    expect(result.value.pageCount).toBe(3);
    expect(result.value.pages).toHaveLength(3);
    expect(result.value.pages[0].items).toHaveLength(1);
    expect(result.value.pages[2].items[0].rowIndex).toBe(2);
  });

  it("handles one item per page", () => {
    const result = calculateSheetLayout(
      baseArgs({
        rowCount: 1,
        itemWidthPt: 400,
        itemHeightPt: 700,
        marginTopPt: 0,
        marginRightPt: 0,
        marginBottomPt: 0,
        marginLeftPt: 0,
        gapXPt: 0,
        gapYPt: 0,
      }),
    );
    if (!result.ok) throw new Error("expected layout");
    expect(result.value.itemsPerPage).toBe(1);
    expect(result.value.pageCount).toBe(1);
  });

  it("preserves row order across the grid", () => {
    const result = calculateSheetLayout(baseArgs({ rowCount: 10 }));
    if (!result.ok) throw new Error("expected layout");
    const flat = result.value.pages.flatMap((p) => p.items.map((i) => i.rowIndex));
    expect(flat).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // First row top-left; second item one column to the right.
    const first = result.value.pages[0].items[0];
    const second = result.value.pages[0].items[1];
    expect(first.xPt).toBe(18);
    expect(first.yPt).toBe(18);
    expect(second.yPt).toBe(18);
    expect(second.xPt).toBeGreaterThan(first.xPt);
  });

  it("handles zero rows safely", () => {
    const result = calculateSheetLayout(baseArgs({ rowCount: 0 }));
    if (!result.ok) throw new Error("expected layout");
    expect(result.value.pageCount).toBe(0);
    expect(result.value.pages).toHaveLength(0);
    expect(result.value.itemsPerPage).toBeGreaterThan(0);
  });

  it("rejects margins that leave no usable area", () => {
    const result = calculateSheetLayout(
      baseArgs({ marginLeftPt: 320, marginRightPt: 320 }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.errors[0].code).toBe("custom_sheet_no_usable_area");
  });

  it("rejects an item larger than the usable page area", () => {
    const result = calculateSheetLayout(
      baseArgs({ itemWidthPt: 5000, itemHeightPt: 5000 }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.errors[0].code).toBe("custom_sheet_item_too_large");
  });

  it("rejects negative margins or gaps", () => {
    expect(calculateSheetLayout(baseArgs({ marginTopPt: -1 })).ok).toBe(false);
    expect(calculateSheetLayout(baseArgs({ gapXPt: -1 })).ok).toBe(false);
  });

  it("rejects non-positive page or item sizes", () => {
    expect(calculateSheetLayout(baseArgs({ pageWidthPt: 0 })).ok).toBe(false);
    expect(calculateSheetLayout(baseArgs({ itemHeightPt: 0 })).ok).toBe(false);
  });
});
