# Product direction (Smeltr Token Platform)

**Last updated:** 2026-07-05  
**Detail level:** Human-readable summary. Full sequencing lives in `corporate/engineering-roadmap.md` *(local, not in git)*.

---

## Active initiative tracks (2026 H2)

Three parallel tracks. **Beta stabilization** (live mint smoke test, RPC, sweeper env) still gates trust before heavy marketing.

| Track | Goal | First shippable milestone |
|-------|------|---------------------------|
| **A. Solana breadth** | Legacy SPL tokens + clearer Token-2022 positioning | Chain picker on deploy; legacy mint (no extensions) on mainnet |
| **B. Multi-chain** | EVM first, then Cosmos / Sui per CLAUDE.md | `ChainAdapter` wired; Solana adapters refactored; EVM spike doc |
| **C. UI + brand** | Forge look from `brand/` masters across app shell | Dark forge header/footer; tokens synced from `brand/source/` |

---

## Track A — Additional Solana support (legacy SPL)

**Today:** Token-2022 only (`TOKEN_2022_PROGRAM_ID`), composable extension modules, native TokenMetadata.

**Target:**

| Capability | Token-2022 | Legacy SPL |
|------------|------------|------------|
| Mint create | ✅ | Phase A1 |
| Extension modules | ✅ | N/A (extensions are Token-2022) |
| Native TokenMetadata | ✅ two-tx flow | N/A |
| Metaplex metadata | N/A (native only) | Phase A2 — **same two-step UX**, separate provider |
| MCP validation | ✅ | Phase A3 (legacy schema) |

**Architecture:** `SolanaTokenStandard` selector + `legacySplAdapter` in `packages/tx-builder/src/chain/`. Module registry applies only to Token-2022.

**UX:** Deploy step 0 — “Token type: Token-2022 (recommended) | Classic SPL”. Copy explains tradeoffs (extensions vs widest wallet compatibility).

**Metadata (operator decision):** A1 legacy = mint-only (no MetadataForm). A2 adds Metaplex for legacy using the same `MetadataForm`, Irys upload, and auto tx2 hook as Token-2022 — **do not disable** Token-2022 auto-attach. See [`docs/architecture/DEPLOYMENT_TARGET.md`](architecture/DEPLOYMENT_TARGET.md#metadata-two-systems-one-ux).

---

## Track B — Additional blockchains

**Prerequisite (in progress):** `ChainAdapter` interface in `packages/tx-builder`.

**Priority (unchanged):** EVM (Base/L2s) → Cosmos Token Factory → Sui → TON.

**Cross-cutting:**

- Prisma `Deployment.chain` + unique `(mintAddress, chain)`
- Auth generalizes to `{ chain, address }` (SIWS today; EIP-4361 later)
- Module registry concept ports; implementations are per-chain

**Do not start EVM wallet UI until** Solana adapters are behind `ChainAdapter` (avoids triple fork).

---

## Track C — UI overhaul (brand assets)

**Source of truth:** `brand/source/` → `npm run brand:export` → `apps/web/public/`.

| Surface | Current | Target |
|---------|---------|--------|
| App shell (header/footer) | Light gray/white | Forge dark gradient (`#1A0C05`–`#2D1507`) |
| Homepage hero | Mixed | Mark-led, fewer generic pills |
| Deploy flow | Functional | Forge cards, module icons from brand pipeline |
| OG / social | Updated PNGs | Re-export from `brand/source/og.svg` after Figma pass |
| Favicon / nav mark | Partial Minty debt | Single `logo-mark.svg` from Figma master |

**Phases:** C1 tokens + shell → C2 deploy/dashboard → C3 marketing pages → C4 OG/profile re-export.

See [`docs/ui-overhaul/README.md`](ui-overhaul/README.md).

---

## Operator sync

Before claiming a track “started” or “done,” confirm against:

1. `corporate/engineering-roadmap.md`
2. Git reality (`main` vs feature branches)
3. `PROJECT.md` audit history table

---

## Revenue alignment (implicit)

Legacy SPL and multi-chain expand addressable users; UI overhaul improves conversion and trust. Frame as product quality—not explicit “growth at all costs” copy.
