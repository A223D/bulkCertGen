import type { MappedDocumentData } from "@/lib/batch-pdf/types";
import { PreviewValue } from "./preview-utils";

type MailingLabelPreviewProps = {
  data: MappedDocumentData;
};

export function MailingLabelPreview({ data }: MailingLabelPreviewProps) {
  const addressLine2 = data.address_line_2?.trim();

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-sm">
      <div className="rounded-lg border border-dashed border-line p-5 font-mono text-sm leading-7 text-ink">
        <p className="break-words font-semibold">
          <PreviewValue data={data} fieldKey="name" />
        </p>
        <p className="break-words">
          <PreviewValue data={data} fieldKey="address_line_1" />
        </p>
        {addressLine2 ? <p className="break-words">{addressLine2}</p> : null}
        <p className="break-words">
          <PreviewValue data={data} fieldKey="city" />
          {", "}
          <PreviewValue data={data} fieldKey="region" />
          {"  "}
          <PreviewValue data={data} fieldKey="postal_code" />
        </p>
      </div>
    </div>
  );
}
