"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CUSTOM_DESIGN_LIMITS } from "@/lib/batch-pdf/limits";
import { formatFileSize } from "@/lib/batch-pdf/custom/design-asset";
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
  const [isDragging, setIsDragging] = useState(false);

  function reset() {
    onReset();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function acceptFile(file: File) {
    const validation = validateDesignFileMetadata({
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });

    if (!validation.ok) {
      onRejectedFile(validation.errors);
      return;
    }

    onAcceptedFile(file);
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) acceptFile(file);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-4" aria-labelledby="custom-design-upload-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Custom design
          </p>
          <h2 id="custom-design-upload-heading" className="mt-2 text-xl font-semibold">
            Upload a design file
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Use a PNG, JPG, or JPEG image. The design stays in this browser session and is not sent to the server for preview.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
          Limit: {formatFileSize(CUSTOM_DESIGN_LIMITS.maxDesignFileSizeBytes)} max
        </div>
      </div>

      <input
        ref={inputRef}
        id="custom-design-file-upload"
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        className="sr-only"
        onChange={handleUpload}
        aria-describedby="custom-design-file-help"
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a design file. Drag and drop, or activate to browse."
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={[
          "mt-5 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors",
          isDragging
            ? "border-brand bg-brand-soft"
            : "border-line bg-muted hover:border-accent hover:bg-accent-soft/40",
        ].join(" ")}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <ImageUp className="h-6 w-6" />
        </span>
        <span className="mt-3 text-[15px] font-bold text-ink">
          {isDragging ? "Drop to upload" : "Drag & drop your design here"}
        </span>
        <span className="mt-1 text-sm text-muted-foreground">
          PNG or JPG · up to {formatFileSize(CUSTOM_DESIGN_LIMITS.maxDesignFileSizeBytes)}
        </span>
        <span className="mt-4 inline-flex">
          <Button asChild variant="primary">
            {/* Inner span keeps the dropzone's click from double-firing the picker. */}
            <span
              onClick={(event) => {
                event.stopPropagation();
                openPicker();
              }}
            >
              Choose design
            </span>
          </Button>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p id="custom-design-file-help" className="text-xs leading-5 text-muted-foreground">
          Current-session only. No storage, no server upload, no field placement yet.
        </p>
        {state.file ? (
          <Button type="button" variant="secondary" size="sm" onClick={reset}>
            Remove design
          </Button>
        ) : null}
      </div>

      {state.file ? (
        <div className="mt-3 rounded-lg border border-line bg-muted p-3 text-sm text-muted-foreground">
          <span className="font-medium text-ink">{state.file.name}</span>
          <span className="ml-2">{formatFileSize(state.file.size)}</span>
        </div>
      ) : null}

      {state.errors.length > 0 ? (
        <div className="mt-4 space-y-2">
          {state.errors.map((error) => (
            <p
              key={error.code}
              className="rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger"
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
