# Agent(security)-audit2-TokenPlatform

Date: 2026-07-07
Reviewer: Codex, adversarial new-dev review
Scope: Token deployment platform repo, with emphasis on non-custodial guarantees, Solana transaction integrity, SIWS/session APIs, admin/review surfaces, premium upload/ops routes, and beta-readiness controls.
Status: Active audit. Findings below are not remediated in this report unless explicitly marked fixed.

## Executive Summary

The core Token-2022 instruction builder is stronger than the surrounding app shell: authority denylist checks, module validation, instruction ordering, and metadata sizing are mostly well defended. The highest-risk issues are now at product and persistence boundaries:

- The client currently auto-runs transaction 2 for metadata, contradicting the deliberate user-initiated two-transaction consent model.
- The dashboard metadata-attached flag can be set from an arbitrary signature string without on-chain verification.
- Deployment records accept caller-controlled chain IDs while verification still uses the configured Solana RPC path.
- Admin review mutation identifies records by mint address only despite a composite `(chainId, mintAddress)` identity.

CI unit tests and the production build pass as of this review, so the main risk is not baseline compilation. It is missing adversarial coverage around newer persistence/ops paths.

## Threat Model

Assets:
- User wallet consent and signing boundaries.
- Mint authority, freeze authority, permanent delegate authority, transfer-fee authorities.
- Deployment history and dashboard resumability integrity.
- Admin review/curation state.
- Platform-funded Irys wallet and sweeper funds.
- Stripe-linked premium access state.

Trust boundaries:
- Browser to Next.js API routes.
- SIWS session cookie to wallet identity.
- User-supplied transaction signatures to on-chain verification.
- Client-selected deployment target to persisted chain identity.
- Operator/admin session to curation mutations.
- Cron-authenticated ops routes to platform hot wallet actions.

## Findings

### High 1: Metadata transaction auto-submits, bypassing the two-step consent invariant

Reference: `apps/web/hooks/useTokenDeployment.ts:247`

`useTokenDeployment` starts `attachMetadata()` automatically once transaction 1 succeeds and metadata is ready. This violates the project invariant that metadata attachment is always a separate user-initiated step for consent and recoverability. The wallet still prompts, but the product no longer provides an intentional "Add Metadata" decision point after mint creation.

Impact:
- Users can receive an unexpected second wallet prompt immediately after mint creation.
- The documented recovery model is weakened; transaction 2 is no longer a deliberate continuation.
- Future code may assume transaction 2 is optional/resumable while the hook tries to run it automatically.

Remediation:
- Remove the auto-start `useEffect` and `autoMetadataStarted` ref.
- Ensure the success screen exposes a clear explicit "Add Metadata" action only.
- Add a client/hook test that transaction 1 success does not call `attachMetadata()`.

### High 2: Metadata attachment persistence trusts an arbitrary signature

Reference: `apps/web/app/api/deployments/[mintAddress]/route.ts:7`
Reference: `apps/web/app/api/deployments/[mintAddress]/route.ts:46`

The metadata PATCH route validates only that `metadataSignature` looks vaguely base58-like, then sets `metadataAttached: true`. It does not fetch the transaction, verify success, verify fee payer/session wallet, verify the transaction targets the same mint, or verify the correct metadata instruction/provider.

Impact:
- A signed-in owner can make dashboard/index state claim metadata was attached when no metadata exists.
- Review/admin surfaces may curate incorrect token state.
- Recovery UX can hide the "resume metadata" path after a bogus PATCH.

Remediation:
- Add `checkMetadataAttachment(tx, deployment, walletAddress)` similar to `checkMintCreation`.
- For Token-2022 native metadata, verify a successful `spl-token-metadata` initialize instruction for the mint/account.
- For legacy SPL, verify successful Metaplex metadata PDA creation for the mint.
- Tighten signature regex to the same 64-88 char base58 shape used in deployment creation.
- Add route tests for fake signature, failed tx, wrong mint, wrong wallet, wrong provider, and confirmed success.

### High 3: Deployment registration accepts caller-controlled chain IDs

Reference: `apps/web/app/api/deployments/route.ts:25`
Reference: `apps/web/app/api/deployments/route.ts:53`
Reference: `apps/web/app/api/deployments/route.ts:197`

`POST /api/deployments` accepts any non-empty `chainId` and stores it, while verification always uses `NEXT_PUBLIC_SOLANA_RPC_URL` or a devnet fallback. A caller can register a Solana-verified transaction under an arbitrary or future chain key, including `evm-base`, `solana-devnet` on a mainnet RPC, or typo chains.

Impact:
- Chain separation is corrupted before multi-chain work is finished.
- Composite uniqueness can be bypassed semantically by registering the same mint/signature under many chain IDs.
- Dashboard/admin filters and future API consumers can make wrong trust decisions from persisted chain identity.

Remediation:
- Replace `z.string().min(1)` with an enum of supported chain IDs.
- Derive chain ID server-side from verified transaction/RPC cluster where possible; otherwise require and validate `cluster` against an allowlist.
- Reject non-Solana chain IDs until EVM/Cosmos/Sui adapters are real.
- Add route tests for invalid chain ID, mismatched chain ID/RPC cluster, duplicate same mint across invalid chains.

### Medium 1: Admin review mutation is ambiguous across chains

Reference: `apps/web/app/api/admin/review/[mintAddress]/route.ts:35`

The admin PATCH route finds the target by `mintAddress` only, then updates the first matching deployment. The schema has a composite primary key `(chainId, mintAddress)`, and the rest of the code is moving toward multi-chain/multi-standard records.

Impact:
- Admin can approve, hide, or feature the wrong record when the same mint address appears in multiple chain records.
- Future multi-chain curation will be nondeterministic.

