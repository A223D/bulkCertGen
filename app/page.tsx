import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { BATCH_PDF_LIMITS } from "../lib/batch-pdf/limits";
import { HeroCsvCard } from "@/components/batch-pdf/HeroCsvCard";
import MapDiagram from "./map-diagram";

export const metadata: Metadata = {
  title: "Batch PDF Generator | Very Simple Batch PDF",
  description:
    "Bring a design with blank spaces, upload a CSV, and map your columns to the blanks. Preview the results, then export a ZIP of finished PDFs.",
  openGraph: {
    title: "Batch PDF Generator | Very Simple Batch PDF",
    description:
      "Turn one design into hundreds of personalized PDFs. No design tools to learn.",
  },
};

type Step = {
  title: string;
  eyebrow: string;
  description: string;
  dark?: boolean;
};

type UseCase = {
  title: string;
  description: string;
  kind: "certificate" | "badge" | "id" | "labels" | "appointment" | "table" | "tag" | "pass";
};

type Faq = {
  question: string;
  answer: string;
};

type PricingPlan = {
  name: string;
  badge: string;
  headline: string;
  description: string;
  features: string[];
  cta: string;
  dark?: boolean;
};

const navLinks = [
  { href: "#how", label: "How it works" },
  { href: "#uses", label: "Use cases" },
  { href: "#mapping", label: "Mapping" },
  { href: "#export", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const footerNavLinks = [
  { href: "#how", label: "How it works" },
  { href: "#uses", label: "Use cases" },
  { href: "#export", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const heroChecks = [
  `${BATCH_PDF_LIMITS.freeExportRows} PDFs free`,
  "No account to start",
  "Files not stored",
];

export const homepageSteps: Step[] = [
  {
    title: "Bring your design",
    eyebrow: ".png · .jpg · .pdf",
    description:
      "Upload a PNG, JPG, or PDF with blank spaces — or start from a simple template inside the tool.",
  },
  {
    title: "Upload your CSV",
    eyebrow: ".csv",
    description:
      "Each row becomes one PDF. We detect your columns automatically and show a quick preview.",
  },
  {
    title: "Map columns to blanks",
    eyebrow: "drag → drop",
    description:
      "Drag a column onto each blank space on your design. Name → name area, date → date area.",
  },
  {
    title: "Download finished PDFs",
    eyebrow: "batch.zip",
    description: "Preview, then export everything as a single ZIP. One click, every PDF.",
    dark: true,
  },
];

export const homepageUseCases: UseCase[] = [
  { title: "Certificates", description: "Courses, awards, completion", kind: "certificate" },
  { title: "Event badges", description: "Conferences, meetups", kind: "badge" },
  { title: "ID cards", description: "Staff, members, students", kind: "id" },
  { title: "Mailing labels", description: "Addresses, return slips", kind: "labels" },
  { title: "Appointment cards", description: "Clinics, salons, services", kind: "appointment" },
  { title: "Table cards", description: "Weddings, dinners, seating", kind: "table" },
  { title: "Gift tags", description: "Favors, hampers, presents", kind: "tag" },
  { title: "Workshop passes", description: "Classes, sessions, entry", kind: "pass" },
];

export const homepagePricingPlans: PricingPlan[] = [
  {
    name: "Free",
    badge: "available now",
    headline: `Up to ${BATCH_PDF_LIMITS.freeExportRows} PDFs`,
    description:
      "Per batch, generated and exported as a ZIP. Plenty to try it on a real list.",
    features: [
      "Bring your own design",
      "Map columns to blanks",
      "Preview & overflow checks",
      "Download as ZIP",
    ],
    cta: "Create PDFs",
  },
  {
    name: "Full batch",
    badge: "coming next",
    headline: "Every row",
    description:
      "Export an entire spreadsheet — hundreds or thousands of personalized PDFs in one batch.",
    features: [
      "Unlimited rows per batch",
      "Bulk overflow handling",
      "Saved designs & mappings",
      "In active development",
    ],
    cta: "Notify me",
    dark: true,
  },
];

export const homepageFaqs: Faq[] = [
  {
    question: "What is a CSV?",
    answer:
      "A CSV is just a spreadsheet saved as plain text — the kind you export from Excel, Google Sheets, or Numbers. Each row is one record (one person, one badge, one label), and each column is a field like name, date, or seat number.",
  },
  {
    question: "Can I use my own design?",
    answer:
      "Yes. Upload a design that already has blank spaces where the personalized details should go, then map your CSV columns onto those blanks. Uploading your own designs is the intended direction of the product.",
  },
  {
    question: "Can I use a PDF, PNG, or JPEG design?",
    answer:
      "PNG and JPG backgrounds work today, and PDF designs are on the roadmap. Whatever you bring, you map your spreadsheet columns to the blank areas on top of it.",
  },
  {
    question: "What happens if text is too long?",
    answer:
      "We preview each row first and flag any value that may not fit its space. You decide how to handle overflow: shrink the text slightly, wrap it, truncate it, or flag the row for review — nothing is silently clipped.",
  },
  {
    question: "How many PDFs can I generate for free?",
    answer: `You can generate up to ${BATCH_PDF_LIMITS.freeExportRows} PDFs per batch for free and download them as a ZIP. Full-batch export for entire spreadsheets is the next feature we're shipping.`,
  },
  {
    question: "Do you store my files?",
    answer:
      "Your CSV is used only to generate the current batch. We do not store uploaded spreadsheets or generated PDF files — once your ZIP is ready, the source data isn't kept.",
  },
  {
    question: "Can I generate certificates, name badges, and labels?",
    answer:
      "Yes — certificates, event badges, ID cards, mailing labels, appointment cards, table cards, gift tags, and workshop passes are all just one design plus a row of data. If the layout repeats, this fills the blanks for every row.",
  },
  {
    question: "Is this a Canva replacement?",
    answer:
      "No. This is for batch-personalizing designs you already have, or simple templates you choose inside the tool. It's not a full design editor — it's the step that turns one design and a spreadsheet into many finished PDFs.",
  },
];

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm";
  return (
    <span
      style={{
        position: "relative",
        width: s ? 30 : 34,
        height: s ? 30 : 34,
        display: "inline-block",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: "#F2B01E",
          borderRadius: s ? 8 : 9,
          transform: "rotate(-6deg)",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: s ? 6 : 7,
          top: s ? 5 : 6,
          width: s ? 15 : 17,
          height: s ? 18 : 21,
          background: "#FFFFFF",
          borderRadius: 3,
          boxShadow: s ? "3px 3px 0 #1A1916" : "4px 4px 0 #1A1916",
        }}
      />
    </span>
  );
}

function SectionKicker({
  children,
  variant = "light",
}: {
  children: React.ReactNode;
  variant?: "light" | "dark";
}) {
  return (
    <p
      className={`font-mono text-xs font-semibold uppercase tracking-[0.12em] ${
        variant === "dark" ? "text-[#f2b01e]" : "text-[#b58a12]"
      }`}
    >
      {children}
    </p>
  );
}

function PrimaryButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href="/create"
      className={`inline-flex min-h-12 items-center justify-center gap-[9px] rounded-xl bg-[#f2b01e] px-[26px] py-[15px] text-[16px] font-bold text-[#1a1916] shadow-[0_2px_0_#c98f11,0_10px_24px_-8px_rgba(242,176,30,0.55)] transition hover:-translate-y-0.5 hover:bg-[#f7c642] ${className}`}
    >
      {children}
      <span aria-hidden="true" className="text-lg leading-none">
        →
      </span>
    </Link>
  );
}

function ManualLoopCard() {
  const painPoints = [
    "Typing each recipient's name into a certificate",
    "Editing event badges and ID cards one at a time",
    "Duplicating the same design over and over",
    "Fighting a clunky mail-merge just to export PDFs",
  ];

  return (
    <section style={{ padding: "40px 0 20px" }}>
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid gap-[52px] rounded-[28px] bg-[#1a1916] p-[52px] text-[#fcfbf7] lg:grid-cols-2 lg:items-center">
          <div>
            <SectionKicker variant="dark">The old way</SectionKicker>
            <h2 className="mt-4 max-w-xl text-[42px] font-extrabold leading-[1.06] tracking-[-0.03em]">
              Stop copy-pasting names one by one.
            </h2>
            <p className="mt-[18px] max-w-[440px] text-[17px] leading-[1.6] text-[#b7b1a4]">
              Personalizing a stack of documents by hand is slow, error-prone, and
              mind-numbing. You shouldn&apos;t have to duplicate the same design 200 times.
            </p>
            <div className="mt-7 flex flex-col gap-3">
              {painPoints.map((point) => (
                <div key={point} className="flex items-center gap-[13px] text-[15px] font-medium text-[#e7e2d6]">
                  <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] bg-[#2a2723] font-bold text-[#e8775b]">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative rotate-[-2deg] rounded-[18px] bg-[#fcfbf7] p-6 text-center text-[#1a1916] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.6)]">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#a39b8a]">
                Certificate of Completion
              </p>
              <div className="mt-[14px] text-center">
                <span className="font-serif text-[26px] text-[#1a1916] [border-bottom:2px_solid_#F2B01E] pb-0.5">
                  Jordan
                </span>
              </div>
              <p className="mt-[4px] text-center text-[11px] text-[#a39b8a]">
                manual entry · row 38 of 248
              </p>
              <div className="mt-[18px] flex justify-center gap-[6px] font-mono text-[10px] text-[#8a857a]">
                <span className="rounded-[6px] bg-[#efeadf] px-2 py-1">⌘C</span>
                <span className="rounded-[6px] bg-[#efeadf] px-2 py-1">⌘V</span>
                <span className="rounded-[6px] bg-[#fbefcb] px-2 py-1 font-bold text-[#8a6a12]">
                  × 248 times
                </span>
              </div>
            </div>
            <div className="absolute inset-0 -z-10 translate-x-[14px] translate-y-3 rotate-3 rounded-[18px] bg-[#efeadf]" />
            <div className="absolute inset-0 -z-20 translate-x-[26px] translate-y-[22px] rotate-6 rounded-[18px] bg-[#ded8c9]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="mb-4 flex h-[84px] items-center justify-center rounded-xl border border-dashed border-[#d8d1c2] bg-[#fcfbf7]">
        <div className="relative h-[62px] w-[50px] rounded-[5px] border border-[#e7e2d6] bg-white shadow-[0_4px_10px_-6px_rgba(0,0,0,0.25)]">
          <div className="absolute inset-[8px] rounded-[3px] border-[1.5px] border-dashed border-[#f2b01e]" />
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="mb-4 h-[84px] overflow-hidden rounded-xl border border-[#ede6d6] bg-[#fcfbf7]">
        <div className="grid grid-cols-3 font-mono text-[8.5px]">
          {["name", "course", "date"].map((col) => (
            <div key={col} className="bg-[#fbefcb] px-[6px] py-1 font-bold text-[#8a6a12]">
              {col}
            </div>
          ))}
          {["Amara", "Data", "May 18", "Liam", "UX", "May 18"].map((val, i) => (
            <div key={i} className="border-t border-[#ede6d6] px-[6px] py-1 text-[#6e6a61]">
              {val}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="relative mb-4 flex h-[84px] items-center justify-between rounded-xl border border-[#ede6d6] bg-[#fcfbf7] px-[14px]">
        <span className="rounded-[6px] bg-[#fbefcb] px-2 py-1 font-mono text-[10px] font-bold text-[#8a6a12]">
          full_name
        </span>
        <svg width="60" height="20" style={{ overflow: "visible" }} aria-hidden="true">
          <path
            d="M2 10 H 58"
            stroke="#F2B01E"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
          <circle cx="2" cy="10" r="3" fill="#F2B01E" />
          <circle cx="58" cy="10" r="3" fill="white" stroke="#F2B01E" strokeWidth="2" />
        </svg>
        <span className="rounded-[6px] border-[1.5px] border-dashed border-[#f2b01e] px-2 py-1 text-[10px] text-[#6e6a61]">
          name area
        </span>
      </div>
    );
  }

  return (
    <div className="relative mb-4 flex h-[84px] items-center justify-center rounded-xl bg-[#252019]">
      <div className="relative">
        <div
          className="absolute h-[54px] w-[42px] rounded-[5px] bg-[#3a352d]"
          style={{ transform: "translate(10px, -6px) rotate(8deg)" }}
        />
        <div
          className="absolute h-[54px] w-[42px] rounded-[5px] bg-[#56503f]"
          style={{ transform: "translate(5px, -3px) rotate(4deg)" }}
        />
        <div className="relative h-[54px] w-[42px] rounded-[5px] bg-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.6)]">
          <div className="absolute left-[6px] right-[6px] top-[6px] h-[3px] rounded-sm bg-[#f2b01e]" />
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const badgeBg = index < 3 ? "bg-[#f7ce5e]" : "bg-[#f2b01e]";

  return (
    <article
      className={`rounded-[18px] border p-[22px] ${
        step.dark
          ? "border-[#1a1916] bg-[#1a1916] text-[#fffefa] shadow-[0_14px_30px_-18px_rgba(26,25,22,0.5)]"
          : "border-[#e7e2d6] bg-white text-[#1a1916] shadow-[0_1px_0_rgba(26,25,22,0.02)]"
      }`}
    >
      <div className="mb-[18px] flex items-center justify-between">
        <span
          className={`${badgeBg} inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] font-mono text-[13px] font-bold text-[#1a1916]`}
        >
          {index + 1}
        </span>
        <span className={`font-mono text-[10px] ${step.dark ? "text-[#7a756a]" : "text-[#b0aa9c]"}`}>
          {step.eyebrow}
        </span>
      </div>
      <StepVisual index={index} />
      <h3 className="text-[18px] font-bold leading-snug tracking-[-0.01em]">{step.title}</h3>
      <p className={`mt-[6px] text-[14px] leading-[1.5] ${step.dark ? "text-[#b7b1a4]" : "text-[#6e6a61]"}`}>
        {step.description}
      </p>
    </article>
  );
}

function UseCaseVisual({ kind }: { kind: UseCase["kind"] }) {
  const base =
    "mb-[14px] flex h-[110px] items-center justify-center rounded-[11px] border border-[#efeadf] bg-[#fcfbf7]";

  if (kind === "certificate") {
    return (
      <div className={base}>
        <div className="h-[80px] w-[120px] rounded-[5px] border border-[#e7e2d6] bg-white p-[10px_12px] text-center shadow-[0_6px_14px_-8px_rgba(0,0,0,0.25)]">
          <div className="mx-auto mb-[9px] h-[3px] w-[40px] rounded-full bg-[#f2b01e]" />
          <p className="font-serif text-[13px] text-[#1a1916]">Amara O.</p>
          <div className="mx-auto mt-2 h-[2px] w-[60px] rounded-full bg-[#e7e2d6]" />
          <div className="mx-auto mt-[5px] h-[2px] w-[44px] rounded-full bg-[#e7e2d6]" />
        </div>
      </div>
    );
  }

  if (kind === "badge") {
    return (
      <div className={base}>
        <div className="w-[66px]">
          <div className="relative z-[2] mx-auto h-[6px] w-[24px] rounded-full bg-[#1a1916]" />
          <div className="-mt-[3px] rounded-[8px] bg-[#1a1916] p-[10px_8px_11px] text-center">
            <div className="mx-auto mb-2 h-[3px] w-[30px] rounded-full bg-[#f2b01e]" />
            <p className="text-[11px] font-bold text-white">L. Chen</p>
            <p className="mt-[3px] text-[8px] text-[#b7b1a4]">SPEAKER</p>
            <div className="mx-auto mt-2 h-[2px] w-[34px] rounded-full bg-[#3a352d]" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "id") {
    return (
      <div className={base}>
        <div className="flex h-[72px] w-[120px] items-center gap-[9px] rounded-[7px] border border-[#e7e2d6] bg-white p-[10px] shadow-[0_6px_14px_-8px_rgba(0,0,0,0.25)]">
          <div className="h-[42px] w-[34px] shrink-0 rounded-[5px] bg-[#fbefcb]" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-[#1a1916]">S. Marquez</p>
            <div className="mt-[7px] h-[2px] w-[48px] rounded-full bg-[#e7e2d6]" />
            <div className="mt-1 h-[2px] w-[38px] rounded-full bg-[#e7e2d6]" />
            <p className="mt-1 font-mono text-[7px] text-[#b58a12]">ID 04821</p>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "labels") {
    return (
      <div className={`${base} grid grid-cols-2 gap-[6px] p-4`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[30px] w-[54px] rounded-[4px] border border-[#e7e2d6] bg-white p-[5px]"
          >
            <div className="h-[2px] w-[40px] rounded-full bg-[#1a1916]" />
            <div className="mt-1 h-[2px] w-[30px] rounded-full bg-[#e7e2d6]" />
            <div className="mt-[3px] h-[2px] w-[34px] rounded-full bg-[#e7e2d6]" />
          </div>
        ))}
      </div>
    );
  }

  if (kind === "appointment") {
    return (
      <div className={base}>
        <div className="h-[72px] w-[120px] rounded-[7px] border border-[#e7e2d6] bg-white p-[11px_13px] shadow-[0_6px_14px_-8px_rgba(0,0,0,0.25)]">
          <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[#b58a12]">
            APPOINTMENT
          </p>
          <p className="mt-[5px] text-[11px] font-bold text-[#1a1916]">N. Williams</p>
          <div className="mt-[9px] flex gap-[6px]">
            <span className="rounded-[4px] bg-[#fbefcb] px-[6px] py-[3px] font-mono text-[7.5px] font-bold text-[#8a6a12]">
              Jun 24
            </span>
            <span className="rounded-[4px] bg-[#f4f1e9] px-[6px] py-[3px] font-mono text-[7.5px] font-bold text-[#6e6a61]">
              10:30
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "table") {
    return (
      <div className={`${base} items-end pb-[14px]`}>
        <div>
          <div className="h-[48px] w-[78px] rounded-[5px_5px_0_0] border border-[#e7e2d6] bg-white pt-[10px] text-center shadow-[0_8px_16px_-10px_rgba(0,0,0,0.3)]">
            <p className="font-serif text-[20px] leading-none text-[#1a1916]">12</p>
            <p className="mt-[2px] text-[8px] text-[#8a857a]">Garden Room</p>
          </div>
          <div className="h-[8px] w-[78px] rounded-[0_0_4px_4px] bg-[#efeadf]" />
        </div>
      </div>
    );
  }

  if (kind === "tag") {
    return (
      <div className={base}>
        <div
          className="relative h-[56px] w-[84px] rounded-[6px] border border-[#e7e2d6] bg-white p-[10px_12px] shadow-[0_6px_14px_-8px_rgba(0,0,0,0.25)]"
          style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)" }}
        >
          <div className="absolute left-[9px] top-[24px] h-[7px] w-[7px] -translate-y-1/2 rounded-full border-[1.5px] border-[#d8d1c2] bg-[#fcfbf7]" />
          <div className="ml-2">
            <p className="text-[8px] text-[#8a857a]">To:</p>
            <p className="mt-[1px] font-serif text-[14px] text-[#1a1916]">Priya</p>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "pass") {
    return (
      <div className={base}>
        <div className="flex items-stretch overflow-hidden rounded-[7px] bg-[#1a1916] shadow-[0_6px_14px_-8px_rgba(0,0,0,0.4)]">
          <div className="p-[11px_13px]">
            <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[#f2b01e]">
              WORKSHOP PASS
            </p>
            <p className="mt-[5px] text-[11px] font-bold text-white">A. Okafor</p>
            <p className="mt-1 text-[8px] text-[#b7b1a4]">Studio B · 2pm</p>
          </div>
          <div className="my-[6px] w-0 border-l-2 border-dashed border-[#4a463e]" />
          <div className="flex items-center px-[9px]">
            <p
              className="font-mono text-[8px] font-bold text-[#f2b01e]"
              style={{ writingMode: "vertical-rl" }}
            >
              #A-118
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function MappingPanel() {
  const mappings = [
    ["full_name", "name area"],
    ["company", "company area"],
    ["seat_number", "seat / table area"],
  ];

  return (
    <section id="mapping" style={{ padding: "56px 0 36px" }}>
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid gap-[46px] rounded-[28px] border border-[#e7e2d6] bg-[#fffefb] p-6 shadow-[0_1px_0_rgba(26,25,22,0.02)] sm:p-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <SectionKicker>The mapping</SectionKicker>
            <h2 className="mt-[14px] max-w-xl text-[42px] font-extrabold leading-[1.07] tracking-[-0.03em]">
              Fill the blanks from your spreadsheet.
            </h2>
            <p className="mt-[14px] max-w-[430px] text-[17px] leading-[1.6] text-[#57534a]">
              Drag a column onto each blank space on your design. It&apos;s not a formula or a
              template language — you just connect your data to where it goes.
            </p>
            <div className="mt-[26px] flex flex-col gap-[14px]">
              {mappings.map(([column, target]) => (
                <div key={column} className="flex items-center gap-[13px]">
                  <span className="rounded-[7px] bg-[#fbefcb] px-[9px] py-[5px] font-mono text-[11px] font-bold text-[#8a6a12]">
                    {column}
                  </span>
                  <span className="text-[#b0aa9c]">→</span>
                  <span className="text-[14px] font-semibold text-[#1a1916]">{target}</span>
                </div>
              ))}
            </div>
          </div>

          <MapDiagram />
        </div>
      </div>
    </section>
  );
}

function PreviewPanel() {
  const checkItems = [
    {
      title: "Flag rows that may not fit",
      sub: "Long values are caught and listed before export, not after.",
    },
    {
      title: "Choose how overflow is handled",
      sub: "Shrink text slightly, wrap it, truncate, or flag the row for review — your call.",
    },
    {
      title: "Step through every row",
      sub: "Spot-check the first, last, or any row in your CSV.",
    },
  ];

  return (
    <section style={{ padding: "56px 0 36px" }}>
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid gap-[46px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="lg:order-2">
            <SectionKicker>Preview &amp; checks</SectionKicker>
            <h2 className="mt-[14px] max-w-xl text-[42px] font-extrabold leading-[1.07] tracking-[-0.03em]">
              Preview before you export.
            </h2>
            <p className="mt-[14px] max-w-[440px] text-[17px] leading-[1.6] text-[#57534a]">
              See how each row looks in your design before you generate anything. If a
              name or title is too long to fit, we flag the row first — so you&apos;re never
              surprised by a clipped PDF.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {checkItems.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="mt-[1px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[#1a1916] font-extrabold text-[13px] text-[#f2b01e]">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[#1a1916]">{item.title}</p>
                    <p className="text-[13.5px] text-[#6e6a61]">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:order-1 rounded-[22px] border border-[#e7e2d6] bg-white p-[22px] shadow-[0_24px_50px_-30px_rgba(26,25,22,0.3)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#1a1916]">Preview</span>
              <div className="flex items-center gap-[6px] font-mono text-[11px] text-[#8a857a]">
                <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border border-[#e7e2d6]">
                  ‹
                </span>
                row 184 / 248
                <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border border-[#e7e2d6]">
                  ›
                </span>
              </div>
            </div>
            <div className="rounded-[14px] border border-[#efeadf] bg-[#fcfbf7] p-5 text-center">
              <div className="mx-auto mb-[14px] h-[3px] w-[48px] rounded-full bg-[#f2b01e]" />
              <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#a39b8a]">
                CERTIFICATE OF COMPLETION
              </p>
              <div className="relative mt-3 rounded-[8px] border-[1.5px] border-[#e8775b] bg-[#fbeeea] p-1">
                <span className="absolute -right-[7px] -top-[9px] rounded-[6px] bg-[#e8775b] px-[6px] py-[2px] font-mono text-[8px] font-bold text-white">
                  too long
                </span>
                <p className="font-serif text-[19px] leading-[1.1] text-[#1a1916]">
                  Maximilian Featherstonehaugh-Vance
                </p>
              </div>
              <p className="mt-2 text-[9px] text-[#a39b8a]">has completed Advanced Data Analytics</p>
            </div>
            <div className="mt-[14px] rounded-[12px] border border-[#f2c9bd] bg-[#fbeeea] p-[12px_14px]">
              <div className="flex items-center gap-2 text-[13px] font-bold text-[#b5482e]">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Name may not fit the name area
              </div>
              <div className="mt-[11px] flex flex-wrap gap-2">
                {["Shrink to fit", "Wrap text", "Truncate", "Flag for review"].map((mode, i) => (
                  <span
                    key={mode}
                    className={`rounded-[8px] px-[11px] py-[6px] text-[11.5px] font-bold ${
                      i === 0
                        ? "bg-[#1a1916] text-white"
                        : "border border-[#e7e2d6] bg-white text-[#4a463e]"
                    }`}
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="export" style={{ padding: "56px 0 36px" }}>
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="mx-auto mb-10 max-w-[620px] text-center">
          <SectionKicker>Generate &amp; export</SectionKicker>
          <h2 className="mt-[14px] text-[44px] font-extrabold leading-[1.06] tracking-[-0.03em]">
            Download everything as a ZIP.
          </h2>
          <p className="mt-3 text-[17.5px] leading-[1.55] text-[#57534a]">
            Generate your PDFs and download them in one bundle. Start free — full-batch
            export is coming next.
          </p>
        </div>

        <div className="mx-auto grid max-w-[880px] gap-[22px] md:grid-cols-2">
          {homepagePricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`relative overflow-hidden rounded-[20px] border p-[30px] ${
                plan.dark
                  ? "border-[#1a1916] bg-[#1a1916] text-[#fffefa]"
                  : "border-[#e7e2d6] bg-white text-[#1a1916]"
              }`}
            >
              {plan.dark && (
                <div
                  className="pointer-events-none absolute -right-[30px] -top-[30px] h-[120px] w-[120px]"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(242,176,30,0.22), transparent 70%)",
                  }}
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center justify-between">
                <h3 className={`text-[16px] font-bold ${plan.dark ? "text-white" : ""}`}>
                  {plan.name}
                </h3>
                <span
                  className={`rounded-full px-[10px] py-[5px] font-mono text-[11px] font-bold ${
                    plan.dark ? "bg-[#2a2723] text-[#f2b01e]" : "bg-[#e7f3ec] text-[#2e8b57]"
                  }`}
                >
                  {plan.badge}
                </span>
              </div>
              <p
                className={`mt-[18px] text-[46px] font-extrabold leading-none tracking-[-0.03em] ${
                  plan.dark ? "text-white" : ""
                }`}
              >
                {plan.headline}
              </p>
              <p
                className={`mt-[6px] text-[14.5px] leading-[1.55] ${
                  plan.dark ? "text-[#b7b1a4]" : "text-[#6e6a61]"
                }`}
              >
                {plan.description}
              </p>
              <div className="mt-[22px] flex flex-col gap-[10px]">
                {plan.features.map((feature, i) => (
                  <div
                    key={feature}
                    className={`flex gap-[9px] text-[14.5px] ${
                      plan.dark ? "text-[#e7e2d6]" : "text-[#3a372f]"
                    }`}
                  >
                    {plan.dark && i === plan.features.length - 1 ? (
                      <span className="font-extrabold text-[#7a756a]">○</span>
                    ) : (
                      <span
                        className={`font-extrabold ${
                          plan.dark ? "text-[#f2b01e]" : "text-[#2e8b57]"
                        }`}
                      >
                        ✓
                      </span>
                    )}
                    {plan.dark && i === plan.features.length - 1 ? (
                      <span className="text-[#9a9486]">{feature}</span>
                    ) : (
                      feature
                    )}
                  </div>
                ))}
              </div>
              <Link
                href="/create"
                className={`mt-[26px] block rounded-[12px] py-[14px] text-center text-[15.5px] font-bold no-underline transition hover:-translate-y-0.5 ${
                  plan.dark
                    ? "border border-[#3a352d] bg-[#2a2723] text-white"
                    : "bg-[#f2b01e] text-[#1a1916] shadow-[0_2px_0_#c98f11]"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-[22px] text-center font-mono text-[13px] text-[#9a9486]">
          We don&apos;t overstate what isn&apos;t built yet. Free export is live today; full-batch
          export is the next thing we&apos;re shipping.
        </p>
      </div>
    </section>
  );
}

function PrivacyBand() {
  return (
    <section style={{ padding: "40px 0 36px" }}>
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="flex flex-wrap items-center gap-[34px] rounded-[24px] border border-[#e0dccf] bg-[#f0efe9] p-[38px_44px]">
          <span className="inline-flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[16px] bg-[#1a1916]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2L4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z"
                fill="#F2B01E"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#1A1916"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="min-w-[280px] flex-1">
            <h2 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#1a1916]">
              Your files are used only for your batch.
            </h2>
            <p className="mt-2 max-w-[680px] text-[16px] leading-[1.55] text-[#57534a]">
              Your CSV is used only to generate the current batch. We do not store
              uploaded spreadsheets or generated PDF files — once your ZIP is ready, the
              source data isn&apos;t kept.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeFooter() {
  return (
    <footer className="border-t border-[#e7e2d6] pt-[36px] pb-[56px]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-[18px] px-8">
        <div className="flex items-center gap-[11px]">
          <BrandMark size="sm" />
          <span className="text-[15px] font-extrabold tracking-[-0.02em] text-[#1a1916]">
            Very Simple Batch PDF
          </span>
        </div>
        <div className="flex flex-wrap gap-x-[22px] gap-y-2 text-[14px] font-semibold text-[#6e6a61]">
          {footerNavLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-[#1a1916]">
              {link.label}
            </a>
          ))}
        </div>
        <p className="font-mono text-[12px] text-[#a39b8a]">One design. Many PDFs.</p>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#faf8f3] text-[#1a1916]">
      <div className="mx-auto max-w-[1440px] px-8">
        <nav className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-[#e7e2d6]/70 bg-[#faf8f3]/78 py-[18px] backdrop-blur-[10px]">
          <a
            href="#top"
            className="flex items-center gap-[11px] text-[#1a1916] no-underline"
          >
            <BrandMark />
            <span className="text-[17px] font-extrabold tracking-[-0.02em]">
              Very Simple <span className="text-[#1a1916]">Batch PDF</span>
            </span>
          </a>
          <div className="hidden items-center gap-[6px] text-[14.5px] font-semibold text-[#4a463e] lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-[8px] px-3 py-2 text-[#4a463e] no-underline hover:bg-[#f0eadc]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/create"
              className="ml-2 rounded-[10px] bg-[#1a1916] px-[18px] py-[10px] font-bold text-white no-underline hover:bg-[#3a372f]"
            >
              Create PDFs
            </Link>
          </div>
        </nav>

        <header
          id="top"
          className="grid items-center gap-12 pb-[56px] pt-[40px] lg:grid-cols-[1.02fr_1.18fr]"
        >
          <div>
            <div className="inline-flex items-center gap-[9px] rounded-full border border-[#e7e2d6] bg-white px-[14px] py-[7px] text-[13px] font-semibold text-[#4a463e] shadow-[0_1px_0_rgba(26,25,22,0.03)]">
              <span className="rounded-[6px] bg-[#fbefcb] px-[7px] py-[3px] font-mono text-[11px] font-bold text-[#8a6a12]">
                .csv → .pdf
              </span>
              Batch-personalization utility
            </div>
            <h1 className="mt-[22px] max-w-3xl text-[60px] font-extrabold leading-[1.02] tracking-[-0.035em]">
              Turn one design into{" "}
              <span className="relative whitespace-nowrap">
                hundreds
                <span
                  className="absolute inset-x-0 -z-10 h-[13px] rounded-[3px] bg-[#f7ce5e]"
                  style={{ bottom: 6 }}
                  aria-hidden="true"
                />
              </span>{" "}
              of personalized PDFs
            </h1>
            <p className="mt-[22px] max-w-[520px] text-[18.5px] leading-[1.55] text-[#57534a]">
              Bring a design with blank spaces, upload a CSV, and map your columns to the
              blanks. Preview the results, then export a ZIP of finished PDFs. No design
              tools to learn.
            </p>
            <div className="mt-[30px] flex flex-wrap gap-3">
              <PrimaryButton>Create PDFs</PrimaryButton>
              <a
                href="#how"
                className="inline-flex min-h-12 items-center justify-center gap-[9px] rounded-xl border border-[#dad3c4] bg-white px-[24px] py-[15px] text-[16px] font-bold text-[#1a1916] no-underline transition hover:-translate-y-0.5"
              >
                How it works
              </a>
            </div>
            <div className="mt-[26px] flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[13.5px] font-semibold text-[#7a756a]">
              {heroChecks.map((item, i) => (
                <React.Fragment key={item}>
                  <span className="flex items-center gap-[7px]">
                    <span className="text-[#1a1916]">✓</span>
                    {item}
                  </span>
                  {i < heroChecks.length - 1 && (
                    <span
                      className="inline-block h-1 w-1 rounded-full bg-[#cfc8b8]"
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <HeroCsvCard />
        </header>
      </div>

      <ManualLoopCard />

      <section id="how" style={{ padding: "56px 0 36px" }}>
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="mx-auto mb-11 max-w-[640px] text-center">
            <SectionKicker>How it works</SectionKicker>
            <h2 className="mt-[14px] text-[44px] font-extrabold leading-[1.06] tracking-[-0.03em]">
              Four steps. One ZIP of finished PDFs.
            </h2>
            <p className="mt-3 text-[17.5px] leading-[1.55] text-[#57534a]">
              From a design and a spreadsheet to a folder of personalized files — without
              touching a design editor.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {homepageSteps.map((step, index) => (
              <StepCard key={step.title} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section id="uses" style={{ padding: "56px 0 36px" }}>
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[560px]">
              <SectionKicker>What people make</SectionKicker>
              <h2 className="mt-[14px] text-[44px] font-extrabold leading-[1.06] tracking-[-0.03em]">
                One design. Many personalized PDFs.
              </h2>
            </div>
            <p className="max-w-[340px] text-[16px] leading-[1.55] text-[#6e6a61]">
              If it&apos;s the same layout with different names, dates, or numbers — this fills
              the blanks for every row.
            </p>
          </div>
          <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {homepageUseCases.map((useCase) => (
              <article
                key={useCase.title}
                className="rounded-[16px] border border-[#e7e2d6] bg-white p-[18px] shadow-[0_1px_0_rgba(26,25,22,0.02)]"
              >
                <UseCaseVisual kind={useCase.kind} />
                <h3 className="text-[15.5px] font-bold">{useCase.title}</h3>
                <p className="mt-[3px] text-[13px] text-[#8a857a]">{useCase.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MappingPanel />
      <PreviewPanel />
      <PricingSection />
      <PrivacyBand />

      <section id="faq" style={{ padding: "56px 0 36px" }}>
        <div className="mx-auto max-w-[1440px] grid gap-12 px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <SectionKicker>Questions</SectionKicker>
            <h2 className="mt-[14px] text-[40px] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Good to know.
            </h2>
            <p className="mt-3 max-w-[300px] text-[16px] leading-[1.55] text-[#6e6a61]">
              Plain answers about CSVs, designs, limits, and what we do with your files.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {homepageFaqs.map((faq, index) => (
              <details
                key={faq.question}
                className="overflow-hidden rounded-[14px] border border-[#e7e2d6] bg-white"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-[18px] text-[16.5px] font-bold tracking-[-0.01em] text-[#1a1916]">
                  {faq.question}
                  <span className="inline-flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] bg-[#f7f4ec] text-[18px] font-bold text-[#1a1916]">
                    <ArrowRight className="h-4 w-4 transition [[open]_&]:rotate-90" aria-hidden="true" />
                  </span>
                </summary>
                <p className="max-w-[600px] px-5 pb-5 text-[15px] leading-[1.6] text-[#57534a]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" style={{ padding: "40px 0 64px" }}>
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="relative overflow-hidden rounded-[30px] bg-[#1a1916] px-12 py-[64px] text-center text-[#fcfbf7]">
            <div
              className="pointer-events-none absolute left-1/2 top-[-60px] h-[240px] w-[420px] -translate-x-1/2"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(242,176,30,0.20), transparent 70%)",
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#2a2723] px-[14px] py-[7px] font-mono text-[12px] font-semibold text-[#f2b01e]">
                design + spreadsheet → ZIP of PDFs
              </div>
              <h2 className="mx-auto mt-[22px] max-w-[680px] text-[52px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#fcfbf7]">
                Have a design and a spreadsheet? Generate the PDFs.
              </h2>
              <p className="mx-auto mt-4 max-w-[480px] text-[18px] leading-[1.55] text-[#b7b1a4]">
                Fill the blanks from your spreadsheet, preview the results, and download
                everything as a ZIP.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-[13px]">
                <PrimaryButton>Create PDFs</PrimaryButton>
                <a
                  href="#how"
                  className="inline-flex min-h-12 items-center justify-center gap-[9px] rounded-[13px] border border-[#3a352d] bg-[#2a2723] px-[26px] py-[16px] text-[17px] font-bold text-white no-underline transition hover:-translate-y-0.5"
                >
                  Try sample CSV
                </a>
              </div>
              <p className="mt-6 font-mono text-[13.5px] text-[#7a756a]">
                {BATCH_PDF_LIMITS.freeExportRows} PDFs free · no account to start · files
                not stored
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}
