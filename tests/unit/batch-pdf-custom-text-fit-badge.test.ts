import { describe, expect, it } from "vitest";
import { getTextFitBadge } from "../../lib/batch-pdf/custom/text-fit-badge.ts";
import type { TextFitResult, TextFitStatus } from "../../lib/batch-pdf/custom/text-fit.ts";

function fit(overrides: Partial<TextFitResult> = {}): TextFitResult {
  return {
    status: "fits",
    originalTextLength: 4,
    renderedText: "Text",
    fontSize: 12,
    lineCount: 1,
    overflowMode: "shrinkToFit",
    blocksExport: false,
    ...overrides,
  };
}

describe("getTextFitBadge", () => {
  it.each([
    ["fitsWithShrink", "Shrinks", "warning"],
    ["fitsWithWrap", "Wraps", "warning"],
    ["fitsWithTruncation", "Truncates", "warning"],
    ["overflow", "Doesn't fit", "danger"],
  ] as const)("maps %s to the visible badge", (status, label, tone) => {
    expect(getTextFitBadge(fit({ status: status as TextFitStatus }))).toEqual({
      label,
      tone,
    });
  });

  it("prioritizes the text-height warning over truncate status", () => {
    expect(
      getTextFitBadge(
        fit({
          status: "fitsWithTruncation",
          warningCode: "text_taller_than_box",
        }),
      ),
    ).toEqual({ label: "Too tall", tone: "warning" });
  });

  it("does not show a badge for fully fitting text", () => {
    expect(getTextFitBadge(fit())).toBeNull();
  });
});
