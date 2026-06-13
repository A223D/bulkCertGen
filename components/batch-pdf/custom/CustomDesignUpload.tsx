"use client";

import { useRef } from "react";
import { CUSTOM_DESIGN_LIMITS } from "@/lib/batch-pdf/limits";
import {
  formatFileSize,
} from "@/lib/batch-pdf/custom/design-asset";
import { validateDesignFileMetadata } from "@/lib/batch-pdf/custom/design-file";
import type { BatchPdfError } from "@/lib/batch-pdf/types";
import type { CustomDesignState } from "@/lib/batch-pdf/custom/design-upload-state";

type CustomDesignUploadProps = {
  state: CustomDesignState;
  onAcceptedFile: (file: File) => void;
  onRejectedFile: (errors: BatchPdfError[]) => void;
  onReset: () => void;
};

export function CustomDesignUpload({
  state,
  onAcceptedFile,
  onRejectedFile,
  onReset,
}: CustomDesignUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function reset() {
    onReset();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = validateDesignFileMetadata({
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });

    if (!validation.ok) {
      onRejectedFile(validation.errors);
      event.target.value = "";
      return;
    }

    onAcceptedFile(file);
    event.target.value = "";
  }

  return (
    <section className="rounded-lg border border-line bg-panel p-4" aria-labelledby="custom-design-upload-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Custom design
          </p>
          <h2 id="custom-design-upload-heading" className="mt-2 text-xl font-semibold">
            Upload a design file
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Use a PDF, PNG, JPG, or JPEG file. The design stays in this browser session and is not sent to the server for preview.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
          Limit: {formatFileSize(CUSTOM_DESIGN_LIMITS.maxDesignFileSizeBytes)} max, one-page PDFs
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          htmlFor="custom-design-file-upload"
          className="inline-flex w-fit cursor-pointer rounded-lg bg-ink px-4 py-2 text-sm font-medium text-panel hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Choose design
        </label>
        <input
          ref={inputRef}
          id="custom-design-file-upload"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          className="sr-only"
          onChange={handleUpload}
          aria-describedby="custom-design-file-help"
        />
        {state.file ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex w-fit rounded-lg border border-line px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Remove design
          </button>
        ) : null}
      </div>
      <p id="custom-design-file-help" className="mt-3 text-xs leading-5 text-muted-foreground">
        Current-session only. No storage, no server upload, no field placement yet.
      </p>

      {state.file ? (
        <div className="mt-4 rounded-lg border border-line bg-muted p-3 text-sm text-muted-foreground">
          <span className="font-medium text-ink">{state.file.name}</span>
          <span className="ml-2">{formatFileSize(state.file.size)}</span>
        </div>
      ) : null}

      {state.errors.length > 0 ? (
        <div className="mt-4 space-y-2">
          {state.errors.map((error) => (
            <p
              key={error.code}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error.message}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
