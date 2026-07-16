import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(__dirname, "../../packages");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compile workspace packages (they ship raw TypeScript, not built JS)
  transpilePackages: [
    "@platform/core-schemas",
    "@platform/module-registry",
    "@platform/tx-builder",
  ],

  // Allow images from Arweave (metadata URIs)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "*.arweave.net" },
      { protocol: "https", hostname: "gateway.irys.xyz" },
      { protocol: "https", hostname: "devnet.irys.xyz" },
    ],
  },

  // @solana/wallet-adapter-react pulls optional mobile deps (react-native) that
  // must never enter the Next.js webpack graph — they also hoist React 19.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Monorepo fallback when Vercel/webpack does not hoist workspace symlinks
      "@platform/module-registry": path.join(packagesDir, "module-registry"),
      "@platform/tx-builder": path.join(packagesDir, "tx-builder"),
      "@platform/core-schemas": path.join(packagesDir, "core-schemas"),
      "react-native$": false,
    };
    return config;
  },
};

export default nextConfig;
