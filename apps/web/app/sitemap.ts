import type { MetadataRoute } from "next";

const SITE = "https://smeltr.org";

/** SITE_MODE-aware sitemap — content pages always listed; app routes only when live. */
export default function sitemap(): MetadataRoute.Sitemap {
  const mode = process.env.SITE_MODE ?? process.env.NEXT_PUBLIC_MODE ?? "live";
  const now = new Date();

  const entry = (
    path: string,
    priority: number,
    changefreq: MetadataRoute.Sitemap[0]["changeFrequency"] = "monthly"
  ): MetadataRoute.Sitemap[0] => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: changefreq,
    priority,
  });

  // Always crawlable — reference content, legal, AI/MCP docs (even in coming-soon mode).
  const content: MetadataRoute.Sitemap = [
    entry("/blog", 0.9, "weekly"),
    entry("/blog/token-2022-module-configuration-reference", 0.9),
    entry("/blog/how-to-deploy-solana-token-2022-transfer-fee", 0.8),
    entry("/blog/solana-soulbound-token-non-transferable-extension", 0.8),
    entry("/blog/permanent-delegate-token-2022-explained", 0.8),
    entry("/about", 0.8),
    entry("/trust", 0.8),
    entry("/docs/mcp", 0.9),
    entry("/modules/transfer-fee", 0.85),
    entry("/modules/non-transferable", 0.85),
    entry("/modules/permanent-delegate", 0.85),
    entry("/terms", 0.3, "yearly"),
    entry("/privacy", 0.3, "yearly"),
    entry("/refunds", 0.3, "yearly"),
  ];

  if (mode === "live") {
    return [
      entry("/", 1.0, "weekly"),
      entry("/create", 0.95, "weekly"),
      entry("/deploy", 0.95),
      // Curated explorer — the hub linking every public /t/<mint> token page.
      entry("/created", 0.9, "daily"),
      ...content,
    ];
  }

  // coming-soon: don't advertise gated routes that redirect to a placeholder.
  return content;
}
