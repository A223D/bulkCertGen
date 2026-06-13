import type {
  BatchPdfTemplate,
  MappedDocumentData,
} from "@/lib/batch-pdf/types";
import { AppointmentCardPreview } from "./AppointmentCardPreview";
import { CertificatePreview } from "./CertificatePreview";
import { MailingLabelPreview } from "./MailingLabelPreview";
import { NameBadgePreview } from "./NameBadgePreview";

type TemplatePreviewRendererProps = {
  template: BatchPdfTemplate;
  data: MappedDocumentData;
};

export function TemplatePreviewRenderer({
  template,
  data,
}: TemplatePreviewRendererProps) {
  switch (template.id) {
    case "classic-certificate":
      return <CertificatePreview data={data} />;
    case "name-badge":
      return <NameBadgePreview data={data} />;
    case "mailing-label":
      return <MailingLabelPreview data={data} />;
    case "appointment-card":
      return <AppointmentCardPreview data={data} />;
    default:
      return (
        <div className="rounded-lg border border-line bg-panel p-6 text-sm text-muted-foreground">
          Preview is not available for this template yet.
        </div>
      );
  }
}
