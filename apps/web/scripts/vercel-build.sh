#!/usr/bin/env bash
# Vercel build entrypoint. Resolves DATABASE_URL from Vercel Storage Postgres
# env vars when DATABASE_URL is unset/empty (common after Storage → Connect).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WEB="$REPO_ROOT/apps/web"

resolve_db_url() {
  local u="${DATABASE_URL:-}"
  u="${u//\"/}"
  if [ -n "$u" ]; then
    echo "$u"
    return
  fi
  # Prefer direct URL for migrations (PgBouncer transaction poolers break advisory locks).
  for key in POSTGRES_URL_NON_POOLING PRISMA_DATABASE_URL POSTGRES_PRISMA_URL POSTGRES_URL; do
    u="${!key:-}"
    u="${u//\"/}"
    if [ -n "$u" ]; then
      echo "$u"
      return
    fi
  done
  return 1
}

if ! export DATABASE_URL="$(resolve_db_url)"; then
  echo "Error: DATABASE_URL unset and no Vercel Postgres env found." >&2
  echo "Set DATABASE_URL in Vercel, or connect Storage Postgres to this project." >&2
  exit 1
fi

echo "Prisma migrate: using DATABASE_URL from Vercel Storage / env"
cd "$WEB"
npx prisma migrate deploy
npx prisma generate

# Build from monorepo root so npm workspaces resolve @platform/* packages.
cd "$REPO_ROOT"
if [ ! -e "node_modules/@platform/module-registry" ]; then
  echo "Error: workspace package @platform/module-registry not found after install." >&2
  echo "Ensure Vercel Root Directory is the repo root (.) and installCommand is: npm ci --legacy-peer-deps" >&2
  exit 1
fi

echo "Next build: monorepo root → build:apps"
npm run build:apps
