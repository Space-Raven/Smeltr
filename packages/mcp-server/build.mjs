import * as esbuild from "esbuild";
import { chmodSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outFile = join(__dirname, "dist", "server.js");

await esbuild.build({
  entryPoints: [join(__dirname, "src", "server.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: outFile,
  // MCP SDK stays external — installed as a peer dependency at runtime.
  external: ["@modelcontextprotocol/sdk", "@modelcontextprotocol/sdk/*"],
  banner: {
    js: "#!/usr/bin/env node",
  },
  logLevel: "info",
});

// Ensure bin is executable on Unix.
try {
  chmodSync(outFile, 0o755);
} catch {
  // Windows — ignore.
}

writeFileSync(
  join(__dirname, "dist", "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2)
);

console.log("[smeltr-mcp] built", outFile);
