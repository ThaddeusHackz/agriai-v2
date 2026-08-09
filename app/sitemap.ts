import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://agriai.onrender.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/#assistant`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/#disease-detection`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/#market-prices`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/#weather`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];
}
