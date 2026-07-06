import { PrismaClient } from "@prisma/client";

/** Vercel Storage Postgres injects PRISMA_DATABASE_URL / POSTGRES_URL; Prisma schema uses DATABASE_URL. */
function resolveDatabaseUrl(): string | undefined {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;
  return (
    process.env.PRISMA_DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim()
  );
}

const resolvedDbUrl = resolveDatabaseUrl();
if (resolvedDbUrl && !process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = resolvedDbUrl;
}

// Standard Next.js dev-mode singleton: prevents creating a new PrismaClient
// (and new DB connection pool) on every hot-reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
