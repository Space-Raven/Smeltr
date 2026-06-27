# Token Deployment Platform — Project Context

## What this is

A SaaS-style platform for deploying Solana SPL Token-2022 tokens via
pre-audited, composable "modules" (Token-2022 mint extensions). Built with
Anchor (Rust, reserved for future custom programs), TypeScript/Next.js
(frontend + light backend), Solana Web3.js, and Token-2022 native metadata
(no Metaplex legacy program).

## Philosophy (read before changing architecture)

- **Infrastructure provider, non-custodial.** The platform builds
  instructions; the user's wallet signs and pays for everything. The
  platform NEVER holds mint authority, freeze authority, token funds, or
  (for the core deploy flow) requires an account.
- **Neutral tooling.** No market-making, no price discovery, no exchange
  features. Avoid anything that reads as financial advice.
- **"Pre-audited modules" = validated Token-2022 extension configs.** Each
  module wraps one or more native Token-2022 extensions plus a Zod schema
  for its parameters. No custom on-chain programs yet — `programs/` is a
  placeholder so a future custom Transfer Hook program is additive, not a
  restructure.

## Monorepo layout

```
/platform
├── apps/web/                     # Next.js app
│   ├── app/
│   │   ├── deploy/page.tsx       # main deployment flow
│   │   ├── dashboard/page.tsx    # "My Tokens" — requires SIWS session
│   │   └── api/
│   │       ├── auth/nonce/route.ts
│   │       ├── auth/verify/route.ts
│   │       └── deployments/...
│   ├── components/
│   │   ├── module-config/        # per-module config forms
│   │   ├── MetadataForm.tsx      # name/symbol/image -> Irys upload
│   │   └── DeploymentReviewPanel.tsx
│   ├── hooks/
│   │   ├── useTokenDeployment.ts # prepare/review/confirm/attachMetadata
│   │   ├── useSiwsAuth.ts
│   │   ├── useIrysUpload.ts
│   │   └── useSubscription.ts    # polls /api/subscription; gates premium UI paths
│   ├── lib/                       # risk config, tx submission, siws, prisma, session, stripe, subscription
│   └── prisma/schema.prisma
├── packages/
│   ├── module-registry/src/       # Layer 1: module defs, schemas, compatibility
│   │   ├── modules/                # transfer-fee, non-transferable, permanent-delegate
│   │   └── metadata/                # MetadataProvider + Token2022 native impl
│   └── tx-builder/src/             # Layer 2: orchestrator, metadata attachment
└── programs/transfer-hook-template/ # placeholder for future custom hooks
```

`module-registry` and `tx-builder` are pure TypeScript, no Anchor
dependency — the frontend can build valid Token-2022 transactions without
any platform-owned on-chain program.

## Module Registry (packages/module-registry)

Modules implemented: `transfer-fee`, `non-transferable`, `permanent-delegate`.

Every module:
- Declares its Token-2022 `extensionTypes` (for `getMintLen`).
- Has a Zod `paramsSchema`. Authority fields use `AuthorityPublicKeySchema`
  — **required, no defaults** — and every builder calls
  `assertNoPlatformAuthority()` before constructing instructions. This is
  the core non-custodial invariant: NO authority field may ever resolve to
  a platform-held key. `PLATFORM_AUTHORITY_DENYLIST` must be populated from
  env config before production.
- u64 params (e.g. `maximumFee`) are numeric strings -> `bigint` via
  `U64StringSchema`, to avoid JS number precision loss.

`compatibility.ts` (`validateModuleSelection`) checks: unknown ids,
duplicate modules, duplicate underlying `ExtensionType`s across
modules+metadata (`assertNoExtensionCollision` /
`ExtensionCollisionError`), hard conflicts (`incompatibleWith`), and soft
conflicts (warnings only — e.g. Non-Transferable + Transfer Fee: legal but
fees are never collectible).

## Orchestrator (packages/tx-builder) — instruction ordering is load-bearing

`buildMintInstructions` produces **transaction 1**:
`CreateAccount -> [module init instructions] -> MetadataPointer init (if
metadata) -> InitializeMint`. This exact order is required by Token-2022:
extension init must precede `InitializeMint`, and `CreateAccount` +
`InitializeMetadataPointer` + `InitializeMint` must be in the same
transaction.

