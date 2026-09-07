import type { MetadataRoute } from "next";

const siteUrl = "https://novatech-repair-suite-piiy.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/customers/",
        "/devices/",
        "/repairs/",
        "/inventory/",
        "/engineers/",
        "/sales/",
        "/suppliers/",
        "/invoices/",
        "/reports/",
        "/alerts/",
        "/assistant/",
        "/settings/",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
