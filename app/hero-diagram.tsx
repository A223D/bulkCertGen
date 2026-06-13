"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BATCH_PDF_LIMITS } from "../lib/batch-pdf/limits";

const ROWS = [
  { name: "Amara Okafor", course: "Advanced Data Analytics", date: "May 18, 2026" },
  { name: "Liam Chen", course: "UX Research Foundations", date: "May 18, 2026" },
  { name: "Sofia Marquez", course: "Project Management Pro", date: "May 18, 2026" },
  { name: "Noah Williams", course: "Frontend Engineering", date: "May 18, 2026" },
  { name: "Priya Nair", course: "Cloud Security Basics", date: "May 18, 2026" },
];

export default function HeroDiagram() {
  const [rowIdx, setRowIdx] = useState(0);
  const [genCount, setGenCount] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const row = ROWS[rowIdx];
  const rowNum = String(rowIdx + 1).padStart(2, "0");

  useEffect(() => {
    const id = setInterval(() => setRowIdx((i) => (i + 1) % ROWS.length), 2400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setGenCount((c) => (c >= BATCH_PDF_LIMITS.freeExportRows ? c : c + 1));
    }, 260);
    return () => clearInterval(id);
  }, []);

  const drawWires = useCallback(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    const cert = certRef.current;
    if (!stage || !svg || !cert) return;

    const sr = stage.getBoundingClientRect();
    const cr = cert.getBoundingClientRect();
    if (!sr.width || !sr.height) return;

    // Align each dest port dot with the vertical centre of its field element
    [0, 1, 2].forEach((i) => {
      const field = cert.querySelector(`[data-field="${i}"]`) as HTMLElement | null;
      const port = cert.querySelector(`[data-wdst="${i}"]`) as HTMLElement | null;
      if (!field || !port) return;
      const fr = field.getBoundingClientRect();
      port.style.top = `${fr.top + fr.height / 2 - cr.top}px`;
    });

    // Draw cubic bezier paths between measured port positions
    svg.setAttribute("viewBox", `0 0 ${sr.width} ${sr.height}`);
    const srcs: Record<string, Element> = {};
    const dsts: Record<string, Element> = {};
    stage.querySelectorAll("[data-wsrc]").forEach((e) => {
      srcs[e.getAttribute("data-wsrc")!] = e;
    });
    stage.querySelectorAll("[data-wdst]").forEach((e) => {
      dsts[e.getAttribute("data-wdst")!] = e;
    });
    svg.querySelectorAll("path[data-wire]").forEach((path) => {
      const i = path.getAttribute("data-wire")!;
      const s = srcs[i];
      const d = dsts[i];
      if (!s || !d) return;
      const a = s.getBoundingClientRect();
      const b = d.getBoundingClientRect();
      const x1 = a.right - sr.left;
      const y1 = a.top + a.height / 2 - sr.top;
      const x2 = b.left - sr.left;
      const y2 = b.top + b.height / 2 - sr.top;
      const dx = Math.max(24, x2 - x1);
      (path as SVGPathElement).setAttribute(
        "d",
        `M ${x1} ${y1} C ${x1 + dx * 0.55} ${y1}, ${x2 - dx * 0.55} ${y2}, ${x2} ${y2}`,
      );
    });
    (svg as SVGElement).style.opacity = "1";
  }, []);

  // Initial draw + resize handler
  useEffect(() => {
    const onResize = () => drawWires();
    window.addEventListener("resize", onResize);
    const t1 = setTimeout(drawWires, 100);
    const t2 = setTimeout(drawWires, 700);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [drawWires]);

  // Redraw after row content changes
  useEffect(() => {
    const t = setTimeout(drawWires, 40);
    return () => clearTimeout(t);
  }, [rowIdx, drawWires]);

  const portBase: React.CSSProperties = {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: "50%",
    transform: "translateY(-50%)",
  };

  return (
    <div className="relative">
      <div className="rounded-[26px] border border-[#e7e2d6] bg-white p-[26px] shadow-[0_30px_60px_-32px_rgba(26,25,22,0.30),0_2px_0_rgba(26,25,22,0.02)]">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#9a9486]">
            one design · many rows
          </span>
          <span className="rounded-[7px] bg-[#fbefcb] px-[9px] py-1 font-mono text-[11px] font-bold text-[#8a6a12]">
            row {rowNum} / 248
          </span>
        </div>

        {/* Stage */}
        <div ref={stageRef} className="relative h-[300px]">

          {/* CSV card — position:absolute makes it a positioning context for the port dots */}
          <div
            className="absolute left-0 top-1/2 z-[2] w-[172px] -translate-y-1/2 rounded-[13px] border border-[#e7e2d6] bg-[#fcfbf7] shadow-[0_12px_24px_-16px_rgba(26,25,22,0.25)]"
          >
            {/* Inner div clips rounded corners without hiding the port dots */}
            <div className="overflow-hidden rounded-[13px]">
              <div className="flex items-center gap-[6px] border-b border-[#e7e2d6] bg-[#f4f1e9] px-[10px] py-2">
                <span className="inline-block h-[9px] w-[9px] rounded-[2px] bg-[#2e8b57]" />
                <span className="font-mono text-[10.5px] font-semibold text-[#6e6a61]">
                  recipients.csv
                </span>
              </div>
              <table className="w-full border-collapse font-mono text-[10px]">
                <tbody>
                  {["full_name", "course_name", "issue_date"].map((col) => (
                    <tr key={col} className="bg-[#fbefcb]">
                      <td className="border-b border-[#ede6d6] px-2 py-[7px] font-bold text-[#8a6a12]">
                        {col}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-2 py-[7px] text-[#9a9486]">+ 5 more columns</td>
                  </tr>
                </tbody>
              </table>
              <div className="border-t border-[#e7e2d6] bg-[#f4f1e9] px-2 py-[7px] font-mono text-[9.5px] text-[#9a9486]">
                248 rows
              </div>
            </div>
            {/* Source port dots — right edge, vertically aligned with each CSV row */}
            <span data-wsrc="0" style={{ ...portBase, right: -4.5, top: 44, background: "#F2B01E", boxShadow: "0 0 0 3px #FFFFFF" }} />
            <span data-wsrc="1" style={{ ...portBase, right: -4.5, top: 72, background: "#F2B01E", boxShadow: "0 0 0 3px #FFFFFF" }} />
            <span data-wsrc="2" style={{ ...portBase, right: -4.5, top: 101, background: "#F2B01E", boxShadow: "0 0 0 3px #FFFFFF" }} />
          </div>

          {/* Wires SVG — covers the full stage, z-index between cards */}
          <svg
            ref={svgRef}
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              zIndex: 1,
              overflow: "visible",
              pointerEvents: "none",
              opacity: 0,
            }}
          >
            <path data-wire="0" d="" fill="none" stroke="#F2B01E" strokeWidth="2.5" strokeLinecap="round" />
            <path data-wire="1" d="" fill="none" stroke="#F2B01E" strokeWidth="2.5" strokeLinecap="round" />
            <path data-wire="2" d="" fill="none" stroke="#F2B01E" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          {/* Certificate card */}
          <div
            ref={certRef}
            className="rounded-[13px] border border-[#e7e2d6] border-t-[3px] border-t-[#f2b01e] bg-white text-center shadow-[0_18px_36px_-20px_rgba(26,25,22,0.35)]"
            style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2, width: 200 }}
          >
            {/* Dest port dots — top is set dynamically by drawWires */}
            <span data-wdst="0" style={{ ...portBase, left: -4.5, top: 0, background: "#FFFFFF", border: "2.5px solid #F2B01E", zIndex: 3 }} />
            <span data-wdst="1" style={{ ...portBase, left: -4.5, top: 0, background: "#FFFFFF", border: "2.5px solid #F2B01E", zIndex: 3 }} />
            <span data-wdst="2" style={{ ...portBase, left: -4.5, top: 0, background: "#FFFFFF", border: "2.5px solid #F2B01E", zIndex: 3 }} />

            <div className="p-[18px]">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-[#a39b8a]">
                Certificate of Completion
              </p>
              <div className="mx-auto my-[9px] h-px w-[34px] bg-[#e7e2d6]" />
              <p className="text-[8px] text-[#a39b8a]">This certifies that</p>

              <div
                data-field="0"
                className="relative mt-1 rounded-[6px] border-l-2 border-[#f2b01e] bg-[#fbefcb] px-[6px] py-[5px]"
              >
                <span className="font-serif text-[21px] leading-[1.1] text-[#1a1916]">
                  {row.name}
                </span>
              </div>

              <p className="mt-[11px] text-[8px] text-[#a39b8a]">has completed</p>

              <div
                data-field="1"
                className="relative mt-1 inline-block rounded-[6px] border-l-2 border-[#f2b01e] bg-[#fbefcb] px-[9px] py-[5px]"
              >
                <span className="text-[11px] font-bold text-[#1a1916]">{row.course}</span>
              </div>

              <div className="mt-[26px] flex items-end justify-between gap-3 text-left">
                <div data-field="2">
                  <div className="relative inline-block rounded-[5px] border-l-2 border-[#f2b01e] bg-[#fbefcb] px-[6px] py-1">
                    <span className="font-mono text-[9px] font-semibold text-[#1a1916]">
                      {row.date}
                    </span>
                  </div>
                  <p className="mt-1 text-[7px] text-[#a39b8a]">Date issued</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-[12px] italic text-[#1a1916]">A. Rivera</p>
                  <div className="ml-auto mt-[2px] h-px w-[46px] bg-[#cfc8b8]" />
                  <p className="mt-[2px] text-[7px] text-[#a39b8a]">Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output bar */}
        <div className="mt-[18px] flex flex-wrap items-center gap-3 rounded-[14px] bg-[#1a1916] p-[14px_16px]">
          <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[#f2b01e] text-[15px] font-extrabold text-[#1a1916]">
            ↓
          </span>
          <div className="min-w-44 flex-1">
            <p className="text-[13.5px] font-bold text-[#fffefa]">Generating personalized PDFs…</p>
            <div className="mt-[7px] h-[6px] overflow-hidden rounded-full bg-[#332f28]">
              <div
                className="h-full rounded-full bg-[#f2b01e]"
                style={{
                  width: `${(genCount / BATCH_PDF_LIMITS.freeExportRows) * 100}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
          <span className="font-mono text-[12px] font-bold text-[#f2b01e]">{genCount} ready</span>
          <span className="rounded-[9px] bg-[#332f28] px-[11px] py-[7px] font-mono text-[11px] font-semibold text-[#f3efe6]">
            batch.zip
          </span>
        </div>
      </div>
    </div>
  );
}
