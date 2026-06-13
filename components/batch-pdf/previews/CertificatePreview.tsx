import type { MappedDocumentData } from "@/lib/batch-pdf/types";
import { PreviewValue } from "./preview-utils";

type CertificatePreviewProps = {
  data: MappedDocumentData;
};

export function CertificatePreview({ data }: CertificatePreviewProps) {
  const issuer = data.issuer?.trim();

  return (
    <div className="mx-auto w-full max-w-2xl rounded-lg border border-line bg-panel p-4 text-center shadow-sm sm:p-5">
      <div className="flex min-h-[340px] flex-col justify-between gap-6 rounded-lg border border-line p-5 sm:min-h-[360px] sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.22em]">
            Certificate of Completion
          </p>
          <h3 className="mt-6 text-sm font-medium text-muted-foreground">
            Presented to
          </h3>
          <p className="mt-3 break-words text-2xl font-semibold leading-tight text-ink sm:text-3xl">
            <PreviewValue data={data} fieldKey="name" />
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">for</p>
          <p className="mt-2 break-words text-lg font-semibold leading-snug text-ink sm:text-xl">
            <PreviewValue data={data} fieldKey="course" />
          </p>
        </div>

        <div className="grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
          <p>
            Date: <PreviewValue data={data} fieldKey="date" />
          </p>
          {issuer ? <p>Issued by: {issuer}</p> : <p>Issued by: Optional</p>}
        </div>
      </div>
    </div>
  );
}
