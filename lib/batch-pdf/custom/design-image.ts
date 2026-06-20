// Server-only: prepare an uploaded design image for reliable PDF rendering.
//
// pdf-lib's `embedJpg` writes the bytes as a PDF `DCTDecode` stream, but PDF's
// DCTDecode only supports *baseline* JPEG. Progressive JPEGs (SOF2) and CMYK
// JPEGs embed without error yet render blank or with wrong colors in viewers.
// We detect those cases and re-encode to a baseline RGB JPEG via jpeg-js.

import jpeg from "jpeg-js";

type JpegInfo = {
  progressive: boolean;
  components: number | null;
};

// Scans JPEG segment markers up to the start of scan to learn the encoding.
function analyzeJpeg(d: Uint8Array): JpegInfo | null {
  if (d.length < 4 || d[0] !== 0xff || d[1] !== 0xd8) return null;

  let i = 2;
  let progressive = false;
  let components: number | null = null;

  while (i < d.length - 1) {
    if (d[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = d[i + 1];

    // Standalone markers without a length field.
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      i += 2;
      continue;
    }

    if (i + 4 > d.length) break;
    const segmentLength = (d[i + 2] << 8) | d[i + 3];

    // SOF markers (C0..CF, excluding the DHT/DAC/RST family).
    if (marker === 0xc2) progressive = true;
    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3
    ) {
      // SOF layout: [len(2)][precision(1)][height(2)][width(2)][components(1)]
      components = d[i + 2 + 7] ?? null;
    }

    if (marker === 0xda) break; // Start of scan — header done.
    i += 2 + segmentLength;
  }

  return { progressive, components };
}

/**
 * Returns design bytes safe to embed via pdf-lib. PNGs and baseline RGB JPEGs
 * pass through unchanged; progressive or CMYK JPEGs are re-encoded to baseline
 * RGB. On any decode/encode failure the original bytes are returned so export
 * never fails because of normalization.
 */
export function normalizeDesignImageBytes(bytes: Uint8Array): Uint8Array {
  const info = analyzeJpeg(bytes);

  // Not a JPEG (e.g. PNG), or already a baseline RGB/grayscale JPEG.
  if (!info) return bytes;
  if (!info.progressive && info.components !== 4) return bytes;

  try {
    const raw = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
    const encoded = jpeg.encode(
      { data: raw.data as Uint8Array, width: raw.width, height: raw.height },
      100,
    );
    return new Uint8Array(encoded.data);
  } catch {
    return bytes;
  }
}
