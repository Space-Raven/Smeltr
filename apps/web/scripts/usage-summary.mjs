/**
 * Usage summary — aggregates funnel proxies from Postgres.
 *
 * Usage:
 *   node scripts/usage-summary.mjs                    # apps/web/.env (local dev)
 *   node scripts/usage-summary.mjs --env-file .env.production.local
 *   npm run usage:summary:prod                      # pulls prod env then runs
 *
 * Does not print secrets; shows a redacted DB host so you know which DB you hit.
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

function loadEnv(envPath) {
  if (!existsSync(envPath)) {
    console.error(`Env file not found: ${envPath}`);
    return false;
  }
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
    process.env[k] = v;
  }
  const url = resolveDatabaseUrl();
  if (url) process.env.DATABASE_URL = url;
  return !!url;
}

function resolveDatabaseUrl() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;
  for (const key of [
    "PRISMA_DATABASE_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
    "POSTGRES_URL_NON_POOLING",
  ]) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return undefined;
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

if (!loadEnv(envFile)) {
  console.error(
    "No database URL (DATABASE_URL empty; no PRISMA_DATABASE_URL / POSTGRES_URL from Vercel Storage).\n" +
      "  Local dev:  npm run usage:summary\n" +
      "  Production: npm run usage:summary:prod"
  );
  process.exit(1);
}

const prisma = new PrismaClient();
const dbInfo = redactDbUrl(process.env.DATABASE_URL);

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
        envFile,
        database: dbInfo,
        feeRecipientConfigured: !!feeRecipient,
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
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
