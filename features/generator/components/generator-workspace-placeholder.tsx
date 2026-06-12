"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import Papa from "papaparse";
import { formatPlaceholderLabel } from "@/lib/utils";
import type { BackgroundImageData, ParsedCsvData } from "@/types";

const placeholderFields = [
  { label: "Recipient name", position: "X: 50%, Y: 42%", source: "full_name" },
  { label: "Award title", position: "X: 50%, Y: 55%", source: "course_name" },
  { label: "Issue date", position: "X: 78%, Y: 82%", source: "issue_date" },
];

const previewRowLimit = 5;
const allowedBackgroundTypes = new Set(["image/png", "image/jpeg"]);
const allowedBackgroundExtensions = [".png", ".jpg", ".jpeg"];

type CsvUploadState = {
  data: ParsedCsvData | null;
  error: string | null;
  isParsing: boolean;
};

type BackgroundUploadState = {
  data: BackgroundImageData | null;
  error: string | null;
  isLoading: boolean;
};

function normalizeCell(value: string | undefined) {
  return value?.trim() ?? "";
}

function isAllowedBackgroundFile(file: File) {
  if (allowedBackgroundTypes.has(file.type)) {
    return true;
  }

  const lowerCaseName = file.name.toLowerCase();
  return allowedBackgroundExtensions.some((extension) => lowerCaseName.endsWith(extension));
}

function loadBackgroundImage(file: File): Promise<BackgroundImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      resolve({
        fileName: file.name,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read the selected image."));
    };

    image.src = url;
  });
}

function parseCsvText(text: string, fileName: string): ParsedCsvData {
  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors[0]?.message || "Invalid CSV file.");
  }

  const rawRows = result.data.filter((row) => row.some((cell) => normalizeCell(cell) !== ""));

  if (rawRows.length === 0) {
    throw new Error("The CSV file is empty.");
  }

  const rawHeaders = rawRows[0]?.map((header) => normalizeCell(header)) ?? [];

  if (rawHeaders.length === 0 || rawHeaders.every((header) => header === "")) {
    throw new Error("The CSV file is missing a header row.");
  }

  if (rawHeaders.some((header) => header === "")) {
    throw new Error("Every CSV column needs a header.");
  }

  const uniqueHeaders = new Set(rawHeaders);
  if (uniqueHeaders.size !== rawHeaders.length) {
    throw new Error("CSV headers must be unique.");
  }

  const rows = rawRows.slice(1).map((row) => {
    return rawHeaders.reduce<Record<string, string>>((record, header, index) => {
      record[header] = normalizeCell(row[index]);
      return record;
    }, {});
  });

  return {
    fileName,
    columns: rawHeaders,
    rows,
  };
}

