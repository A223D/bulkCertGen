import { describe, expect, it } from "vitest";
import sitemap, { dynamic, revalidate } from "../../app/sitemap";
import { homepageUseCases } from "../../app/page";
import { getUseCasePath, useCasePages } from "../../lib/use-case-pages";

describe("use-case landing pages", () => {
  it("defines a distinct indexed page for every homepage use case", () => {
    expect(useCasePages).toHaveLength(8);

    const slugs = new Set(useCasePages.map((page) => page.slug));
    const titles = new Set(useCasePages.map((page) => page.metadataTitle));
    const descriptions = new Set(useCasePages.map((page) => page.metadataDescription));

    expect(slugs.size).toBe(useCasePages.length);
    expect(titles.size).toBe(useCasePages.length);
    expect(descriptions.size).toBe(useCasePages.length);
    expect(homepageUseCases.map((useCase) => useCase.href).sort()).toEqual(
      useCasePages.map((page) => getUseCasePath(page.slug)).sort(),
    );
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
