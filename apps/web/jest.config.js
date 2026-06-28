const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "node", // route handlers run server-side
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  // @irys/web-upload-solana pulls in rpc-websockets → ESM uuid (same as tx-builder).
  transformIgnorePatterns: [
    "/node_modules/(?!(rpc-websockets|uuid)/)",
  ],
};

module.exports = createJestConfig(customJestConfig);
