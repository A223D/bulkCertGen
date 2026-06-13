function slugifyFilenamePart(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function makeSafePdfFilename(args: {
  templateId: string;
  index: number;
  data: Record<string, string>;
}): string {
  const prefix = String(Math.max(1, Math.trunc(args.index))).padStart(3, "0");
  const namePart = slugifyFilenamePart(args.data.name ?? "");
  const templatePart = slugifyFilenamePart(args.templateId) || "document";
  const baseParts = namePart
    ? [prefix, namePart, templatePart]
    : [prefix, "document"];
  const baseName = baseParts.join("-").slice(0, 80).replace(/-+$/g, "");

  return `${baseName || `${prefix}-document`}.pdf`;
}