export function GeneratorWorkspacePlaceholder() {
  const csvInputId = useId();
  const backgroundInputId = useId();
  const backgroundUrlRef = useRef<string | null>(null);
  const [csvState, setCsvState] = useState<CsvUploadState>({
    data: null,
    error: null,
    isParsing: false,
  });
  const [backgroundState, setBackgroundState] = useState<BackgroundUploadState>({
    data: null,
    error: null,
    isLoading: false,
  });

  const previewRows = csvState.data?.rows.slice(0, previewRowLimit) ?? [];

  useEffect(() => {
    return () => {
      if (backgroundUrlRef.current) {
        URL.revokeObjectURL(backgroundUrlRef.current);
      }
    };
  }, []);

  async function handleCsvUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size === 0) {
      setCsvState({
        data: null,
        error: "The selected CSV file is empty.",
        isParsing: false,
      });
      event.target.value = "";
      return;
    }

    setCsvState((current) => ({
      data: current.data,
      error: null,
      isParsing: true,
    }));

    try {
      const text = await file.text();
      const parsedData = parseCsvText(text, file.name);

      setCsvState({
        data: parsedData,
        error: null,
        isParsing: false,
      });
    } catch (error) {
      setCsvState({
        data: null,
        error: error instanceof Error ? error.message : "Unable to parse the CSV file.",
        isParsing: false,
      });
    } finally {
      event.target.value = "";
    }
  }

  async function handleBackgroundUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size === 0) {
      setBackgroundState({
        data: null,
        error: "The selected image file is empty.",
        isLoading: false,
      });
      event.target.value = "";
      return;
    }

    if (!isAllowedBackgroundFile(file)) {
      setBackgroundState({
        data: null,
        error: "Please choose a PNG or JPG image.",
        isLoading: false,
      });
      event.target.value = "";
      return;
    }

    setBackgroundState((current) => ({
      data: current.data,
      error: null,
      isLoading: true,
    }));

    try {
      const backgroundImage = await loadBackgroundImage(file);

      if (backgroundUrlRef.current) {
        URL.revokeObjectURL(backgroundUrlRef.current);
      }

      backgroundUrlRef.current = backgroundImage.url;

      setBackgroundState({
        data: backgroundImage,
        error: null,
        isLoading: false,
      });
    } catch (error) {
      setBackgroundState({
        data: null,
        error: error instanceof Error ? error.message : "Unable to load the selected image.",
        isLoading: false,
      });
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-line bg-panel p-5 shadow-card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Generator workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Certificate layout studio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700">
              This route reserves dedicated panels for data and template
              controls, certificate preview, and selected field properties.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-stone-600">
              Active template: Spring completion certificate
            </div>
            <div className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-stone-600">
              Future actions: import data, preview row, export PDFs
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-line bg-panel p-5 shadow-card">
        <div className="flex flex-col gap-3 border-b border-line pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Toolbar
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              Reserve this strip for future generator actions and context.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-stone-700"
            >
              Background image
            </button>
            <button
              type="button"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-stone-700"
            >
              CSV data
            </button>
            <button
              type="button"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white"
            >
              Preview row
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="rounded-[1.5rem] border border-line bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Data and template
            </p>
            <div className="mt-5 space-y-5">
              <section>
                <h2 className="text-lg font-semibold">Background image</h2>
                <div className="mt-3 rounded-2xl border border-dashed border-line bg-panel p-4">
                  <label
                    htmlFor={backgroundInputId}
                    className="inline-flex cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-white"
                  >
                    Choose PNG/JPG image
                  </label>
                  <input
                    id={backgroundInputId}
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    className="sr-only"
                    onChange={handleBackgroundUpload}
                  />
                  <p className="mt-3 text-sm leading-6 text-stone-700">
                    Upload a PNG or JPG certificate background and preview it in
                    the workspace without leaving the browser.
                  </p>
                  {backgroundState.isLoading ? (
                    <p className="mt-3 text-sm font-medium text-stone-700">Loading image...</p>
                  ) : null}
                  {backgroundState.error ? (
                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {backgroundState.error}
                    </p>
                  ) : null}
                  {backgroundState.data ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-line bg-white px-3 py-3 text-sm text-stone-700 sm:col-span-2">
                        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          File
                        </span>
                        <span className="mt-2 block break-all">{backgroundState.data.fileName}</span>
                      </div>
                      <div className="rounded-xl border border-line bg-white px-3 py-3 text-sm text-stone-700">
                        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Width
                        </span>
                        <span className="mt-2 block">{backgroundState.data.width}px</span>
                      </div>
                      <div className="rounded-xl border border-line bg-white px-3 py-3 text-sm text-stone-700">
                        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Height
                        </span>
                        <span className="mt-2 block">{backgroundState.data.height}px</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border px-3 py-3 mt-2 text-sm border-line text-stone-700">
                      <p className=" font-medium">No Image yet lol</p>
                    </div>

                  )}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold">CSV upload</h2>
                <div className="mt-3 rounded-2xl border border-dashed border-line bg-panel p-4">
                  <label
                    htmlFor={csvInputId}
                    className="inline-flex cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-white"
                  >
                    Choose CSV file
                  </label>
                  <input
                    id={csvInputId}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={handleCsvUpload}
                  />
                  <p className="mt-3 text-sm leading-6 text-stone-700">
                    Parse recipient data entirely in the browser and keep it in
                    local React state for preview.
                  </p>
                  {csvState.isParsing ? (
                    <p className="mt-3 text-sm font-medium text-stone-700">Parsing CSV...</p>
                  ) : null}
                  {csvState.error ? (
                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {csvState.error}
                    </p>
                  ) : null}
                  {csvState.data ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-line bg-white px-3 py-3 text-sm text-stone-700">
                        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          File
                        </span>
                        <span className="mt-2 block break-all">{csvState.data.fileName}</span>
                      </div>
                      <div className="rounded-xl border border-line bg-white px-3 py-3 text-sm text-stone-700">
                        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Rows
                        </span>
                        <span className="mt-2 block">{csvState.data.rows.length}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold">Detected columns</h2>
                <ul className="mt-3 space-y-2">
                  {(csvState.data?.columns ?? []).length > 0 ? (
                    csvState.data?.columns.map((column) => (
                      <li
                        key={column}
                        className="rounded-xl border border-line bg-panel px-3 py-2 text-sm text-stone-700"
                      >
                        {formatPlaceholderLabel(column)}
                        <span className="ml-2 text-stone-500">({column})</span>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-xl border border-dashed border-line bg-panel px-3 py-3 text-sm text-stone-600">
                      Upload a CSV to derive headers here.
                    </li>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold">CSV preview</h2>
                <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-panel">
                  {csvState.data && csvState.data.columns.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-line text-left text-sm text-stone-700">
                        <thead className="bg-white text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          <tr>
                            {csvState.data.columns.map((column) => (
                              <th key={column} className="px-3 py-3">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {previewRows.length > 0 ? (
                            previewRows.map((row, rowIndex) => (
                              <tr key={`${rowIndex}-${csvState.data?.fileName}`} className="bg-panel">
                                {csvState.data?.columns.map((column) => (
                                  <td key={`${rowIndex}-${column}`} className="px-3 py-3 align-top">
                                    {row[column] || <span className="text-stone-400">-</span>}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={csvState.data.columns.length}
                                className="px-3 py-4 text-sm text-stone-600"
                              >
                                The CSV headers were parsed, but there are no data rows yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-4 py-5 text-sm leading-6 text-stone-600">
                      The first few rows will appear here after a valid CSV upload.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </aside>

          <section className="rounded-[1.5rem] border border-line bg-[#f8f3e7] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Preview workspace
                </p>
                <h2 className="mt-2 text-xl font-semibold">Canvas area</h2>
              </div>
              <div className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                Desktop-first
              </div>
            </div>

            <div className="mt-5 flex min-h-[560px] items-center justify-center rounded-[1.5rem] border border-dashed border-stone-400/70 bg-white p-6">
              {backgroundState.data ? (
                <div className="flex w-full max-w-4xl flex-col gap-4">
                  <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-stone-700">
                    Background preview: {backgroundState.data.fileName} ({backgroundState.data.width} x {backgroundState.data.height})
                  </div>
                  <div className="flex items-center justify-center overflow-auto rounded-[1.25rem] border border-line bg-canvas p-6 shadow-sm">
                    <Image
                      src={backgroundState.data.url}
                      alt={backgroundState.data.fileName}
                      width={backgroundState.data.width}
                      height={backgroundState.data.height}
                      unoptimized
                      className="h-auto max-h-[640px] w-auto max-w-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full min-h-[420px] max-w-3xl flex-col items-center justify-center rounded-[1rem] border border-dashed border-stone-300 bg-white px-10 py-12 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                    Certificate canvas empty state
                  </p>
                  <p className="mt-6 text-3xl font-semibold text-stone-800">
                    Upload a PNG or JPG background to start the preview.
                  </p>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
                    The image will be loaded locally, measured in the browser,
                    and shown here at its natural aspect ratio so future field
                    overlays can align against it.
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-[1.5rem] border border-line bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Selected field
            </p>
            <div className="mt-5 space-y-4">
              {placeholderFields.map((field) => (
                <div key={field.label} className="rounded-2xl border border-line bg-panel p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{field.label}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        Bound to: {field.source}
                      </p>
                    </div>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      Draft
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-stone-600">
                    <p>{field.position}</p>
                    <p>Font: Serif display</p>
                    <p>Alignment: Center</p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-line p-4 text-sm leading-6 text-stone-700">
                Field styling, sizing, and alignment controls will live in this
                panel once selection state is added.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
