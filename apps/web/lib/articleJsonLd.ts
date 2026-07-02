/**
 * JSON-LD TechArticle structured data for blog posts — machine-readable
 * authorship/topic signals for search engines and AI crawlers.
 */
export function articleJsonLd(args: {
  slug: string;
  headline: string;
  description: string;
  datePublished: string; // ISO date
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: args.headline,
    description: args.description,
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    url: `https://smeltr.org/blog/${args.slug}`,
    author: {
      "@type": "Organization",
      name: "Smeltr",
      url: "https://smeltr.org",
    },
    publisher: {
      "@type": "Organization",
      name: "Smeltr Technologies LLC",
      url: "https://smeltr.org",
    },
    about: [
      { "@type": "Thing", name: "Solana Token-2022" },
      { "@type": "Thing", name: "SPL Token Extensions" },
    ],
    isAccessibleForFree: true,
  };
}
