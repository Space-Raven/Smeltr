/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@platform/module-registry",
    "@platform/tx-builder",
    "@platform/core-schemas",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "gateway.irys.xyz" },
    ],
  },
};

module.exports = nextConfig;
