import { describe, expect, it } from "vitest";
import {
  getBuiltInDesigns,
  getBuiltInDesignById,
  getBuiltInDesignByFileName,
} from "../../lib/batch-pdf/built-in-designs.ts";
import type { BuiltInDesign, BuiltInDesignCategory } from "../../lib/batch-pdf/built-in-designs.ts";

const all = getBuiltInDesigns();

const approvedSizes: Record<BuiltInDesignCategory, { widthIn: number; heightIn: number }> = {
  certificate: { widthIn: 11, heightIn: 8.5 },
  nameBadge: { widthIn: 4, heightIn: 3 },
  mailingLabel: { widthIn: 4, heightIn: 2 },
  appointmentCard: { widthIn: 3.5, heightIn: 2 },
};

describe("built-in designs catalog", () => {
  it("registers exactly eight built-in designs", () => {
    expect(all).toHaveLength(8);
  });

  it("provides exactly two designs per category", () => {
    const categories: BuiltInDesignCategory[] = [
      "certificate",
      "nameBadge",
      "mailingLabel",
      "appointmentCard",
    ];
    for (const category of categories) {
      const designs = all.filter((d) => d.category === category);
      expect(designs).toHaveLength(2);
      expect(designs.map((d) => d.variant).sort()).toEqual(["classic", "modern"]);
    }
  });

  it("every design has a unique id", () => {
    const ids = all.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every design has a unique file name", () => {
    const names = all.map((d) => d.fileName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every design has a unique public path", () => {
    const paths = all.map((d) => d.publicPath);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("every design has a valid public path matching the file name", () => {
    for (const design of all) {
      expect(design.publicPath).toBe(`/starter-designs/${design.fileName}`);
    }
  });

  it("every design has valid positive pixel dimensions", () => {
    for (const design of all) {
      expect(Number.isFinite(design.intrinsicWidth)).toBe(true);
      expect(design.intrinsicWidth).toBeGreaterThan(0);
      expect(Number.isFinite(design.intrinsicHeight)).toBe(true);
      expect(design.intrinsicHeight).toBeGreaterThan(0);
    }
  });

  it("every design has valid positive physical dimensions", () => {
    for (const design of all) {
      expect(Number.isFinite(design.finishedWidthIn)).toBe(true);
      expect(design.finishedWidthIn).toBeGreaterThan(0);
      expect(Number.isFinite(design.finishedHeightIn)).toBe(true);
      expect(design.finishedHeightIn).toBeGreaterThan(0);
    }
  });

  it("every design has exact approved physical sizes per category", () => {
    for (const design of all) {
      const approved = approvedSizes[design.category];
      expect(design.finishedWidthIn).toBe(approved.widthIn);
      expect(design.finishedHeightIn).toBe(approved.heightIn);
    }
  });

  it("every design has 300 DPI at its finished size (±1 px tolerance)", () => {
    for (const design of all) {
      const dpiX = design.intrinsicWidth / design.finishedWidthIn;
      const dpiY = design.intrinsicHeight / design.finishedHeightIn;
      // Allow up to 1 px tolerance for rounding (e.g. 300 DPI at 3.5 in = 1050 px exactly)
      expect(Math.abs(dpiX - 300)).toBeLessThanOrEqual(1);
      expect(Math.abs(dpiY - 300)).toBeLessThanOrEqual(1);
    }
  });

  it("every design has a name, description, category, and variant", () => {
    for (const design of all) {
      expect(typeof design.name).toBe("string");
      expect(design.name.length).toBeGreaterThan(0);
      expect(typeof design.description).toBe("string");
      expect(design.description.length).toBeGreaterThan(0);
      expect(["certificate", "nameBadge", "mailingLabel", "appointmentCard"]).toContain(
        design.category,
      );
      expect(["classic", "modern"]).toContain(design.variant);
    }
  });

  it("no catalog entry contains field boxes or mappings", () => {
    for (const design of all) {
      // The catalog type should not have any field box or mapping properties
      expect((design as Record<string, unknown>).fieldBoxes).toBeUndefined();
      expect((design as Record<string, unknown>).mapping).toBeUndefined();
      expect((design as Record<string, unknown>).sources).toBeUndefined();
      expect((design as Record<string, unknown>).textStyles).toBeUndefined();
      expect((design as Record<string, unknown>).rectangles).toBeUndefined();
    }
  });

  it("getBuiltInDesignById resolves each design and returns null for unknowns", () => {
    for (const design of all) {
      const found = getBuiltInDesignById(design.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(design.id);
    }
    expect(getBuiltInDesignById("nonexistent")).toBeNull();
  });

  it("getBuiltInDesignByFileName resolves each design and returns null for unknowns", () => {
    for (const design of all) {
      const found = getBuiltInDesignByFileName(design.fileName);
      expect(found).not.toBeNull();
      expect(found!.fileName).toBe(design.fileName);
    }
    expect(getBuiltInDesignByFileName("nonexistent.png")).toBeNull();
  });

  it("getBuiltInDesigns returns a fresh copy each time", () => {
    const a = getBuiltInDesigns();
    const b = getBuiltInDesigns();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
