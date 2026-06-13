import type { MappedDocumentData } from "@/lib/batch-pdf/types";
import { PreviewValue } from "./preview-utils";

type NameBadgePreviewProps = {
  data: MappedDocumentData;
};

export function NameBadgePreview({ data }: NameBadgePreviewProps) {
  const role = data.role?.trim();
  const company = data.company?.trim();
  const group = data.group?.trim();

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg border border-line bg-panel shadow-sm">
      <div className="bg-accent px-5 py-3 text-accent-contrast">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]">Event Badge</p>
      </div>
      <div className="space-y-5 p-6">
        <p className="break-words text-3xl font-semibold leading-tight text-ink">
          <PreviewValue data={data} fieldKey="name" />
        </p>
        <div className="space-y-1 text-sm text-muted-foreground">
          {role ? <p>{role}</p> : null}
          {company ? <p>{company}</p> : null}
          {group ? <p>{group}</p> : null}
          {!role && !company && !group ? <p>Optional details not mapped</p> : null}
        </div>
      </div>
    </div>
  );
}
