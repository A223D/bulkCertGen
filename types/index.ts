export type CertificateField = {
  id: string;
  label: string;
  sourceColumn: string;
  x: number;
  y: number;
};

export type CsvRow = Record<string, string>;

export type ParsedCsvData = {
  fileName: string;
  columns: string[];
  rows: CsvRow[];
};

export type BackgroundImageData = {
  fileName: string;
  url: string;
  width: number;
  height: number;
};
