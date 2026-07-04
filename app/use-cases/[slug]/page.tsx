import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { absoluteUrl } from "@/lib/site";
import { getUseCasePage, getUseCasePath, useCasePages } from "@/lib/use-case-pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return useCasePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getUseCasePage(slug);

  if (!page) {
    return {};
  }

  const path = getUseCasePath(page.slug);

  return {
    title: page.metadataTitle,
    description: page.metadataDescription,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: "Batch, Please",
      title: `${page.metadataTitle} | Batch, Please`,
      description: page.metadataDescription,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "Batch, Please turns spreadsheet rows into polished personalized PDFs",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.metadataTitle} | Batch, Please`,
      description: page.metadataDescription,
      images: [
        {
          url: "/twitter-image.png",
          width: 1200,
          height: 630,
          alt: "Batch, Please turns spreadsheet rows into polished personalized PDFs",
        },
      ],
    },
  };
}

function PillList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-[9px] border border-[#e7e2d6] bg-white px-3 py-2 text-[13px] font-bold text-[#4a463e]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-3">
      {items.map((item, index) => (
        <li key={item} className="grid grid-cols-[42px_1fr] gap-3">
          <span className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#1a1916] font-mono text-[14px] font-bold text-[#f2b01e]">
            {index + 1}
          </span>
          <p className="pt-[8px] text-[15px] leading-6 text-[#57534a]">{item}</p>
        </li>
      ))}
    </ol>
  );
}

export default async function UseCaseLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getUseCasePage(slug);

  if (!page) {
    notFound();
  }

  const relatedPages = useCasePages.filter((item) => item.slug !== page.slug).slice(0, 3);
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${page.metadataTitle} | Batch, Please`,
      url: absoluteUrl(getUseCasePath(page.slug)),
      description: page.metadataDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "Batch, Please",
        url: absoluteUrl("/"),
      },
      about: page.title,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Use cases",
          item: absoluteUrl("/use-cases"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: page.title,
          item: absoluteUrl(getUseCasePath(page.slug)),
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <AppShell>
      <main className="bg-[#faf8f3] text-[#1a1916]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />

        <section className="mx-auto grid max-w-[1180px] gap-10 px-4 py-14 sm:px-8 sm:py-18 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Link
              href="/use-cases"
              className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#a8780c] no-underline"
            >
              Use cases
            </Link>
            <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#a8780c]">
              {page.kicker}
            </p>
            <h1 className="mt-4 max-w-3xl text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[58px]">
              {page.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-[18px] leading-8 text-[#57534a]">
              {page.heroBody}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/#vs-start"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f2b01e] px-6 py-3 text-[16px] font-bold text-[#1a1916] no-underline shadow-[0_2px_0_#c98f11]"
              >
                Create PDFs
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#workflow"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#dad3c4] bg-white px-6 py-3 text-[16px] font-bold text-[#1a1916] no-underline"
              >
                See workflow
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#e7e2d6] bg-white p-5 shadow-[0_24px_50px_-30px_rgba(26,25,22,0.3)]">
            <div className="relative aspect-[4/3] rounded-[16px] bg-[#fcfbf7]">
              <Image
                src={page.imageSrc}
                alt={page.imageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-contain p-6"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 pb-12 sm:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {page.audience.map((item) => (
              <div key={item} className="rounded-[16px] border border-[#e7e2d6] bg-white p-5">
                <Check className="h-5 w-5 text-[#2e8b57]" aria-hidden="true" />
                <p className="mt-3 text-[15px] font-bold">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-[#e7e2d6] bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-14 sm:px-8 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#a8780c]">
                What it solves
              </p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-tight tracking-[-0.02em]">
                Replace manual personalization with a repeatable CSV flow.
              </h2>
              <ul className="mt-6 grid gap-3">
                {page.painPoints.map((point) => (
                  <li key={point} className="flex gap-3 text-[15px] leading-6 text-[#57534a]">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2b01e]" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#a8780c]">
                Example CSV columns
              </p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-tight tracking-[-0.02em]">
                Bring the fields you already track.
              </h2>
              <div className="mt-6">
                <PillList items={page.csvColumns} />
              </div>
              <p className="mt-5 text-[15px] leading-6 text-[#57534a]">
                Each column can become a text field on your design. You decide where it
                appears, how it is styled, and how overflow is handled before export.
              </p>
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto grid max-w-[1180px] gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#a8780c]">
              Workflow
            </p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.02em]">
              From spreadsheet to finished PDFs.
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-[#57534a]">
              The same process works whether you start with a built-in design or upload
              your own PNG/JPG artwork.
            </p>
          </div>
          <NumberedList items={page.workflow} />
        </section>

        <section className="mx-auto max-w-[1180px] px-4 pb-14 sm:px-8">
          <div className="rounded-[24px] bg-[#1a1916] p-6 text-white sm:p-9">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#f2b01e]">
                  Export options
                </p>
                <h2 className="mt-3 text-[32px] font-extrabold leading-tight tracking-[-0.02em]">
                  Download the format that fits the job.
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {page.outputs.map((output) => (
                  <div key={output} className="rounded-[14px] border border-[#3a352d] bg-[#252019] p-4">
                    <p className="text-[14px] font-bold leading-6 text-[#fcfbf7]">{output}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1180px] gap-10 px-4 pb-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#a8780c]">
              Questions
            </p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.02em]">
              Answers for this use case.
            </h2>
          </div>
          <div className="grid gap-3">
            {page.faqs.map((faq) => (
              <article key={faq.question} className="rounded-[16px] border border-[#e7e2d6] bg-white p-5">
                <h3 className="text-[16px] font-extrabold">{faq.question}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[#6e6a61]">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-[#e7e2d6] bg-white">
          <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#a8780c]">
                  More use cases
                </p>
                <h2 className="mt-3 text-[28px] font-extrabold tracking-[-0.02em]">
                  Related CSV-to-PDF workflows
                </h2>
              </div>
              <Link href="/use-cases" className="text-[14px] font-bold text-[#1a1916] no-underline">
                View all use cases
              </Link>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {relatedPages.map((related) => (
                <Link
                  key={related.slug}
                  href={getUseCasePath(related.slug)}
                  className="rounded-[16px] border border-[#e7e2d6] bg-[#fcfbf7] p-5 text-[#1a1916] no-underline"
                >
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8780c]">
                    {related.kicker}
                  </p>
                  <h3 className="mt-3 text-[18px] font-extrabold">{related.title}</h3>
                  <p className="mt-2 text-[13px] leading-5 text-[#6e6a61]">
                    {related.metadataDescription}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