### Metadata: corrected two-transaction flow (IMPORTANT — do not "fix" this back)

An earlier draft used `createReallocateInstruction` + a separate lamport
transfer in transaction 2. **This was wrong** and was corrected per
Solana's official Token-2022 metadata docs. The correct pattern:

- **Transaction 1** (`buildMintInstructions`): `CreateAccount`'s `space` is
  `getMintLen([...moduleExtensions, MetadataPointer])` (MetadataPointer
  only — `TokenMetadata` is variable-length and not part of `getMintLen`).
  But `CreateAccount`'s `lamports` is
  `getMinimumBalanceForRentExemption(mintAccountSpace +
  additionalMintSpace)` where `additionalMintSpace =
  MetadataProvider.getAdditionalMintSpace(ctx, input)` — i.e. **overfund
  the account upfront** to cover the eventual `TokenMetadata` TLV entry.
- **Transaction 2** (`buildMetadataAttachmentInstructions`): just
  `InitializeTokenMetadata` (`createInitializeInstruction` from
  `@solana/spl-token-metadata`). No reallocate, no lamport transfer —
  `InitializeTokenMetadata` resizes the account itself, and it's already
  rent-exempt at the new size because of transaction 1's overfunding.

`MetadataProvider` interface (packages/module-registry/src/metadata/types.ts):
`id`, `getPreInitExtensionTypes()`, `buildPreInitInstructions()`,
`getAdditionalMintSpace()`, `buildPostInitInstructions()`. Only
`token-2022-native` is implemented. Legacy Metaplex was evaluated and
rejected for now (bigger dependency footprint, royalty/creator fields that
don't fit "no market-making", Token-2022 cross-program risk) — if it's ever
added, it implements the same interface (`getPreInitExtensionTypes`
returns `[]`, no mint-account sizing needed).

### Two-transaction UX is a deliberate, permanent decision

Even though the corrected flow above means small deployments COULD fit
metadata in one transaction, **the product always uses two transactions**
(mint creation, then a separate user-initiated "Add Metadata" step) for
consent/recoverability reasons. Do not collapse these.

### Transaction size guard

`submitTransaction` (apps/web/lib/submitTransaction.ts) serializes and
checks against the 1232-byte limit before simulating/signing, with a clear
error rather than an opaque RPC rejection.

## High-impact module gating (apps/web/lib/risk.ts)

`HIGH_IMPACT_MODULES` (currently just `permanent-delegate`) and
`HIGH_IMPACT_MODULE_WARNINGS` (specific risk text per module — fallback
text if a future module is added without one). `DeploymentReviewPanel`
renders a per-module checkbox for each high-impact module; `confirm()` in
`useTokenDeployment` re-checks `acknowledgedModules` as defense-in-depth
even though the UI should already disable the button.

## Frontend deploy flow (apps/web/app/deploy/page.tsx)

`ModuleConfigSection` -> per-module forms (react-hook-form +
`zodResolver`, authority fields default to the connected wallet) ->
`MetadataForm` (optional; uploads image + JSON to Arweave via Irys
BEFORE `prepare()`, since the `uri` is needed for transaction 1's sizing)
-> `useTokenDeployment().prepare()` -> `DeploymentReviewPanel` ->
`confirm()` (transaction 1) -> success screen with `attachMetadata()`
button (transaction 2).

### Irys upload (apps/web/hooks/useIrysUpload.ts, lib/imageCompression.ts)

`WebUploader(WebSolana).withProvider(wallet)` — confirmed against Irys
docs. `getPrice`/`getBalance`/`fund`/`uploadData` method names are
Bundlr-era conventions carried into Irys's rebrand and **not yet smoke
tested** against the installed package version — do this first, before
relying on the upload path. Images are compressed client-side to <95KB to
stay under Irys's documented 100KiB free-upload tier and avoid a surprise
extra funding transaction. Image upload and JSON upload are independently
retryable (image URI persisted across retries — Arweave data can't be
deleted, so don't re-upload on retry).

## Dashboard / persistence (apps/web — Prisma + SIWS)

Three Prisma models: `AuthNonce`, `Subscription` (currently unused —
Stripe/subscription work is PAUSED, see below), `Deployment`.

- **SIWS (Sign-In with Solana)**: `useSiwsAuth` ->
  `/api/auth/nonce` (server generates+persists full `SolanaSignInInput`
  including `domain`, single-use, 5min TTL) -> wallet `adapter.signIn()`
  -> `/api/auth/verify` (checks nonce validity + `input.domain` matches
  what was issued, then `verifySignIn` from
  `@solana/wallet-standard-util`) -> httpOnly session JWT cookie via
  `jose`. `getSessionWallet()` reads this for gated endpoints.
- **Deployment index** (`/api/deployments`): after transaction 1 succeeds,
  best-effort (non-blocking, failure doesn't surface as a deploy error)
  POST records `{mintAddress, walletAddress (from session, never request
  body), decimals, hasMetadata, metadataAttached, name, symbol, uri,
  signature}`. Upsert on `mintAddress` (idempotent). After transaction 2,
  PATCH sets `metadataAttached: true`. PATCH checks record ownership and
  returns 404 (not 403) on mismatch to avoid confirming existence.
- **Dashboard** (`/dashboard`): requires SIWS sign-in (optional — the core
  deploy flow works without it; signing in only unlocks
  tracking/resumability). Lists deployments; for
  `hasMetadata && !metadataAttached`, shows "Add Metadata" which rebuilds
  transaction 2 directly via `buildMetadataAttachmentInstructions` +
  `submitTransaction`.

## Subscription / premium tier (BUILT — needs Stripe keys to activate)

Production domain: **smeltr.org**. Pricing: **$19/month**.

Premium features:
- Platform-funded Irys uploads (no wallet transaction required)
- Saved deployment history (dashboard)
- Priority RPC (platform-owned Helius/QuickNode endpoint — scaffolded, needs PLATFORM_RPC_URL)

### Architecture

Gating is via **Stripe-linked wallet subscription** (no KYC). The Stripe
customer is keyed by `metadata.walletAddress` set at checkout time. SIWS
session is required to initiate checkout or use premium endpoints — the
wallet address comes from the session cookie, never the request body.

### New API endpoints

- **POST /api/stripe/checkout** — requires SIWS session; creates/retrieves
  Stripe customer; returns `{url}` for redirect to Stripe hosted checkout.
  Success redirects to `/dashboard?checkout=success`.
- **POST /api/stripe/webhook** — verifies `stripe-signature` header using
  `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`.
  Handles `customer.subscription.created/updated/deleted` → upserts
  `Subscription` table. Uses `req.text()` (not `req.json()`) to preserve
  raw bytes for HMAC verification.
- **GET /api/subscription** — returns `{premium, status, currentPeriodEnd}`;
  used by `useSubscription` hook to gate UI paths client-side.
- **POST /api/upload/metadata** — platform-funded Irys upload; requires
  SIWS session + active subscription (`isPremium()`). Accepts multipart
  `{file, type}`, returns `{uri}`. Uses `PLATFORM_IRYS_PRIVATE_KEY` server-side.

### Required env vars (see .env.example)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...          # $19/mo recurring price, create in Stripe dashboard
PLATFORM_IRYS_PRIVATE_KEY=...      # base58 secret key of platform Irys funding wallet
PLATFORM_RPC_URL=...               # optional: Helius/QuickNode key for priority RPC
```

### Webhook registration

In the Stripe dashboard → Webhooks, register:
  `https://smeltr.org/api/stripe/webhook`
Events to listen for: `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`.

### MetadataForm upload routing

`MetadataForm` calls `useSubscription()` on render. If `premium`, uploads
go to `/api/upload/metadata` (platform-funded, no wallet prompt). If
`free`, falls back to `useIrysUpload` (client-side wallet-funded path).
The fallback is unconditional — a subscription check error never blocks a free user.

### isPremium logic (lib/subscription.ts)

`active` and `trialing` statuses are treated as premium. `past_due` is
NOT — the user should see a payment prompt. Stale webhooks are guarded
against by checking `currentPeriodEnd < now` even when status is `active`.

## Known gaps / explicitly deferred

- Cross-device resumability for an in-progress-but-incomplete metadata
  attachment relies on the Deployment table + dashboard (built). No
  further gaps known here.
- Legacy Metaplex metadata support: not built, rejected for now, but
  `MetadataProvider` interface was designed so it could slot in later.
- On-chain `getProgramAccounts`-based dashboard (no backend): rejected as
  impractical against Token-2022 on typical RPC providers without a paid
  indexer.

## Roadmap: multi-chain support

The platform is Solana-only today. All chain-specific logic is concentrated
in `packages/tx-builder` and the wallet/auth layer in `apps/web`; the
module-registry concept (composable, pre-audited extension configs + Zod
schemas) is chain-agnostic and should transfer well.

**Pre-requisite (do first):** abstract a `ChainAdapter` interface in
`packages/tx-builder` so each chain implements `buildMintInstructions`,
`buildMetadataAttachmentInstructions`, and `submitTransaction` behind a
common contract. This pays the architectural debt once and makes every
subsequent chain additive rather than a fork.

**Candidate chains, in recommended priority order:**

1. **EVM (Ethereum + L2s — Base, Optimism, Arbitrum, Polygon)**
   OpenZeppelin ERC-20 extensions (`Pausable`, `Burnable`, `Capped`,
   `Permit`, `Votes`, `FlashMint`) map directly onto the "pre-audited
   modules" framing — OZ *is* the audit gold standard for EVM. One
   implementation covers all EVM-compatible networks via chain selector +
   RPC swap. Wallet: wagmi + viem. Auth: EIP-4361 (Sign-In with Ethereum)
   as the SIWS equivalent. Highest addressable market; highest effort.

2. **Cosmos Token Factory**
   Chains running the `tokenfactory` Cosmos SDK module (Osmosis, Injective,
   Neutron, Stargaze, ~30 others) support permissionless token minting with
   admin/mint/burn authority and force-transfer — the closest conceptual
   match to Token-2022 outside Solana. IBC interoperability means a token
   deployed here is immediately bridgeable across the ecosystem, which is a
   genuine product differentiator. Wallet: Keplr/Leap via `@cosmos-kit`.
   Medium effort; strong philosophical alignment.

3. **Sui**
   Sui's `Coin` standard + `ClosedLoopToken` transfer-policy objects offer
   module-like composability (transfer restrictions, regulated coins).
   `@mysten/sui` SDK and `@mysten/dapp-kit` are well-maintained. Move's
   object model is the main learning curve. Medium effort; growing ecosystem.

4. **TON** *(lower priority)*
   Jetton standard is simpler, and Telegram distribution is a real growth
   vector, but FunC/Tact tooling lags and the wallet surface is mostly
   Telegram-native. Revisit if Telegram becomes a core GTM channel.

**Auth/session impact:** SIWS is Solana-specific. Multi-chain sign-in will
require either per-chain auth standards (EIP-4361 for EVM, etc.) or a
chain-agnostic session approach (e.g. CAIP-122). The `AuthNonce` +
`getSessionWallet()` pattern in `apps/web/lib` will need to be generalised
to store `{chain, address}` rather than a bare Solana public key.

**Deployment model impact:** `Deployment` Prisma model stores
`mintAddress` as a bare string — adding a `chain` field (enum or string)
and making the unique constraint `(mintAddress, chain)` is the minimal
schema change needed.

## Testing

`packages/tx-builder/src/__tests__/extensionCollision.test.ts` — unit test,
no validator needed.
`packages/tx-builder/src/__tests__/metadata.devnet.test.ts` — requires
`solana-test-validator` running locally; `--runInBand`. Verifies the full
two-transaction flow via `getTokenMetadata` + a rent-exemption check on the
mint account after transaction 2 (the property the transaction-1
overfunding is supposed to guarantee).

## Immediate next steps (suggested)

1. ✅ Smoke-test the Irys upload path on mainnet — confirmed working.
2. ✅ Run both test scaffolds — devnet two-tx flow passed.
3. ✅ Subscription thread built — needs Stripe account + env vars to activate.
4. Populate `PLATFORM_AUTHORITY_DENYLIST` from env config before production.
5. Set up Stripe account at stripe.com, create a $19/mo recurring product,
   copy keys into production env, register the webhook endpoint.
6. Fund `PLATFORM_IRYS_PRIVATE_KEY` wallet with SOL before enabling premium uploads.
7. Wire `ChainAdapter` interface in `tx-builder` before adding a second chain.
