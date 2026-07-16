const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "node", // route handlers run server-side
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  // @irys/web-upload-solana and @solana/web3.js pull in rpc-websockets → ESM
  // uuid (same as tx-builder) — those must be transformed, not ignored.
  transformIgnorePatterns: [
    "/node_modules/(?!(rpc-websockets|uuid)/)",
  ],
};

// next/jest generates its own node_modules ignore patterns (OS-specific path
// separators, exempting only transpilePackages) which match rpc-websockets/
// uuid before our pattern gets a say — a file is ignored if ANY pattern
// matches. Replace the node_modules patterns with one separator-agnostic
// pattern that exempts the workspace packages AND the ESM deps.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  config.transformIgnorePatterns = [
    "[\\\\/]node_modules[\\\\/](?!(rpc-websockets|uuid|@platform)[\\\\/])",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return config;
};
