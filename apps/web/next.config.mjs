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
      "react-native$": false,
    };
    return config;
  },
};

export default nextConfig;
