import type { MetadataRoute } from "next";

const siteUrl = "https://novatech-repair-suite-piiy.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
