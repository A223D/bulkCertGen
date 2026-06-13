import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { AppointmentCardPdf } from "./AppointmentCardPdf";
import { ClassicCertificatePdf } from "./ClassicCertificatePdf";
import { MailingLabelPdf } from "./MailingLabelPdf";
import { NameBadgePdf } from "./NameBadgePdf";
import type {
  BatchPdfTemplate,
  MappedDocumentData,
} from "../types.ts";

export async function renderPdfForTemplate(args: {
  template: BatchPdfTemplate;
  data: MappedDocumentData;
}): Promise<Uint8Array> {
  const document = ((): unknown => {
    switch (args.template.id) {
      case "classic-certificate":
        return createElement(ClassicCertificatePdf, { data: args.data });
      case "name-badge":
        return createElement(NameBadgePdf, { data: args.data });
      case "mailing-label":
        return createElement(MailingLabelPdf, { data: args.data });
      case "appointment-card":
        return createElement(AppointmentCardPdf, { data: args.data });
      default:
        throw new Error("PDF rendering is not available for this template.");
    }
  })();

  const buffer = await renderToBuffer(
    document as Parameters<typeof renderToBuffer>[0],
  );

  return new Uint8Array(buffer);
}