Remediation:
- Require `chainId` in the route path or query string.
- Use `findUnique({ where: { chainId_mintAddress } })` directly.
- Update the admin UI and CSV/export links to carry chain ID.
- Add a regression test with two records sharing a mint address across chain IDs.

### Medium 2: SIWS verify route can 500 on malformed JSON/body shape

Reference: `apps/web/app/api/auth/verify/route.ts:16`

The verify route destructures `await req.json()` without a parse guard. Malformed JSON or unexpected shapes can throw before the route returns a controlled 400.

Impact:
- No auth bypass observed, but this creates noisy 500s and weakens abuse handling on a public auth endpoint.

Remediation:
- Wrap JSON parsing in try/catch.
- Validate body shape with Zod, including bounded numeric arrays for `publicKey`, `signature`, and `signedMessage`.
- Add tests for malformed JSON, missing output, oversized arrays, and stale nonce behavior.

### Medium 3: Irys sweeper can silently fall back to devnet RPC

Reference: `apps/web/app/api/ops/sweep-irys/route.ts:85`
Reference: `apps/web/app/api/ops/sweep-irys/route.ts:122`

The sweeper falls back to `NEXT_PUBLIC_SOLANA_RPC_URL` and then public devnet if `PLATFORM_RPC_URL` is absent. For a production hot-wallet operation, falling back to public devnet is too permissive.

Impact:
- Misconfigured production could report/sweep on the wrong cluster.
- If the same key is funded on more than one cluster, operator expectations can drift.

Remediation:
- In production/Vercel, require `PLATFORM_RPC_URL`.
- Require an explicit `PLATFORM_SOLANA_CLUSTER=mainnet-beta|devnet` and reject mismatches between URL/cluster.
- Run the readiness checker as a hard gate before enabling the cron.
- Add tests for production missing RPC and cluster mismatch.

### Low 1: Platform-funded JSON uploads are content-type constrained but schema-unconstrained

Reference: `apps/web/app/api/upload/metadata/route.ts:107`

The upload route allowlists `application/json`, but does not validate that uploaded JSON is token metadata JSON or impose field-level limits before the platform pays to publish it permanently.

Impact:
- Premium users can spend platform upload quota on arbitrary JSON within size/quota caps.
- Not a direct custody issue, but it weakens "platform-funded metadata" cost controls and content hygiene.

Remediation:
- For `application/json`, parse and validate expected metadata fields before upload.
- Consider separate tighter size caps for JSON vs images.
- Add tests for invalid JSON, unexpected fields, and excessive field lengths.

## Positive Findings

- Core Token-2022 builder checks platform authority denylist before building.
- Module params use Zod and bigint parsing for u64 values.
- Stripe webhook uses raw body + signature verification before DB writes.
- Deployment creation verifies the transaction initializes the target mint and uses the session wallet as fee payer.
- CSRF middleware covers mutating API routes except Stripe webhook.
- Platform-funded upload endpoint has premium gating, content-type allowlist, file-size cap, and daily quota reservation/refund.
- `.env` is ignored and not tracked.

## Verification Run

- `npm.cmd run test:ci` passed: 125 tests across tx-builder, web route/lib tests, and MCP server.
- `npm.cmd run build` passed: TypeScript + Next.js production build.
- Warnings observed: `bigint-buffer` native binding warning; fallback pure JS path used.

## Remediation Roadmap

### Phase 0: Stop consent and state-integrity drift

Target: 1 day.

1. Remove metadata auto-submit in `useTokenDeployment`.
2. Add explicit metadata-attach UX regression coverage.
3. Implement and enforce metadata transaction verification before setting `metadataAttached`.
4. Tighten metadata signature validation.

Exit criteria:
- Transaction 2 only runs from an explicit user action.
- Bogus metadata signatures cannot update deployment state.
- New tests fail before the fix and pass after it.

### Phase 1: Make chain identity authoritative

Target: 1-2 days.

1. Restrict deployment `chainId` to supported enum values.
2. Reject unsupported/future chains until their adapters and verifiers exist.
3. Add cluster consistency checks between submitted chain ID and the server verification RPC.
4. Require `chainId` for admin review mutations and update admin UI/API calls.

Exit criteria:
- No arbitrary chain IDs can be persisted.
- Admin review updates are deterministic across composite deployment IDs.

### Phase 2: Harden public auth and ops edges

Target: 1 day.

1. Add Zod validation and parse guards to `/api/auth/verify`.
2. Require explicit production RPC/cluster config for `/api/ops/sweep-irys`.
3. Add readiness tests for sweeper misconfiguration.
4. Validate platform-funded JSON metadata before Irys upload.

Exit criteria:
- Malformed auth requests return controlled 400s.
- Sweeper refuses production fallback behavior.
- Platform-funded JSON uploads match expected metadata shape.

### Phase 3: Add adversarial CI coverage

Target: 1-2 days.

1. Add route tests for metadata PATCH on-chain verification.
2. Add deployment POST tests for chain ID mismatch and duplicates.
3. Add admin review tests for duplicate mint across chains.
4. Add hook-level test or component integration test for no automatic metadata attach.
5. Add a CI job or test pattern that includes the new security route tests by default.

Exit criteria:
- CI covers each finding's exploit path.
- `npm run test:ci` remains green.
- `npm run build` remains green.

### Phase 4: Close the audit

Target: after fixes merge.

1. Re-run `npm.cmd run test:ci`, `npm.cmd run build`, and any relevant devnet/mainnet smoke checklist rows.
2. Update `PROJECT.md` with a dated summary of audit2 fixes and residual risks.
3. Update `corporate/engineering-roadmap.md` with any priority changes.
4. Delete this audit file only after all findings are fixed or explicitly deferred by the operator.
