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
    ],
  },
};

export default nextConfig;
