import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://airbcar.com";
  const lastModified = new Date();

  // Location pages
  const locations = [
    "casablanca",
    "marrakech",
    "fez",
    "agadir"
  ];

  // Blog post slugs
  const blogPosts = [
    "complete-guide-renting-car-morocco",
    "best-time-visit-morocco",
    "driving-morocco-tips-safety"
  ];

  // Main pages
  const mainPages = [
    {
      url: `${baseUrl}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/cars`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/partner`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/bookings`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ceo`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
  ];

  // Location pages (important for local SEO)
  const locationPages = locations.map(location => ({
    url: `${baseUrl}/rental/${location}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Blog post pages
  const blogPages = blogPosts.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Localized versions (if applicable)
  const languages = ["en", "ar", "fr"];
  const localizedPages = languages.flatMap((lang) =>
    [...mainPages, ...locationPages, ...blogPages].map((page) => ({
      url: page.url.replace(`${baseUrl}`, `${baseUrl}/${lang}`),
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }))
  );

  return [...mainPages, ...locationPages, ...blogPages, ...localizedPages];
}
