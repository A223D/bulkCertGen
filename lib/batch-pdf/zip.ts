import JSZip from "jszip";

export async function createPdfZip(
  files: Array<{
    filename: string;
    bytes: Uint8Array;
  }>,
): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error("Add at least one PDF before creating a ZIP.");
  }

  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.filename, file.bytes);
  }

  return zip.generateAsync({ type: "uint8array" });
}
