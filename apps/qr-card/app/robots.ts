import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_CONNECT_URL || "https://connect.arukamed.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/c/"],
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "Googlebot",
          "ClaudeBot",
          "anthropic-ai",
          "Claude-Web",
          "PerplexityBot",
          "Applebot",
          "Applebot-Extended",
          "Bytespider",
          "cohere-ai",
          "Meta-ExternalAgent",
          "CCBot",
          "Bingbot",
          "DuckDuckBot",
        ],
        allow: ["/", "/c/"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
