import { Text } from "@react-pdf/renderer";
import type { MappedDocumentData } from "../types.ts";

export function getPdfValue(
  data: MappedDocumentData,
  fieldKey: string,
  fallback = "Missing value",
): string {
  return data[fieldKey]?.trim() || fallback;
}

export function OptionalPdfText({
  value,
  prefix = "",
}: {
  value?: string;
  prefix?: string;
}) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  return <Text>{prefix}{normalized}</Text>;
}
