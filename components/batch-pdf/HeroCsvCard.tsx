"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { parseCsvText, validateCsvFile } from "@/lib/batch-pdf/csv";
import { decodeCsvBytes } from "@/lib/batch-pdf/csv-decode";
import { analyzeCsvInsights } from "@/lib/batch-pdf/csv-insights";
import { saveSessionCsv } from "@/lib/batch-pdf/session-csv";
import type { BatchPdfError, CsvParseResult } from "@/lib/batch-pdf/types";

const HERO_SAMPLE_CSV = [
  "full_name,course_name,issue_date,instructor,credential_id",
  "Amara Okafor,Advanced Data Analytics,May 18 2026,Dr. A. Rivera,VSB-1001",
  "Liam Chen,UX Foundations,May 18 2026,Dr. A. Rivera,VSB-1002",
  "Sofia Marquez,Project Management Essentials,May 19 2026,J. Patel,VSB-1003",
  "Noah Williams,Public Speaking,May 19 2026,J. Patel,VSB-1004",
  "Maximilian Featherstonehaugh-Vance,Advanced Machine Learning,May 20 2026,Dr. A. Rivera,VSB-1005",
  "Priya Sharma,Data Analytics,May 20 2026,J. Patel,VSB-1006",
  "Ethan Brown,UX Foundations,May 21 2026,Dr. A. Rivera,VSB-1007",
  "Olivia Davis,Project Management Essentials,May 21 2026,J. Patel,VSB-1008",
  "Kenji Tanaka,Public Speaking,May 22 2026,Dr. A. Rivera,VSB-1009",
  "Isabella Rossi,Data Analytics,May 22 2026,J. Patel,VSB-1010",
  "Mohammed Al-Rashid,UX Foundations,May 23 2026,Dr. A. Rivera,VSB-1011",
  "Grace Kim,Project Management Essentials,May 23 2026,J. Patel,VSB-1012",
].join("\n");

type UploadState = "empty" | "drag" | "parsing" | "success" | "error";

function getTruncationWarning(csv: CsvParseResult | null) {
  return csv?.warnings.find((warning) => warning.code === "csv_rows_truncated") ?? null;
}

function csvErrorAdvice(error: BatchPdfError | null): string {
  switch (error?.code) {
    case "csv_title_row":
      return "In Excel or Sheets, delete any title rows above your column names, then export the sheet as CSV again.";
    case "csv_row_too_wide":
      return "Check the row named in the message for an extra comma or extra cell.";
    case "csv_blank_header":
    case "csv_missing_header":
      return "Make sure row 1 contains a name for every column you want to use.";
    case "csv_duplicate_header":
      return "Rename duplicate column headers so each column has a unique name.";
    case "csv_too_many_columns":
      return "Remove columns you will not place on the design, then export a fresh CSV.";
    case "csv_field_too_long":
      return "Shorten the cell named in the message to 300 characters or fewer.";
    case "csv_file_too_large":
      return "Split the spreadsheet into smaller CSV files and process one batch at a time.";
    case "csv_invalid_extension":
      return "Choose File > Download > CSV in Sheets, or Save as CSV from Excel.";
    default:
      return "Use a plain CSV with one header row and one item per row.";
  }
}

