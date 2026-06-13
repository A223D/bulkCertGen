"use client";

import { useCallback, useEffect, useRef } from "react";

export default function MapDiagram() {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const drawWires = useCallback(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    if (!stage || !svg) return;

    const sr = stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return;

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

  const portStyle: React.CSSProperties = {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: "50%",
    transform: "translateY(-50%)",
    zIndex: 3,
  };

  return (
    <div
      ref={stageRef}
      className="relative grid items-center gap-0"
      style={{ gridTemplateColumns: "150px 1fr" }}
    >
      {/* Column chips */}
      <div className="relative z-[2] flex flex-col gap-[13px]">
        <div
          data-wsrc="0"
          className="flex cursor-grab items-center gap-2 rounded-[10px] border border-[#e7e2d6] bg-white px-3 py-[10px] shadow-[0_6px_14px_-10px_rgba(26,25,22,0.3)]"
        >
          <span className="text-[12px] tracking-[-1px] text-[#cfc8b8]" aria-hidden="true">
            ⠿
          </span>
          <span className="font-mono text-[11px] font-bold text-[#1a1916]">full_name</span>
        </div>
        <div
          data-wsrc="1"
          className="flex cursor-grab items-center gap-2 rounded-[10px] border border-[#e7e2d6] bg-white px-3 py-[10px] shadow-[0_6px_14px_-10px_rgba(26,25,22,0.3)]"
        >
          <span className="text-[12px] tracking-[-1px] text-[#cfc8b8]" aria-hidden="true">
            ⠿
          </span>
          <span className="font-mono text-[11px] font-bold text-[#1a1916]">company</span>
        </div>
        <div
          data-wsrc="2"
          className="flex cursor-grab items-center gap-2 rounded-[10px] border border-[#e7e2d6] bg-white px-3 py-[10px] shadow-[0_6px_14px_-10px_rgba(26,25,22,0.3)]"
        >
          <span className="text-[12px] tracking-[-1px] text-[#cfc8b8]" aria-hidden="true">
            ⠿
          </span>
          <span className="font-mono text-[11px] font-bold text-[#1a1916]">seat_number</span>
        </div>
      </div>

      {/* Wires SVG */}
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

      {/* Badge card with dest ports */}
      <div className="relative z-[2] justify-self-end w-[210px] rounded-[16px] bg-[#1a1916] p-[22px_20px_24px] text-center shadow-[0_24px_48px_-24px_rgba(26,25,22,0.55)]">
        <span
          data-wdst="0"
          style={{ ...portStyle, left: -5, top: 89, background: "#1A1916", border: "2.5px solid #F2B01E" }}
        />
        <span
          data-wdst="1"
          style={{ ...portStyle, left: -5, top: 139, background: "#1A1916", border: "2.5px solid #F2B01E" }}
        />
        <span
          data-wdst="2"
          style={{ ...portStyle, left: -5, top: 190, background: "#1A1916", border: "2.5px solid #F2B01E" }}
        />
        <div className="mx-auto mb-[18px] h-[7px] w-[50px] rounded-full bg-[#332f28]" />
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#7a756a]">
          ATTENDEE
        </p>
        <div className="mt-3 rounded-[8px] bg-[#fbefcb] px-[6px] py-2">
          <span className="text-[17px] font-extrabold text-[#1a1916]">Amara Okafor</span>
        </div>
        <div className="mt-[10px] rounded-[8px] border-[1.5px] border-dashed border-[#f2b01e] bg-[#2a2723] px-[6px] py-[7px]">
          <span className="text-[11px] font-bold text-[#f2b01e]">Northwind Labs</span>
        </div>
        <div className="mt-[10px] grid grid-cols-2 gap-2">
          <div className="rounded-[8px] border-[1.5px] border-dashed border-[#8a6a12] bg-[#fbefcb] px-[6px] py-[7px]">
            <p className="text-[7px] text-[#8a6a12]">SEAT</p>
            <p className="font-mono text-[11px] font-extrabold text-[#1a1916]">A-118</p>
          </div>
          <div className="rounded-[8px] bg-[#2a2723] px-[6px] py-[7px]">
            <p className="text-[7px] text-[#7a756a]">ROLE</p>
            <p className="text-[10px] font-bold text-white">Speaker</p>
          </div>
        </div>
      </div>
    </div>
  );
}
