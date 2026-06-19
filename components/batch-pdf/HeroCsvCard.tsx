"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseCsvText, validateCsvFile } from "@/lib/batch-pdf/csv";
import { saveSessionCsv } from "@/lib/batch-pdf/session-csv";
import type { CsvParseResult } from "@/lib/batch-pdf/types";

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

export function HeroCsvCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("empty");
  const [csvResult, setCsvResult] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const ingest = useCallback((text: string, name: string) => {
    const result = parseCsvText(text);
    if (!result.ok) {
      setErrorMsg(result.errors[0]?.message ?? "Could not read that CSV.");
      setUploadState("error");
      return;
    }
    setCsvResult(result.value);
    setFileName(name);
    setUploadState("success");
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validation = validateCsvFile(file);
      if (!validation.ok) {
        setErrorMsg(validation.errors[0]?.message ?? "Invalid file.");
        setUploadState("error");
        return;
      }
      setFileName(file.name);
      setUploadState("parsing");
      const reader = new FileReader();
      reader.onload = () => {
        ingest(reader.result as string, file.name);
      };
      reader.onerror = () => {
        setErrorMsg("We couldn't open that file. Try saving a fresh copy.");
        setUploadState("error");
      };
      reader.readAsText(file);
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
    setUploadState("empty");
  };

  const continueToWizard = () => {
    if (!csvResult) return;
    saveSessionCsv(csvResult, fileName);
    router.push("/create");
  };

  const isDrag = uploadState === "drag";

  return (
    <div
      id="vs-start"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E7E2D6",
        borderRadius: 22,
        padding: 26,
        boxShadow: "0 30px 60px -34px rgba(26,25,22,0.32), 0 2px 0 rgba(26,25,22,0.02)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
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
          }}
        >
          Step 1 of 6
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
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#F2B01E",
                color: "#1A1916",
                fontWeight: 700,
                fontSize: 15,
                padding: "13px 18px",
                border: "none",
                borderRadius: 11,
                cursor: "pointer",
                boxShadow: "0 2px 0 #C98F11, 0 10px 22px -10px rgba(242,176,30,0.6)",
              }}
            >
              Upload CSV
            </button>
            <button
              type="button"
              onClick={loadSample}
              style={{
                flexShrink: 0,
                background: "#FFFFFF",
                color: "#1A1916",
                fontWeight: 700,
                fontSize: 15,
                padding: "13px 18px",
                border: "1.5px solid #DAD3C4",
                borderRadius: 11,
                cursor: "pointer",
              }}
            >
              Try sample CSV
            </button>
          </div>
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
              Spreadsheet looks good — ready to choose a template
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

          <button
            type="button"
            onClick={continueToWizard}
            style={{
              width: "100%",
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              background: "#1A1916",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              padding: "14px 18px",
              border: "none",
              borderRadius: 11,
              cursor: "pointer",
            }}
          >
            Continue — choose a design <span>→</span>
          </button>
          <button
            type="button"
            onClick={reset}
            style={{
              width: "100%",
              marginTop: 8,
              background: "transparent",
              color: "#8A857A",
              fontWeight: 600,
              fontSize: 13,
              padding: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            Use a different file
          </button>
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
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 14,
              background: "#1A1916",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              padding: "11px 18px",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Try another file
          </button>
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
          Your CSV and design are used only for the current batch. We do not store uploaded
          spreadsheets, uploaded designs, or generated PDFs.
        </span>
      </div>
    </div>
  );
}
