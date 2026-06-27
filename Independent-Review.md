# Independent Review

**Project:** Smeltr (Token-Platform-Merged)  
**Date:** June 26, 2026  
**Scope:** Read-only codebase audit + Irys devnet smoke-test investigation  
**No code changes were made during this review.**

---

## Executive summary

The **on-chain core** (`module-registry` + `tx-builder`) is well-aligned with architecture docs: correct two-transaction metadata flow, load-bearing instruction order, module compatibility engine, and non-custodial authority guards (structurally present).

The **web client** is not production-ready: wallet/RPC providers are not wired, deployment indexing silently requires SIWS, and Irys metadata upload was blocked by **local network routing to Irys** (fixed with VPN). The `useIrysUpload` hook also defaults to **mainnet Irys + mainnet Solana RPC** despite devnet configuration in `.env`.

---

## Codebase audit (read-only)

### Strong

| Layer | Status |
|-------|--------|
| `packages/module-registry` | Three modules, Zod schemas, `validateModuleSelection()`, metadata provider interface |
| `packages/tx-builder` | Correct tx1 order (CreateAccount → module inits → MetadataPointer → InitializeMint); tx2 metadata-only |
| API + Prisma + SIWS | Session wallet for deployments; PATCH 404 on ownership mismatch; high-impact module gating |

### Critical gaps

1. **No `WalletProvider` / `ConnectionProvider`** — `useWallet()` used everywhere but providers missing; `#wallet-button-slot` empty in layout.
2. **`NEXT_PUBLIC_SOLANA_RPC_URL` unused** — set in `.env`, never read by app code.
3. **`PLATFORM_AUTHORITY_DENYLIST` empty** — `assertNoPlatformAuthority()` is a no-op until populated from env.
4. **Deployment indexing vs optional SIWS** — POST `/api/deployments` requires session; hook swallows 401; dashboard resumability fails without sign-in.
5. **Irys hook misconfigured for devnet** — see below.

### Secondary

- `@platform/core-schemas` exists but is unused (duplicate of `module-registry` schemas).
- Modules marked `verified: true` with TODO audit links.
- Missing `/api/auth/signout`; `vercel.json` references nonexistent `/api/sitemap`.
- Tests: stub Irys tests; no module-registry tests; `test:registry` runs tx-builder only.
- Branding: **Smeltr** (UI) vs `@platform/*` (packages) vs `token-deployment-platform` (root).

### Architecture invariants

| Invariant | Honored? |
|-----------|----------|
| Two-transaction metadata | Yes (tx-builder) |
| Instruction order in tx1 | Yes |
| Authority denylist active | No (empty set) |
| Wallet from session for API | Yes |
| Irys before `prepare()` | Designed; upload unverified until network fixed |

---

## Irys smoke test investigation

### Current hook behavior

```typescript
await WebUploader(WebSolana).withProvider(wallet);
```

Defaults:

- Irys bundler: **mainnet** (`https://uploader.irys.xyz`)
- Solana RPC: **mainnet-beta** (hardcoded in `@irys/web-upload-solana`)
- Result URI: `https://gateway.irys.xyz/{id}` (wrong for devnet)

**Required for devnet:**

```typescript
await WebUploader(WebSolana)
  .withProvider(wallet)
  .withRpc(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!)
  .devnet();
// URI: https://devnet.irys.xyz/{receipt.id}
```

SDK method names (`getPrice`, `getBalance`, `fund`, `uploadData`) match installed `@irys/web-upload` / `@irys/upload-core` — naming is not the issue; **configuration and connectivity** are.

### Upload flow (where hangs occur)

1. `GET /chunks/solana/-1/-1` — first Irys HTTP call
2. Wallet `signMessage` (required by `HexInjectedSolanaSigner`)
3. `POST` chunk + finalize (`POST .../-1`)

Files under ~95KB skip client-side price/balance checks but still hit steps 1–3.

### Network diagnosis (confirmed on user machine)

**Without VPN:**

| Host | IP | TCP 443 |
|------|-----|---------|
| `devnet.irys.xyz` | `167.206.37.145` | **Failed** (ping + connect timeout) |
| `arweave.net` | `89.187.187.10` | OK |

**With NordVPN (NordLynx):**

| Host | IP | TCP 443 |
|------|-----|---------|
| `devnet.irys.xyz` | `104.20.31.170` (Cloudflare) | **OK** |

**Root cause:** ISP/local network path to Irys origin IP (`167.206.37.145`) was blocked or unroutable. VPN shifted DNS/routing to Cloudflare edge. Not a Smeltr application bug.

**Alternatives to always-on VPN:** try public DNS (`1.1.1.1`, `8.8.8.8`) — if resolution returns Cloudflare and TCP succeeds, VPN may not be needed for daily dev.

**Production implication:** users on ISPs that resolve/route to origin IP may fail metadata upload unless Irys CDN path is used.

---

## Recommended priority (post-review)

1. Wire wallet + RPC providers; use `NEXT_PUBLIC_SOLANA_RPC_URL`.
2. Fix `useIrysUpload`: `.devnet()` + `.withRpc()` when on devnet; correct gateway URL per network.
3. Populate `PLATFORM_AUTHORITY_DENYLIST` from env.
4. Resolve deployment indexing UX (SIWS before POST or document requirement).
5. Smoke-test Irys upload **with VPN or fixed DNS** on devnet.
6. Run `metadata.devnet.test.ts` against local validator.

---

## What works without Irys

Token deploy **without metadata** (skip upload step) can be tested independently of Irys connectivity. Full metadata + two-transaction flow requires reachable `devnet.irys.xyz`.

---

## Session artifacts referenced

- `CLAUDE.md`, `SESSION-CONTEXT.md` — architecture and known gaps
- `apps/web/hooks/useIrysUpload.ts` — Irys integration
- `apps/web/.env` — `NEXT_PUBLIC_SOLANA_RPC_URL` (unused by hook)
