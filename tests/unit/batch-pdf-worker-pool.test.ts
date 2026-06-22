import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  getWorkerPoolSize,
  renderSeparateFilesWithWorkers,
  workersEnabled,
  WORKER_ROW_THRESHOLD,
} from "../../lib/batch-pdf/worker-pool.ts";
import { createSeparateFileRenderer } from "../../lib/batch-pdf/custom/compositor.ts";
import { createDefaultExportOptions } from "../../lib/batch-pdf/custom/export-options.ts";
import { createDefaultTextBoxStyle } from "../../lib/batch-pdf/custom/field-boxes.ts";
import type {
  CustomFieldBox,
  DesignAsset,
  ExportOptions,
} from "../../lib/batch-pdf/custom/types.ts";

const require = createRequire(import.meta.url);
const sharp = require("sharp") as (input?: unknown) => {
  png: () => { toBuffer: () => Promise<Buffer> };
};

async function makePng(): Promise<Uint8Array> {
  const buf = await sharp({
    create: {
      width: 200,
      height: 150,
      channels: 3,
      background: { r: 235, g: 235, b: 245 },
    },
  } as unknown)
    .png()
    .toBuffer();
  return new Uint8Array(buf);
}

const designAsset: DesignAsset = {
  kind: "png",
  fileName: "d.png",
  sizeBytes: 1000,
  selectedPageIndex: 0,
  intrinsicWidth: 200,
  intrinsicHeight: 150,
  intrinsicUnit: "px",
  aspectRatio: 200 / 150,
};

const fieldBoxes: CustomFieldBox[] = [
  {
    id: "b1",
    label: "Name",
    source: { type: "csvColumn", column: "name" },
    rect: { x: 0.2, y: 0.4, width: 0.6, height: 0.15 },
    style: createDefaultTextBoxStyle(),
    required: false,
  },
];

function exportOptions(): ExportOptions {
  return {
    ...createDefaultExportOptions(),
    layoutMode: "onePerPage",
    outputMode: "separateFiles",
    itemSizeMode: "custom",
    customItemWidth: 4,
    customItemHeight: 3,
    unit: "in",
  };
}

describe("worker-pool configuration", () => {
  const original = process.env.CUSTOM_EXPORT_WORKERS;
  afterEach(() => {
    if (original === undefined) delete process.env.CUSTOM_EXPORT_WORKERS;
    else process.env.CUSTOM_EXPORT_WORKERS = original;
  });

  it("is disabled unless explicitly enabled", () => {
    delete process.env.CUSTOM_EXPORT_WORKERS;
    expect(workersEnabled()).toBe(false);
    process.env.CUSTOM_EXPORT_WORKERS = "0";
    expect(workersEnabled()).toBe(false);
    process.env.CUSTOM_EXPORT_WORKERS = "false";
    expect(workersEnabled()).toBe(false);
    process.env.CUSTOM_EXPORT_WORKERS = "2";
    expect(workersEnabled()).toBe(true);
  });

  it("caps pool size at the CPU count and defaults sensibly", () => {
    process.env.CUSTOM_EXPORT_WORKERS = "1";
    expect(getWorkerPoolSize()).toBe(1);
    process.env.CUSTOM_EXPORT_WORKERS = "auto";
    expect(getWorkerPoolSize()).toBeGreaterThanOrEqual(1);
    expect(WORKER_ROW_THRESHOLD).toBeGreaterThan(0);
  });
});

describe("renderSeparateFilesWithWorkers", () => {
  it("renders every row across workers, preserving indices", async () => {
    const designBytes = await makePng();
    const rows = [
      { name: "Alice" },
      { name: "Bob" },
      { name: "Carol" },
      { name: "Dan" },
      { name: "Erin" },
    ];

    const received = new Map<number, Uint8Array>();
    await renderSeparateFilesWithWorkers({
      designBytes,
      designAsset,
      fieldBoxes,
      exportOptions: exportOptions(),
      rows,
      poolSize: 2,
      onResult: (index, bytes) => {
        received.set(index, bytes);
      },
    });

    expect(received.size).toBe(rows.length);
    for (let i = 0; i < rows.length; i++) {
      const bytes = received.get(i);
      expect(bytes).toBeInstanceOf(Uint8Array);
      if (!bytes) throw new Error(`missing row ${i}`);
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
    }
  }, 30000);

  it("matches the in-process renderer output for the same rows", async () => {
    const designBytes = await makePng();
    const opts = exportOptions();
    const rows = [{ name: "Alice" }, { name: "Bob" }];

    const inProcess = await createSeparateFileRenderer({
      designBytes,
      designAsset,
      fieldBoxes,
      exportOptions: opts,
    });
    const expectedSizes = [
      (await inProcess.renderRow(rows[0])).length,
      (await inProcess.renderRow(rows[1])).length,
    ];

    const workerSizes: number[] = [];
    await renderSeparateFilesWithWorkers({
      designBytes,
      designAsset,
      fieldBoxes,
      exportOptions: opts,
      rows,
      poolSize: 2,
      onResult: (index, bytes) => {
        workerSizes[index] = bytes.length;
      },
    });

    expect(workerSizes).toEqual(expectedSizes);
  }, 30000);

  it("resolves immediately for an empty row set", async () => {
    let calls = 0;
    await renderSeparateFilesWithWorkers({
      designBytes: await makePng(),
      designAsset,
      fieldBoxes,
      exportOptions: exportOptions(),
      rows: [],
      poolSize: 2,
      onResult: () => {
        calls += 1;
      },
    });
    expect(calls).toBe(0);
  });
});
