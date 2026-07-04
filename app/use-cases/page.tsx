import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getUseCasePath, useCasePages } from "@/lib/use-case-pages";

export const metadata: Metadata = {
  title: "Use Cases",
  description:
    "Use Batch, Please to create certificates, event badges, ID cards, mailing labels, appointment cards, table cards, gift tags, and workshop passes from CSV data.",
  alternates: { canonical: "/use-cases" },
};

export default function UseCasesPage() {
  return (
    <AppShell>
      <main className="bg-[#faf8f3] text-[#1a1916]">
        <section className="mx-auto max-w-[1180px] px-4 py-14 sm:px-8 sm:py-18">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#a8780c]">
            Use cases
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[56px]">
                CSV-to-PDF workflows for repeated documents.
              </h1>
            </div>
            <p className="max-w-xl text-[17px] leading-7 text-[#57534a]">
              Batch, Please is for the practical jobs where one spreadsheet row becomes
              one finished PDF: certificates, badges, labels, cards, passes, and other
              repeatable documents.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {useCasePages.map((page) => (
              <Link
                key={page.slug}
                href={getUseCasePath(page.slug)}
                className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-[#e7e2d6] bg-white text-[#1a1916] no-underline shadow-[0_1px_0_rgba(26,25,22,0.02)]"
              >
                <div className="relative aspect-[4/3] bg-[#fcfbf7]">
                  <Image
                    src={page.imageSrc}
                    alt={page.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-contain p-5"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8780c]">
                    {page.kicker}
                  </p>
                  <h2 className="mt-3 text-[19px] font-extrabold leading-tight">
                    {page.title}
                  </h2>
                  <p className="mt-2 flex-1 text-[14px] leading-6 text-[#6e6a61]">
                    {page.metadataDescription}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-[#1a1916]">
                    View workflow
                    <ArrowRight
                      className="h-4 w-4 transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
