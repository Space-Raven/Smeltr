# Deployment target architecture

**Status:** Canonical architecture (2026-07-05)  
**Tracks:** A (Legacy SPL) · B (Multi-chain)  
**Reality check:** Every decision below is validated against the current repo—not aspirational forks.

### Operator decisions (locked 2026-07-05)

| Question | Decision |
|----------|----------|
| Legacy metadata in A1? | **No** — A1 is mint-only; metadata deferred to **A2 (Metaplex)** |
| Prisma `chainId` + composite PK? | **Yes** — proceed in A1c |
| Disable auto tx2 metadata? | **No for Token-2022** — keep existing `useEffect` auto-attach. Legacy gets the **same UX pattern in A2**, not a global disable |
| One metadata system or two? | **Two providers, one hook** — see [Metadata: two systems, one UX](#metadata-two-systems-one-ux) |

---

## Problem statement

Smeltr today is **Solana Token-2022 only**, hard-wired in four places:

| Layer | Token-2022 assumption | File |
|-------|----------------------|------|
| Tx build | `buildMintInstructions` → `TOKEN_2022_PROGRAM_ID` | `packages/tx-builder/src/orchestrator.ts` |
| Metadata tx2 | `buildMetadataAttachmentInstructions` → Token-2022 native provider | `metadataAttachment.ts` |
| Deploy hook | Direct imports above | `apps/web/lib/buildDeploymentPlan.ts`, `useTokenDeployment.ts` |
| Index / auth | `checkMintCreation` checks **Token-2022 program only** | `apps/web/lib/verifyDeployment.ts` |
| Dashboard DB | PK = `mintAddress` string only | `prisma/schema.prisma` |

Track **A** adds a second mint path on the **same chain** (classic SPL). Track **B** adds **other chains** later. Those are different axes—conflating them causes the wrong abstractions.

---

## Core model: two axes

```
DeploymentTarget
├── chain: "solana" | "evm" | …
└── chain-specific variant
      ├── solana → cluster + tokenStandard ("token-2022" | "spl-legacy")
      └── evm     → evmChainId ("base", …)   [future — no UI until adapter wired]
```

**Do not** encode `tokenStandard` on a future EVM adapter. **Do not** put `chainId: "solana-mainnet"` on singleton adapter objects—network comes from the wallet/RPC context.

### Capability matrix (project reality)

| Capability | Token-2022 | Legacy SPL (A1) | Legacy + Metaplex (A2) | EVM (B, future) |
|------------|------------|-----------------|------------------------|-----------------|
| Extension modules | ✅ | ❌ hide UI | ❌ | OZ modules (different registry) |
| Native TokenMetadata (2-tx) | ✅ | ❌ | ❌ | N/A |
| Metaplex metadata | ❌ (rejected for T22) | ❌ until A2 | ✅ separate tx pattern | IPFS/contract metadata |
| `assertNoPlatformAuthority` | ✅ | ✅ | ✅ | new denylist per chain |
| MCP validation | ✅ | ❌ until A3 | partial | future |
| Dashboard index | ✅ T22 program check | ❌ needs program-aware verify | same | `{chain, address}` |
| Protocol fee (0.03 SOL) | ✅ | ✅ A1 | ✅ | chain-native fee later |

---

## Layer 2: `SolanaMintAdapter` (not generic `ChainAdapter` yet)

**Decision:** Split Solana standards **now**. Defer **generic** `ChainAdapter` until EVM spike—because EVM will not use `Connection`, `ModuleSelection`, or `MetadataProvider` as they exist today.

Current code lives in `packages/tx-builder/src/chain/`:

| Export | Role |
|--------|------|
| `DeploymentTarget` | Discriminated union + `clusterFromConnection()` |
| `getSolanaMintAdapter(standard)` | Returns token-2022 or legacy adapter |
| `getDeploymentCapabilities(target)` | UI gating (modules, metadata, MCP) |
| `chainRecordKey(target)` | Stable string for Prisma/API `{chainId, mintAddress}` |

**Legacy adapter (shipped):** `TOKEN_PROGRAM_ID`, no modules, metadata throws until Metaplex provider exists.

**Token-2022 adapter:** Thin delegate to existing `orchestrator.ts` (no logic duplication).

### Why not one `ChainAdapter` interface today?

The existing interface forced `BuildMintInstructionsParams` (modules + Token-2022 metadata provider) onto legacy SPL—works only because legacy rejects modules at runtime. EVM params will be `{ bytecode, constructorArgs, … }`. A single interface would be lying types.

**B milestone:** Introduce `packages/tx-builder/src/chain/evm/` with `EvmChainAdapter` + `DeploymentTarget.chain === "evm"`. Solana keeps `SolanaMintAdapter`.

---

## Wire path (target — not all implemented)

```
deploy/page.tsx
  └─ DeploymentTarget state (default: solana + token-2022)
       └─ useTokenDeployment.prepare({ ...config, target })
            └─ buildDeploymentPlan({ ...args, target })
                 └─ getSolanaMintAdapter(target.tokenStandard)
                      .buildMintInstructions({ chainId from target, connection, ... })
            └─ attachMetadata → adapter.buildMetadataAttachmentInstructions(...)
       └─ POST /api/deployments { chainId, tokenStandard, mintAddress, ... }
            └─ checkMintCreation(tx, mint, wallet, { programId })
```

**Today:** A1 wired through adapters; legacy mint-only until A2. See [`SMOKE_TESTS_A2_A3.md`](SMOKE_TESTS_A2_A3.md) for A2/A3 done gates.

---

## Track A — Legacy SPL (sequenced)

| Phase | Deliverable | Blockers |
|-------|-------------|----------|
| **A0** | Architecture + types + adapters | ✅ this doc + chain refactor |
| **A1** | UI token-type picker; wire hook → adapter; hide modules for legacy | A0 |
| **A1b** | `checkMintCreation` accepts `TOKEN_PROGRAM_ID` OR Token-2022 | A1 |
| **A1c** | API + Prisma store `chainId`, `tokenStandard` | A1b |
| **A2** | `MetaplexMetadataProvider` implements `MetadataProvider` with `getPreInitExtensionTypes() → []`, post-init = Metaplex ix | Product decision: 1-tx vs 2-tx Metaplex |
| **A3** | MCP tools branch on `tokenStandard` | A1 |

### Metadata: two systems, one UX

**Site reality today:** smeltr.org is Token-2022 throughout (homepage 4-step flow, deploy page, blog). Step 02–04 assume **native TokenMetadata** — the blog module reference explicitly says “no Metaplex account needed” for Token-2022. Classic SPL is not marketed yet; A1 picker copy must not contradict the homepage until we add a legacy-specific explainer (C3 or deploy sub-copy).

**Two on-chain systems** (not one generic metadata path):

| | Token-2022 | Legacy SPL (A2) |
|---|------------|-------------------|
| Standard | Native `TokenMetadata` TLV on mint | Metaplex Token Metadata PDA |
| Provider | `Token2022NativeMetadataProvider` (shipped) | `MetaplexMetadataProvider` (A2) |
| Tx1 sizing | Overfund mint for TLV (`getAdditionalMintSpace`) | No mint overfund (`getAdditionalMintSpace → 0`) |
| Tx2 instruction | `InitializeTokenMetadata` | `createMetadataAccountV3` (or current Metaplex ix set) |
| Irys / Arweave upload | Same `MetadataForm` + `/api/upload/metadata` | **Same** — URI is chain-agnostic |
| Product flow | Two wallet signatures; auto tx2 after tx1 | **Same** after A2 — do not fork the hook |

**Shared application layer (intentional):**

```
MetadataForm (Irys upload)
  └─ provider picked by tokenStandard:
       token-2022  → Token2022NativeMetadataProvider
       spl-legacy  → MetaplexMetadataProvider (A2)
useTokenDeployment.attachMetadata()
  └─ adapter.buildMetadataAttachmentInstructions() OR provider.buildPostInitInstructions via adapter
  └─ auto-metadata useEffect: runs when metadataConfig is set — **unchanged for Token-2022**
```

**A1 vs A2 gating:**

- **A1 (legacy selected):** Hide/disable `MetadataForm`; `prepare()` sends no `metadata`. Mint succeeds; no tx2 prompt (nothing to attach). Dashboard row: `hasMetadata: false`.
- **A2 (legacy + Metaplex):** Re-enable `MetadataForm`; `capabilities.metaplexMetadata === true`; auto tx2 works like Token-2022. Do **not** remove or gate off the auto-metadata `useEffect` globally.

**What we are NOT doing:** Disabling auto-metadata for Token-2022 when adding legacy. **What we ARE doing:** Separate `MetadataProvider` implementations behind the same hook and two-step product decision.

### Metaplex (A2) — provider shape

`MetadataProvider` (`packages/module-registry/src/metadata/types.ts`) was written for Token-2022 native but explicitly allows a second provider. Metaplex fits without interface changes:

- `getPreInitExtensionTypes()` → `[]`
- `buildPreInitInstructions()` → `[]`
- `getAdditionalMintSpace()` → `0` (PDA is separate account)
- `buildPostInitInstructions()` → Metaplex create-metadata ix set (**tx2**, user-initiated; auto-continued by hook)

Do **not** reuse Token-2022 overfund sizing for Metaplex. `legacySplAdapter.buildMetadataAttachmentInstructions` delegates to `MetaplexMetadataProvider`, not `metadataAttachment.ts` (Token-2022-only helper).

---

## Track B — Multi-chain (sequenced)

| Phase | Deliverable | Depends on |
|-------|-------------|------------|
| **B0** | Prisma + API `{ chainId, mintAddress }` unique | A1c (same migration) |
| **B1** | `EvmChainAdapter` interface + spike doc (OZ ERC-20 + Base) | Solana wired through `DeploymentTarget` |
| **B2** | Auth `{ chain, address }` — EIP-4361 or CAIP-122 | B1 |
| **B3** | EVM deploy UI | **Never before B0–B1** |

**Rejected for now:** Forking `useTokenDeployment` into `useEvmDeployment` before B0—duplicates plan/review/index patterns.

---

## Prisma migration (B0 / A1c)

```prisma
model Deployment {
  chainId           String    @default("solana-mainnet")
  tokenStandard     String?   // "token-2022" | "spl-legacy" | null for non-Solana
  mintAddress       String    // rename conceptually to "assetAddress" later if needed

  @@id([chainId, mintAddress])
  // remove mintAddress @id alone
}
```

**Backfill:** All existing rows → `chainId = "solana-mainnet"`, `tokenStandard = "token-2022"`.

**API routes:**  
- Prefer `GET /api/deployments` unchanged (filter by session wallet).  
- `PATCH /api/deployments/:mintAddress` → add query `?chainId=` or path segment—**breaking**; use `chainId` query with default for backward compat during rollout.

**SIWS session:** Still Solana-only until B2. EVM deployments index without session or with separate auth—document as open.

---

## On-chain verification (must evolve with A)

`checkMintCreation` today hardcodes Token-2022 program id. Extend signature:

```typescript
checkMintCreation(tx, mintAddress, walletAddress, {
  mintProgramId: TOKEN_2022_PROGRAM_ID | TOKEN_PROGRAM_ID
})
```

Same fee-payer + initializeMint logic; different `programId` check. Unit tests in `verifyDeployment.test.ts`—add legacy fixture.

---

## MCP (A3)

`packages/mcp-server` tools assume Token-2022 module registry. Legacy path:

- New tool param `tokenStandard` default `"token-2022"`
- Legacy: validate decimals + authorities only; return clear error if modules requested

---

## UI token picker (A1)

- Default: **Token-2022 (recommended)** — matches all current site/marketing copy
- Secondary: **Classic SPL** — explain: no extension modules; **on-chain metadata via Metaplex in a follow-up release (A2)**; widest legacy wallet/dApp compatibility
- When legacy selected (A1): hide `ModuleConfigSection`; hide `MetadataForm` (mint-only). Optional muted line: “Name, symbol, and logo — Metaplex attachment, coming soon.”
- When legacy + A2 shipped: show `MetadataForm` again with Metaplex provider; auto tx2 unchanged from Token-2022 path
- Denylist + review panel unchanged

---

## Corporate profitability (quick scores)

| Initiative | /10 | Verdict | Rationale |
|------------|-----|---------|-----------|
| A1 Legacy mint only | 7 | **Proceed** | Low dev cost; expands TAM; reuse fee path |
| A2 Metaplex | 7 | **Proceed after A1** | Required for legacy parity; reuses MetadataForm + hook; separate provider only |
| B0 Prisma chainId | 8 | **Proceed** with A1c | Required for B anyway; small migration |
| B3 EVM UI | 4 | **Banish** until B1 spike | High effort; Solana wire incomplete |

---

## Implementation checklist (ordered)

- [x] A0 — Architecture doc + `DeploymentTarget` types + adapter registry fix
- [x] A1 — `buildDeploymentPlan` + `useTokenDeployment` → `getSolanaMintAdapter`
- [x] A1 — Deploy UI token-type picker + capability gating
- [x] A1b — `verifyDeployment` program-aware
- [x] A1c — Prisma migration + API body fields
- [ ] A2 — Metaplex metadata provider → [`SMOKE_TESTS_A2_A3.md`](SMOKE_TESTS_A2_A3.md#a2--metaplex-metadata-for-classic-spl)
- [ ] A3 — MCP branch → [`SMOKE_TESTS_A2_A3.md`](SMOKE_TESTS_A2_A3.md#a3--mcp-tokenstandard-branch)
- [ ] B1 — EVM adapter spike (doc + empty module)

---

## References

- `CLAUDE.md` — two-tx metadata invariant (Token-2022 only)
- `packages/module-registry/src/metadata/types.ts` — provider interface
- `docs/PRODUCT_DIRECTION.md` — track summary
- Master rules: `~/Desktop/smeltr_tech/prototypes/agent-ops/`
