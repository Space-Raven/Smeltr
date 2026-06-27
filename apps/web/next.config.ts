import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained server bundle under .next/standalone
  // Required for Docker deployments — copies only production deps
  output: "standalone",

  // Allow images from Arweave (metadata URIs) and arweave.net CDN
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "*.arweave.net" },
    ],
  },
};

export default nextConfig;
