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
      (faq) => faq.question === "Can I use a PDF, PNG, or JPEG design?",
    );
    const overflowFaq = homepageFaqs.find(
      (faq) => faq.question === "What happens if text is too long?",
    );

    expect(ownDesignFaq?.answer).toContain("blank spaces");
    expect(ownDesignFaq?.answer).toContain("map your CSV columns");
    expect(pngFaq?.answer).toContain("PNG and JPG backgrounds work today");
    expect(overflowFaq?.answer).toContain("flag any value that may not fit");
  });

  it("keeps full-batch plan clearly marked as not yet available", () => {
    const freePlan = homepagePricingPlans.find((plan) => plan.name === "Free");
    const fullBatchPlan = homepagePricingPlans.find((plan) => plan.name === "Full batch");

    expect(freePlan?.badge).toBe("available now");
    expect(freePlan?.features).toContain("Download as ZIP");
    expect(freePlan?.features).not.toContain("Unlimited rows per batch");
    expect(fullBatchPlan?.badge).toBe("coming next");
    expect(fullBatchPlan?.features).toContain("Unlimited rows per batch");
    expect(fullBatchPlan?.features).toContain("Bulk overflow handling");
  });

  it("metadata and workflow copy reflect the design-first value proposition", () => {
    const description =
      typeof metadata.description === "string" ? metadata.description : "";
    const lastStep = homepageSteps[homepageSteps.length - 1];

    expect(description).toContain("blank spaces");
    expect(description).toContain("ZIP");
    expect(lastStep?.title).toBe("Download finished PDFs");
    expect(lastStep?.eyebrow).toBe("batch.zip");
  });

  it("steps follow the design-first order: bring design → CSV → map → download", () => {
    const titles = homepageSteps.map((s) => s.title);
    expect(titles).toEqual([
      "Bring your design",
      "Upload your CSV",
      "Map columns to blanks",
      "Download finished PDFs",
    ]);
  });

  it("has eight FAQs matching the design", () => {
    expect(homepageFaqs).toHaveLength(8);
    const questions = homepageFaqs.map((f) => f.question);
    expect(questions).toContain("What is a CSV?");
    expect(questions).toContain("Can I use my own design?");
    expect(questions).toContain("Can I use a PDF, PNG, or JPEG design?");
    expect(questions).toContain("What happens if text is too long?");
    expect(questions).toContain("How many PDFs can I generate for free?");
    expect(questions).toContain("Do you store my files?");
    expect(questions).toContain("Can I generate certificates, name badges, and labels?");
    expect(questions).toContain("Is this a Canva replacement?");
  });
});
