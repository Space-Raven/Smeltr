/**
 * Shared SEO constants and helpers for content pages.
 */
export const SITE_URL = "https://smeltr.org";

export const OG_IMAGE = {
  /** PNG exported from brand/source/og.svg via `npm run brand:export`. */
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Smeltr — Non-Custodial Token-2022 Launcher",
} as const;

/** Metadata for a blog post with canonical URL and OG image. */
export function blogPostMetadata(args: {
  slug: string;
  title: string;
  description: string;
  ogDescription?: string;
}): import("next").Metadata {
  const url = `${SITE_URL}/blog/${args.slug}`;
  const ogDesc = args.ogDescription ?? args.description;
  return {
    title: args.title,
    description: args.description,
    alternates: { canonical: url },
    openGraph: {
      url,
      title: args.title,
      description: ogDesc,
      type: "article",
      images: [{ ...OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: args.title,
      description: ogDesc,
      images: [OG_IMAGE.url],
    },
  };
}
