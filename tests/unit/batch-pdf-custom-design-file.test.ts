import { describe, expect, it } from "vitest";
import { CUSTOM_DESIGN_LIMITS } from "../../lib/batch-pdf/limits.ts";
import {
  getDesignFileKindFromMimeType,
  getDesignFileKindFromName,
  validateDesignFileMetadata,
} from "../../lib/batch-pdf/custom/design-file.ts";

describe("custom design file utilities", () => {
  it("rejects .pdf", () => {
    expect(getDesignFileKindFromName("design.pdf")).toBeNull();
    expect(validateDesignFileMetadata({ fileName: "design.pdf", sizeBytes: 1 }).ok).toBe(
      false,
    );
  });

  it("accepts .png", () => {
    expect(getDesignFileKindFromName("design.png")).toBe("png");
    expect(validateDesignFileMetadata({ fileName: "design.png", sizeBytes: 1 }).ok).toBe(
      true,
    );
  });

  it("accepts .jpg", () => {
    expect(getDesignFileKindFromName("design.jpg")).toBe("jpeg");
    expect(validateDesignFileMetadata({ fileName: "design.jpg", sizeBytes: 1 }).ok).toBe(
      true,
    );
  });

  it("accepts .jpeg", () => {
    expect(getDesignFileKindFromName("design.jpeg")).toBe("jpeg");
    expect(validateDesignFileMetadata({ fileName: "design.jpeg", sizeBytes: 1 }).ok).toBe(
      true,
    );
  });

  it("accepts uppercase image extensions", () => {
    expect(getDesignFileKindFromName("DESIGN.PNG")).toBe("png");
    expect(validateDesignFileMetadata({ fileName: "DESIGN.PNG", sizeBytes: 1 }).ok).toBe(
      true,
    );
  });

  it("does not map application/pdf", () => {
    expect(getDesignFileKindFromMimeType("application/pdf")).toBeNull();
  });

  it("maps image/png to png", () => {
    expect(getDesignFileKindFromMimeType("image/png")).toBe("png");
  });

  it("maps image/jpeg to jpeg", () => {
    expect(getDesignFileKindFromMimeType("image/jpeg")).toBe("jpeg");
  });

  it("rejects unsupported extensions such as .gif, .svg, .docx", () => {
    for (const fileName of ["design.gif", "design.svg", "design.docx"]) {
      const result = validateDesignFileMetadata({ fileName, sizeBytes: 1 });

      expect(result.ok, fileName).toBe(false);
    }
  });

  it("rejects oversized files", () => {
    const result = validateDesignFileMetadata({
      fileName: "design.png",
      sizeBytes: CUSTOM_DESIGN_LIMITS.maxDesignFileSizeBytes + 1,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors[0].code).toBe("custom_design_file_too_large");
    }
  });

  it("rejects mismatched MIME and extension", () => {
    const result = validateDesignFileMetadata({
      fileName: "design.png",
      sizeBytes: 1,
      mimeType: "image/jpeg",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors[0].code).toBe("custom_design_type_mismatch");
    }
  });

  it("safe errors do not include file contents or raw buffers", () => {
    const privateContents = "Private Person Sentinel";
    const result = validateDesignFileMetadata({
      fileName: "design.gif",
      sizeBytes: 1,
      mimeType: `image/gif; ${privateContents}`,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const messages = result.errors.map((error) => error.message).join(" ");

      expect(messages).not.toContain(privateContents);
      expect(messages).not.toContain("Uint8Array");
      expect(messages).not.toContain("ArrayBuffer");
    }
  });
});
