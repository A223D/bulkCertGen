import { describe, expect, it } from "vitest";
import sitemap, { dynamic, revalidate } from "../../app/sitemap";
import { homepageUseCases } from "../../app/page";
import { getUseCasePath, useCasePages } from "../../lib/use-case-pages";

describe("use-case landing pages", () => {
  it("keeps every landing page distinct", () => {
    expect(useCasePages).toHaveLength(13);

    const slugs = new Set(useCasePages.map((page) => page.slug));
    const titles = new Set(useCasePages.map((page) => page.metadataTitle));
    const descriptions = new Set(useCasePages.map((page) => page.metadataDescription));
    const heroTitles = new Set(useCasePages.map((page) => page.heroTitle));

    expect(slugs.size).toBe(useCasePages.length);
    expect(titles.size).toBe(useCasePages.length);
    expect(descriptions.size).toBe(useCasePages.length);
    expect(heroTitles.size).toBe(useCasePages.length);
  });

  it("links every homepage use-case card to a real landing page", () => {
    // The homepage grid is a curated subset; `/use-cases` is what lists all of
    // them, so crawlers still reach every page without an index-only path.
    const paths = new Set(useCasePages.map((page) => getUseCasePath(page.slug)));

    for (const useCase of homepageUseCases) {
      expect(paths).toContain(useCase.href);
    }
  });

  it("has enough use-case-specific content for each landing page", () => {
    for (const page of useCasePages) {
      expect(page.heroTitle.length).toBeGreaterThan(20);
      expect(page.heroBody.length).toBeGreaterThan(160);
      expect(page.audience).toHaveLength(3);
      expect(page.painPoints).toHaveLength(3);
      expect(page.csvColumns.length).toBeGreaterThanOrEqual(5);
      expect(page.workflow).toHaveLength(4);
      expect(page.outputs).toHaveLength(3);
      expect(page.faqs).toHaveLength(3);
    }
  });

  it("does not repeat FAQ questions across pages targeting neighbouring searches", () => {
    // Several pages answer overlapping intents ("id card generator" against
    // "ID cards from CSV"). Reused questions would make them thin duplicates of
    // each other and would put identical FAQPage JSON-LD on two URLs.
    for (const page of useCasePages) {
      const others = useCasePages.filter((item) => item.slug !== page.slug);

      for (const faq of page.faqs) {
        const duplicated = others.filter((item) =>
          item.faqs.some((other) => other.question === faq.question),
        );

        expect(duplicated.map((item) => item.slug)).toEqual([]);
      }
    }
  });

  it("resolves every explicit related slug to another existing page", () => {
    const slugs = new Set(useCasePages.map((page) => page.slug));

    for (const page of useCasePages) {
      if (!page.relatedSlugs) continue;

      for (const related of page.relatedSlugs) {
        expect(slugs).toContain(related);
        expect(related).not.toBe(page.slug);
      }
    }
  });

  it("pairs each head-term page with the CSV-workflow page covering the same job", () => {
    // These two-way links are the mitigation for the keyword overlap: they tell
    // a reader (and a crawler) the pages are companions, not rivals.
    const pairs = [
      ["bulk-certificate-generator", "certificate-generator-from-csv"],
      ["event-badge-generator", "event-badges-from-spreadsheet"],
      ["id-card-generator", "id-cards-from-csv"],
    ] as const;

    for (const [head, workflow] of pairs) {
      const headPage = useCasePages.find((page) => page.slug === head);
      const workflowPage = useCasePages.find((page) => page.slug === workflow);

      expect(headPage?.relatedSlugs).toContain(workflow);
      expect(workflowPage?.relatedSlugs).toContain(head);
    }
  });

  it("gives spreadsheet-source pages explicit Excel and Google Sheets steps", () => {
    const spreadsheetPages = [
      "bulk-certificate-generator",
      "excel-to-certificate",
      "google-sheets-to-certificate",
      "id-card-generator",
      "event-badge-generator",
    ];

    for (const slug of spreadsheetPages) {
      const page = useCasePages.find((item) => item.slug === slug);

      expect(page?.spreadsheetSteps?.excel.length).toBeGreaterThanOrEqual(2);
      expect(page?.spreadsheetSteps?.googleSheets.length).toBeGreaterThanOrEqual(2);

      // The upload only accepts CSV, so the one thing these pages must not do is
      // imply a workbook or a live Sheet can be uploaded directly.
      const copy = JSON.stringify(page);
      expect(copy).toMatch(/Excel/);
      expect(copy).toMatch(/Google Sheets/);
      expect(copy).toMatch(/csv/i);
    }
  });

  it("keeps the ID card page away from official identity documents", () => {
    const page = useCasePages.find((item) => item.slug === "id-card-generator");
    const copy = JSON.stringify(page).toLowerCase();

    expect(copy).toContain("not for government-issued or official identity documents");

    for (const term of ["passport", "driver's licence", "driver's license", "national id"]) {
      expect(copy).not.toContain(term);
    }
  });

  it("includes every indexable page in the sitemap", () => {
    const urls = sitemap().map((entry) => new URL(entry.url).pathname);
    const expectedUseCasePaths = useCasePages.map((page) => getUseCasePath(page.slug));

    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);
    expect(urls).toContain("/");
    expect(urls).toContain("/use-cases");
    expect(urls).toContain("/legal/privacy");
    expect(urls).toContain("/legal/terms");
    expect(urls).not.toContain("/create");

    for (const path of expectedUseCasePaths) {
      expect(urls).toContain(path);
    }

    expect(urls).toHaveLength(4 + expectedUseCasePaths.length);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
