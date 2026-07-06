/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // Only pick up *.test.ts files — excludes fixtures/, helpers, etc.
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    // Match .ts/.tsx AND .js/.jsx so ts-jest can transpile ESM js in node_modules
    "^.+\\.[tj]sx?$": ["ts-jest", {
      tsconfig: {
        strict: false,
        allowJs: true,
      },
    }],
  },
  moduleNameMapper: {
    "^@platform/module-registry$":
      "<rootDir>/../module-registry/src/index.ts",
    "^@platform/core-schemas$":
      "<rootDir>/../core-schemas/src/index.ts",
  },
  // rpc-websockets ships an ESM uuid internally.
  // Use [/\\] to match both forward and back slashes on Windows.
  transformIgnorePatterns: [
    "[/\\\\]node_modules[/\\\\](?!(rpc-websockets|uuid)[/\\\\])",
  ],
  // devnet test needs more time for RPC calls
  testTimeout: 60000,
};
