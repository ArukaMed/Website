import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_CONNECT_URL || "https://connect.arukamed.com";
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/c/amit-sharma`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