function downloadSampleCsv() {
  const blob = new Blob([HERO_SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample-certificates.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function HeroCsvCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("empty");
  const [csvResult, setCsvResult] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastError, setLastError] = useState<BatchPdfError | null>(null);

  const ingest = useCallback((text: string, name: string) => {
    const result = parseCsvText(text);
    if (!result.ok) {
      const error = result.errors[0] ?? null;
      setLastError(error);
      setErrorMsg(error?.message ?? "Could not read that CSV.");
      setUploadState("error");
      return;
    }
    setLastError(null);
    setCsvResult(result.value);
    setFileName(name);
    setUploadState("success");
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validation = validateCsvFile(file);
      if (!validation.ok) {
        const error = validation.errors[0] ?? null;
        setLastError(error);
        setErrorMsg(error?.message ?? "Invalid file.");
        setUploadState("error");
        return;
      }
      setFileName(file.name);
      setUploadState("parsing");
      const reader = new FileReader();
      reader.onload = () => {
        const text = decodeCsvBytes(reader.result as ArrayBuffer);
        ingest(text, file.name);
      };
      reader.onerror = () => {
        setLastError(null);
        setErrorMsg("We couldn't open that file. Try saving a fresh copy.");
        setUploadState("error");
      };
      reader.readAsArrayBuffer(file);
    },
    [ingest],
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState === "empty") setUploadState("drag");
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState === "drag") setUploadState("empty");
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
    else setUploadState("empty");
  };

  const loadSample = () => {
    setUploadState("parsing");
    ingest(HERO_SAMPLE_CSV, "sample-certificates.csv");
  };

  const reset = () => {
    setCsvResult(null);
    setFileName("");
    setErrorMsg("");
    setLastError(null);
    setUploadState("empty");
  };

  const continueToWizard = () => {
    if (!csvResult) return;
    saveSessionCsv(csvResult, fileName);
    router.push("/create");
  };

  const isDrag = uploadState === "drag";
  const truncationWarning = getTruncationWarning(csvResult);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E7E2D6",
        borderRadius: 22,
        padding: 26,
        boxShadow: "0 30px 60px -34px rgba(26,25,22,0.32), 0 2px 0 rgba(26,25,22,0.02)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>Start with your spreadsheet</div>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#B58A12",
            textTransform: "uppercase",
            background: "#FBEFCB",
            padding: "4px 8px",
            borderRadius: 7,
            flexShrink: 0,
          }}
        >
          Step 1 of 7
        </span>
      </div>
      <div style={{ fontSize: 14, color: "#6E6A61", marginBottom: 18 }}>
        Export your Excel or Google Sheet as CSV, then upload it here.
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleInput}
        style={{ display: "none" }}
      />

      {/* EMPTY / DRAG */}
      {(uploadState === "empty" || uploadState === "drag") && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDrag ? "2px dashed #F2B01E" : "2px dashed #D8D1C2",
              background: isDrag ? "#FFF8E6" : "#FCFBF7",
              borderRadius: 16,
              padding: "30px 20px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 13,
                background: "#FBEFCB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#8A6A12",
                }}
              >
                CSV
              </span>
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "#1A1916" }}>
              {isDrag ? "Drop to upload" : "Drop your CSV from Excel or Google Sheets"}
            </div>
            <div style={{ fontSize: 13, color: "#8A857A", marginTop: 5 }}>
              One row per certificate, badge, card, or label · up to 2&nbsp;MB
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Button
              type="button"
              variant="brand"
              size="lg"
              fullWidth
              onClick={() => inputRef.current?.click()}
              className="flex-1 shadow-[0_2px_0_var(--color-brand-strong),0_10px_22px_-10px_rgba(242,176,30,0.6)]"
            >
              Upload CSV
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={loadSample}>
              Try sample CSV
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" fullWidth onClick={downloadSampleCsv} className="mt-2">
            Download sample CSV
          </Button>
        </>
      )}

      {/* PARSING */}
      {uploadState === "parsing" && (
        <div
          style={{
            border: "1px solid #EFEADF",
            borderRadius: 16,
            padding: "34px 20px",
            textAlign: "center",
            background: "#FCFBF7",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #F0DFA8",
              borderTopColor: "#F2B01E",
              margin: "0 auto 16px",
              animation: "vsSpin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes vsSpin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Reading your spreadsheet…</div>
          <div style={{ fontSize: 13, color: "#8A857A", marginTop: 5 }}>{fileName}</div>
        </div>
      )}

      {/* SUCCESS */}
      {uploadState === "success" && csvResult && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              border: "1px solid #CDEBD9",
              background: "#EEF8F1",
              borderRadius: 14,
              padding: "15px 16px",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#2E8B57",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              ✓
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: "#1A1916",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {fileName}
              </div>
              <div style={{ fontSize: 12.5, color: "#3F7A57", fontWeight: 600, marginTop: 2 }}>
              Spreadsheet looks good — ready to choose a design
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div
              style={{
                background: "#FCFBF7",
                border: "1px solid #EFEADF",
                borderRadius: 12,
                padding: "13px 15px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#1A1916",
                }}
              >
                {csvResult.rowCount}
              </div>
              <div style={{ fontSize: 12, color: "#8A857A", fontWeight: 600, marginTop: 2 }}>
                rows · one finished PDF each
              </div>
            </div>
            <div
              style={{
                background: "#FCFBF7",
                border: "1px solid #EFEADF",
                borderRadius: 12,
                padding: "13px 15px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#1A1916",
                }}
              >
                {csvResult.headers.length}
              </div>
              <div style={{ fontSize: 12, color: "#8A857A", fontWeight: 600, marginTop: 2 }}>
                columns detected
              </div>
            </div>
          </div>

          {truncationWarning ? (
            <div
              style={{
                border: "1px solid #F0DFA8",
                borderLeft: "5px solid #B58A12",
                background: "#FFFAEB",
                borderRadius: 14,
                padding: "13px 14px",
                marginTop: 12,
                color: "#7A5E12",
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 800 }}>Only the first 500 rows will be included</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 5 }}>
                Your file has {truncationWarning.totalRows ?? csvResult.totalDataRows} rows.
                {" "}Only the first {truncationWarning.processedRows ?? csvResult.rowCount} will be turned into PDFs;
                {" "}the last {truncationWarning.droppedRows ?? Math.max(0, csvResult.totalDataRows - csvResult.rowCount)} will not be included.
              </div>
            </div>
          ) : null}

          {analyzeCsvInsights(csvResult).length > 0 ? (
            <div style={{ marginTop: 14, display: "grid", gap: 7 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#6E6A61" }}>
                Spreadsheet notes
              </div>
              {analyzeCsvInsights(csvResult).slice(0, 4).map((insight) => (
                <div
                  key={`${insight.code}-${insight.message}`}
                  style={{
                    border: `1px solid ${insight.severity === "warning" ? "#F0DFA8" : "#E7E2D6"}`,
                    background: insight.severity === "warning" ? "#FFFAEB" : "#FCFBF7",
                    color: insight.severity === "warning" ? "#7A5E12" : "#6E6A61",
                    borderRadius: 10,
                    padding: "8px 10px",
                    fontSize: 12.5,
                    lineHeight: 1.45,
                  }}
                >
                  {insight.message}
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
            {csvResult.headers.map((col) => (
              <span
                key={col}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#8A6A12",
                  background: "#FBEFCB",
                  padding: "5px 9px",
                  borderRadius: 7,
                }}
              >
                {col}
              </span>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6E6A61", marginBottom: 7 }}>
              First rows we found
            </div>
            <div style={{ overflowX: "auto", border: "1px solid #EFEADF", borderRadius: 12, background: "#FFFFFF" }}>
              <table style={{ width: "100%", minWidth: Math.max(360, csvResult.headers.length * 120), borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {csvResult.headers.map((header) => (
                      <th key={header} style={{ padding: "8px 10px", textAlign: "left", color: "#6E6A61", background: "#FCFBF7", borderBottom: "1px solid #EFEADF", fontWeight: 800 }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvResult.rows.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {csvResult.headers.map((header) => (
                        <td key={header} style={{ padding: "8px 10px", color: "#1A1916", borderTop: rowIndex === 0 ? 0 : "1px solid #F4F1E9", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {row[header] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvResult.rowCount > 3 ? (
              <div style={{ fontSize: 12, color: "#8A857A", marginTop: 6 }}>
                ...and {csvResult.rowCount - 3} more row{csvResult.rowCount - 3 !== 1 ? "s" : ""}.
              </div>
            ) : null}
          </div>

          <Button type="button" variant="primary" size="lg" fullWidth onClick={continueToWizard} className="mt-4">
            {truncationWarning ? "Continue with first 500 rows" : "Continue — choose a design"} <span>→</span>
          </Button>
          <Button type="button" variant="ghost" size="sm" fullWidth onClick={reset} className="mt-2">
            Use a different file
          </Button>
        </div>
      )}

      {/* ERROR */}
      {uploadState === "error" && (
        <div
          style={{
            border: "1px solid #F2C9BD",
            background: "#FBEEEA",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14.5,
              fontWeight: 700,
              color: "#B5482E",
            }}
          >
            <span style={{ fontSize: 16 }}>⚠</span> We couldn&apos;t read that file
          </div>
          <div style={{ fontSize: 13.5, color: "#9A5440", marginTop: 8, lineHeight: 1.5 }}>
            {errorMsg}
          </div>
          <div style={{ fontSize: 13, color: "#7A2E1A", marginTop: 8, lineHeight: 1.5 }}>
            {csvErrorAdvice(lastError)}
          </div>
          <Button type="button" variant="primary" onClick={reset} className="mt-3.5">
            Try another file
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={downloadSampleCsv} className="ml-2 mt-3.5">
            Download sample CSV
          </Button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginTop: 18,
          paddingTop: 16,
          borderTop: "1px solid #F0EDE4",
          fontSize: 12,
          color: "#8A857A",
          lineHeight: 1.5,
        }}
      >
        <span style={{ flexShrink: 0, color: "#2E8B57", fontSize: 14 }}>🔒</span>
        <span>
          Your CSV and design are used only for the current batch and are never stored.
          A copy of the finished download is kept for 7 days to prevent misuse, then
          deleted automatically.
        </span>
      </div>
    </div>
  );
}
