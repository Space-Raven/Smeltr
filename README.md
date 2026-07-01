# Smeltr
Non-custodial Token-2022 deployment infrastructure for Solana.

The non-custodial guarantee: Smeltr builds transaction instructions.
Your wallet signs them. assertNoPlatformAuthority() runs on every
authority field in every module before any instruction is constructed,
and the source for that check lives in `packages/module-registry` in
this repository — the guarantee is inspectable, not just asserted.

Extensions: Transfer Fee · Non-Transferable · Permanent Delegate · Arweave metadata

## Setup

```bash
npm install
cp .env.example apps/web/.env
# fill in DATABASE_URL, SESSION_JWT_SECRET, NEXT_PUBLIC_APP_DOMAIN, etc.

# Generate the Prisma client + run migrations (from apps/web)
cd apps/web
npx prisma generate
npx prisma migrate dev
cd ../..

npm run dev
```

## Testing

```bash
# Unit tests (no validator needed)
npm run test:registry

# Full CI suite (registry unit + web route/lib tests)
npm run test:ci

# Devnet integration test (requires `solana-test-validator` running locally)
cd packages/tx-builder && npm run test:devnet
```

## Status

The core deploy flow (module selection -> metadata -> review -> sign ->
add metadata -> dashboard/resume) is implemented end to end and covered
by the `npm run test:ci` suite. See `CLAUDE.md` for architecture context
and `docs/INVARIANTS.md` for the review checklist.
