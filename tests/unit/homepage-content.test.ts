import { describe, expect, it } from "vitest";
import {
  homepageFaqs,
  homepagePricingPlans,
  homepageSteps,
  metadata,
} from "../../app/page";

describe("homepage content", () => {
  it("describes own-design upload as the intended direction, not export-ready", () => {
    const ownDesignFaq = homepageFaqs.find(
      (faq) => faq.question === "Can I use my own design?",
    );
    const pngFaq = homepageFaqs.find(
      (faq) => faq.question === "Can I use a PNG or JPEG design?",
    );
    const overflowFaq = homepageFaqs.find(
      (faq) => faq.question === "What happens if text is too long?",
    );

    expect(ownDesignFaq?.answer).toContain("blank spaces");
    expect(ownDesignFaq?.answer).toContain("map your CSV columns");
    expect(pngFaq?.answer).toContain("PNG and JPG backgrounds work today");
    expect(overflowFaq?.answer).toContain("flag any value that may not fit");
  });

  it("offers a single available-now plan with no payment tier", () => {
    expect(homepagePricingPlans).toHaveLength(1);
    const plan = homepagePricingPlans[0];

    expect(plan?.badge).toBe("available now");
    expect(plan?.features).toContain("Download polished PDFs as a ZIP");
  });

  it("does not mention payment or a paid tier anywhere in homepage content", () => {
    const haystack = JSON.stringify({
      homepageFaqs,
      homepagePricingPlans,
      homepageSteps,
    }).toLowerCase();

    for (const term of ["paid", "payment", "stripe", "full-batch", "full batch"]) {
      expect(haystack).not.toContain(term);
    }
  });

  it("metadata and workflow copy reflect the spreadsheet-to-template value proposition", () => {
    const description =
      typeof metadata.description === "string" ? metadata.description : "";
    const lastStep = homepageSteps[homepageSteps.length - 1];

    expect(description).toContain("teachers");
    expect(description).toContain("Excel or Google Sheet");
    expect(description).toContain("professional certificates");
    expect(lastStep?.title).toBe("Preview and export");
    expect(lastStep?.eyebrow).toBe("batch.zip");
  });

  it("steps follow the spreadsheet-first order: export sheet → template → match → export", () => {
    const titles = homepageSteps.map((s) => s.title);
    expect(titles).toEqual([
      "Export your spreadsheet",
      "Choose a template",
      "Match columns to spaces",
      "Preview and export",
    ]);
  });

  it("has eight FAQs matching the design", () => {
    expect(homepageFaqs).toHaveLength(8);
    const questions = homepageFaqs.map((f) => f.question);
    expect(questions).toContain("What is a CSV?");
    expect(questions).toContain("Can I use my own design?");
    expect(questions).toContain("Can I use a PNG or JPEG design?");
    expect(questions).toContain("What happens if text is too long?");
    expect(questions).toContain("How many PDFs can I generate?");
    expect(questions).toContain("Do you store my files?");
    expect(questions).toContain("Can I generate certificates, name badges, and labels?");
    expect(questions).toContain("Is this a Canva replacement?");
  });
});
