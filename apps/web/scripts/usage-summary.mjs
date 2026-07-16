/**
 * Usage summary — aggregates funnel proxies from Postgres.
 *
 * Usage:
 *   node scripts/usage-summary.mjs                         # apps/web/.env (local dev)
 *   node scripts/usage-summary.mjs --env-file .env.production.local
 *
 * Production (Vercel env pull does NOT include Storage Postgres secrets — they are empty in the file):
 *   1. Vercel → Storage → Postgres → Connect → copy PRISMA_DATABASE_URL
 *   2. PowerShell:
 *        $env:DATABASE_URL = "postgresql://..."
 *        cd apps/web
 *        npm run usage:summary:prod
 *
 * Shell DATABASE_URL wins over empty values in the env file.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  let envFile = resolve(__dirname, "../.env");
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--env-file" && argv[i + 1]) {
      envFile = resolve(process.cwd(), argv[++i]);
    }
  }
  return { envFile };
}

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

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return false;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    // Skip empty — Vercel env pull leaves Storage secrets as DATABASE_URL=""
    if (!v) continue;
    // Shell env wins (lets you pass DATABASE_URL without saving to disk)
    if (process.env[k] !== undefined && process.env[k] !== "") continue;
    process.env[k] = v;
  }
  return true;
}

function redactDbUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname + (u.port ? `:${u.port}` : "");
    const db = u.pathname.replace(/^\//, "") || "(default)";
    return { host, database: db, looksProd: /neon|supabase|vercel|aws|render|pooler/i.test(host) };
  } catch {
    return { host: "(unparseable)", database: "?", looksProd: null };
  }
}

const { envFile } = parseArgs(process.argv);
loadEnvFile(envFile);

const resolved = resolveDatabaseUrl();
if (!resolved) {
  console.error(
    "No production database URL available.\n\n" +
      "vercel env pull cannot download Storage Postgres connection strings (they show as empty).\n\n" +
      "Do this instead:\n" +
      "  1. Vercel → smeltrweb → Storage → your Postgres → Connect\n" +
      "  2. Copy PRISMA_DATABASE_URL (or POSTGRES_URL_NON_POOLING)\n" +
      "  3. PowerShell:\n" +
      '       $env:DATABASE_URL = "postgresql://..."\n' +
      "       npm run usage:summary:prod\n\n" +
      "  Local dev only: npm run usage:summary"
  );
  process.exit(1);
}

process.env.DATABASE_URL = resolved.url;

const prisma = new PrismaClient();
const dbInfo = redactDbUrl(resolved.url);

function weekAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n * 7);
  return d;
}

async function main() {
  const now = new Date();
  const since7 = weekAgo(1);
  const since30 = weekAgo(4);

  const [
    deploymentsTotal,
    deployments7d,
    deployments30d,
    deploymentsWithMeta,
    authNonceTotal,
    authNonce7d,
    authNonceUsed7d,
    authNonceUsedTotal,
    uploadUsageRows,
    subsTotal,
  ] = await Promise.all([
    prisma.deployment.count(),
    prisma.deployment.count({ where: { createdAt: { gte: since7 } } }),
    prisma.deployment.count({ where: { createdAt: { gte: since30 } } }),
    prisma.deployment.count({ where: { hasMetadata: true } }),
    prisma.authNonce.count(),
    prisma.authNonce.count({ where: { createdAt: { gte: since7 } } }),
    prisma.authNonce.count({ where: { createdAt: { gte: since7 }, usedAt: { not: null } } }),
    prisma.authNonce.count({ where: { usedAt: { not: null } } }),
    prisma.uploadUsage.findMany({ orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.subscription.count(),
  ]);

  const nonceDaily = await prisma.$queryRaw`
    SELECT date_trunc('day', "createdAt")::date AS day,
           COUNT(*)::int AS nonces,
           COUNT("usedAt")::int AS verified
    FROM "AuthNonce"
    WHERE "createdAt" >= ${since30}
    GROUP BY 1
    ORDER BY 1 DESC
  `;

  const deployDaily = await prisma.$queryRaw`
    SELECT date_trunc('day', "createdAt")::date AS day,
           COUNT(*)::int AS indexed_mints
    FROM "Deployment"
    WHERE "createdAt" >= ${since30}
    GROUP BY 1
    ORDER BY 1 DESC
  `;

  const recentDeploys = await prisma.deployment.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      mintAddress: true,
      walletAddress: true,
      name: true,
      symbol: true,
      hasMetadata: true,
      metadataAttached: true,
      createdAt: true,
    },
  });

  const feeRecipient = process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT ?? "";

  console.log(
    JSON.stringify(
      {
        generatedAt: now.toISOString(),
        envFile: existsSync(envFile) ? envFile : null,
        database: { ...dbInfo, urlSource: resolved.source },
        feeRecipientConfigured: !!feeRecipient?.trim(),
        feeRecipientPrefix: feeRecipient ? feeRecipient.slice(0, 6) + "…" : null,
        deployments: {
          total: deploymentsTotal,
          last7d: deployments7d,
          last30d: deployments30d,
          withMetadataPlanned: deploymentsWithMeta,
          note: "Indexed mints require SIWS at POST time — undercounts anonymous deploys",
        },
        siws: {
          nonceRequestsTotal: authNonceTotal,
          nonceRequests7d: authNonce7d,
          verified7d: authNonceUsed7d,
          verifiedTotal: authNonceUsedTotal,
          verifyRate7d: authNonce7d ? authNonceUsed7d / authNonce7d : null,
          note: "Nonce = sign-in attempt; usedAt = completed SIWS",
        },
        premium: {
          subscriptions: subsTotal,
          uploadUsageRows: uploadUsageRows.length,
          uploadUsageSample: uploadUsageRows.map((r) => ({
            day: r.day,
            requests: r.requests,
            bytes: r.bytes.toString(),
          })),
        },
        daily: { nonceDaily, deployDaily },
        recentDeploys,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    const msg = String(e?.message ?? e);
    if (msg.includes("Can't reach database server")) {
      console.error(
        "\nLocal connection failed (P1001) — production DB is likely fine; your network cannot reach :5432.\n\n" +
          "Try:\n" +
          "  • Use PRISMA_DATABASE_URL (pooled) from Vercel Storage → Connect, not the non-pooling URL\n" +
          "  • Ensure the URL ends with ?sslmode=require\n" +
          "  • Test: Test-NetConnection <host> -Port 5432\n\n" +
          "If still blocked (ISP/corporate firewall), query prod without local TCP:\n" +
          "  • Vercel → Storage → Postgres → Data / Query tab\n" +
          "  • Or verify live: https://www.smeltr.org/dashboard (SIWS sign-in)\n" +
          "  • Fee-wallet mint count remains the ground-truth conversion metric\n"
      );
    }
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
