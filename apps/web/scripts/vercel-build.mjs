/**
 * Vercel build entrypoint (Node — no bash/CRLF issues on Windows dev machines).
 * Resolves DATABASE_URL from Vercel Storage Postgres when DATABASE_URL is empty.
 */
import { execSync } from "child_process";
import { existsSync, renameSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(__dirname, "..");
const REPO_ROOT = resolve(WEB, "../..");

function normalizeUrl(raw) {
  if (!raw) return undefined;
  const v = raw.trim().replace(/^"|"$/g, "");
  if (!v) return undefined;
  if (!/^postgres(ql)?:\/\//i.test(v)) return undefined;
  return v;
}

function resolveDatabaseUrl() {
  const direct = normalizeUrl(process.env.DATABASE_URL);
  if (direct) return { url: direct, source: "DATABASE_URL" };
  for (const key of [
    "POSTGRES_URL_NON_POOLING",
    "PRISMA_DATABASE_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
  ]) {
    const v = normalizeUrl(process.env[key]);
    if (v) return { url: v, source: key };
  }
  return undefined;
}

function run(cmd, cwd, label) {
  console.log(`\n>> ${label}`);
  console.log(`   cwd: ${cwd}`);
  console.log(`   cmd: ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

const resolved = resolveDatabaseUrl();
if (!resolved) {
  console.error(
    "\nBUILD FAILED: No database URL.\n" +
      "Set DATABASE_URL in Vercel, or connect Storage Postgres to this project.\n" +
      "Checked: DATABASE_URL, POSTGRES_URL_NON_POOLING, PRISMA_DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL\n" +
      "Tip: delete empty DATABASE_URL in Vercel if Storage Postgres is connected."
  );
  process.exit(1);
}

if (process.env.VERCEL_ENV === "production" && !process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim()) {
  console.error(
    "\nBUILD FAILED: NEXT_PUBLIC_SOLANA_RPC_URL is required for production.\n" +
      "Set a dedicated mainnet RPC (Helius/QuickNode) in Vercel Production env and redeploy.\n" +
      "See docs/BETA_LAUNCH_CHECKLIST.md"
  );
  process.exit(1);
}

const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ?? "";
if (
  process.env.VERCEL_ENV === "production" &&
  rpc &&
  /api\.mainnet-beta\.solana\.com|api\.devnet\.solana\.com/.test(rpc)
) {
  console.error(
    "\nBUILD FAILED: NEXT_PUBLIC_SOLANA_RPC_URL must not be the public Solana RPC in production.\n" +
      "It rate-limits getBalance/confirmTransaction under real traffic.\n" +
      "Use Helius or QuickNode — see docs/BETA_LAUNCH_CHECKLIST.md"
  );
  process.exit(1);
}

process.env.DATABASE_URL = resolved.url;
console.log(`Prisma migrate: DATABASE_URL from ${resolved.source}`);

const envFile = resolve(WEB, ".env");
const envBak = resolve(WEB, ".env.vercel-build-bak");
let envMoved = false;
if (existsSync(envFile)) {
  renameSync(envFile, envBak);
  envMoved = true;
  console.log("Prisma migrate: temporarily moved apps/web/.env aside");
}

try {
  try {
    run("npx prisma migrate deploy", WEB, "Prisma migrate deploy");
    run("npx prisma generate", WEB, "Prisma generate");
  } finally {
    if (envMoved && existsSync(envBak)) {
      renameSync(envBak, envFile);
    }
  }

  const workspacePkg = resolve(REPO_ROOT, "node_modules/@platform/module-registry");
  if (!existsSync(workspacePkg)) {
    console.error(
      "\nBUILD FAILED: @platform/module-registry not found.\n" +
        "Vercel Root Directory must be repo root (.) and installCommand: npm ci --legacy-peer-deps"
    );
    process.exit(1);
  }

  run("npm run build:apps", REPO_ROOT, "Next.js build (monorepo root)");
} catch (err) {
  console.error("\nBUILD FAILED:", err?.message ?? err);
  process.exit(1);
}
