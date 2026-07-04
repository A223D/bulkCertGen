import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getUseCasePath, useCasePages } from "@/lib/use-case-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/use-cases"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...useCasePages.map((page) => ({
      url: absoluteUrl(getUseCasePath(page.slug)),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: absoluteUrl("/legal/privacy"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: absoluteUrl("/legal/terms"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
