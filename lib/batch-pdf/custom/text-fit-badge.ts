import type { TextFitResult } from "./text-fit.ts";

export type TextFitBadge = {
  label: string;
  tone: "warning" | "danger";
};

export function getTextFitBadge(fit: TextFitResult): TextFitBadge | null {
  if (fit.warningCode === "text_taller_than_box") {
    return { label: "Too tall", tone: "warning" };
  }

  if (fit.status === "fitsWithShrink") {
    return { label: "Shrinks", tone: "warning" };
  }

  if (fit.status === "fitsWithWrap") {
    return { label: "Wraps", tone: "warning" };
  }

  if (fit.status === "fitsWithTruncation") {
    return { label: "Truncates", tone: "warning" };
  }

  if (fit.status === "overflow") {
    return { label: "Doesn't fit", tone: "danger" };
  }

  return null;
}
