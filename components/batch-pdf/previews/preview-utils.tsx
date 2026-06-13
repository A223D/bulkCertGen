import type { MappedDocumentData } from "@/lib/batch-pdf/types";

export function PreviewValue({
  data,
  fieldKey,
  fallback = "Missing value",
  className,
}: {
  data: MappedDocumentData;
  fieldKey: string;
  fallback?: string;
  className?: string;
}) {
  const value = data[fieldKey]?.trim();

  if (!value) {
    return (
      <span className={["text-muted-foreground/70", className].filter(Boolean).join(" ")}>
        {fallback}
      </span>
    );
  }

  return <span className={className}>{value}</span>;
}
