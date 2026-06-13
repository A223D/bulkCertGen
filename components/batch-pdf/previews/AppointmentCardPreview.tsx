import type { MappedDocumentData } from "@/lib/batch-pdf/types";
import { PreviewValue } from "./preview-utils";

type AppointmentCardPreviewProps = {
  data: MappedDocumentData;
};

export function AppointmentCardPreview({ data }: AppointmentCardPreviewProps) {
  const notes = data.notes?.trim();

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Appointment Reminder
      </p>
      <h3 className="mt-4 break-words text-2xl font-semibold text-ink">
        <PreviewValue data={data} fieldKey="name" />
      </h3>
      <div className="mt-5 grid gap-3 text-sm">
        <div className="rounded-lg border border-line bg-muted p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Date and time
          </p>
          <p className="mt-1 text-ink">
            <PreviewValue data={data} fieldKey="date" /> at{" "}
            <PreviewValue data={data} fieldKey="time" />
          </p>
        </div>
        <div className="rounded-lg border border-line bg-muted p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Location
          </p>
          <p className="mt-1 break-words text-ink">
            <PreviewValue data={data} fieldKey="location" />
          </p>
        </div>
        {notes ? (
          <div className="rounded-lg border border-line bg-muted p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Notes
            </p>
            <p className="mt-1 break-words text-ink">{notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
