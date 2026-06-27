# Token Deployment Platform

A non-custodial SaaS platform for deploying Solana Token-2022 tokens via
pre-audited, composable modules (mint extensions).

**Start here:** [`CLAUDE.md`](./CLAUDE.md) — full architecture, key
decisions (including two corrections made during development that are easy
to accidentally reintroduce), security invariants, current status, and
prioritized next steps. If you're using Claude Code, it reads this file
automatically.

## Setup

```bash
pnpm install
cp .env.example apps/web/.env
# fill in DATABASE_URL, SESSION_JWT_SECRET, NEXT_PUBLIC_APP_DOMAIN, etc.

# Generate the Prisma client + run migrations
pnpm --filter @platform/web exec prisma generate
pnpm --filter @platform/web exec prisma migrate dev

pnpm dev
```

## Testing

```bash
# Unit tests (no validator needed)
pnpm test:registry

# Devnet integration test (requires `solana-test-validator` running locally)
pnpm --filter @platform/tx-builder exec jest --runInBand src/__tests__/metadata.devnet.test.ts

# Web app tests (route handlers, mocked Prisma/session)
pnpm test:web
```

## Status

The core deploy flow (module selection -> metadata -> review -> sign ->
add metadata -> dashboard/resume) is implemented end to end. See
`CLAUDE.md` -> "Immediate next steps" for what's prioritized next,
including items that need a real environment (Irys smoke test, devnet
test run) that couldn't be executed during initial scaffolding.
