# Smoke tests — Track A phases A2 & A3

**Purpose:** Each phase has a binary **done / not done** gate. Automated tests run in CI; manual smokes are operator-signed before marking the phase complete in `corporate/engineering-roadmap.md`.

**Prerequisite:** A1 + A1c complete (adapter wiring, Prisma `chainId` + `tokenStandard`).

---

## How to record results

| Field | Where |
|-------|--------|
| Automated | CI green on the commands below |
| Manual | Copy the checklist table; fill `PASS` / `FAIL` + date + network |
| Phase sign-off | Operator initials in local `corporate/engineering-roadmap.md` |

---

## A2 — Metaplex metadata for Classic SPL

### Done definition (all must be true)

| # | Deliverable |
|---|-------------|
| 1 | `MetaplexMetadataProvider` in `packages/module-registry/src/metadata/` |
| 2 | Exported from `@platform/module-registry`; `id: "metaplex-legacy"` |
| 3 | `legacySplAdapter.buildMetadataAttachmentInstructions` delegates to provider (no throw) |
| 4 | `getDeploymentCapabilities({ … tokenStandard: "spl-legacy" })` → `metaplexMetadata: true`, `twoStepMetadataFlow: true` |
| 5 | Deploy UI: Classic SPL shows `MetadataForm`; `prepare()` uses `MetaplexMetadataProvider` |
| 6 | Token-2022 path unchanged (same provider, same auto tx2) |
| 7 | Dashboard resume metadata works for `tokenStandard: "spl-legacy"` rows |
| 8 | Denylist enforced on metadata update authority in provider |

**Explicit non-goals for A2:** Metaplex on Token-2022; modules on legacy; changing tx1 legacy mint shape.

### Automated gate (CI)

Run from repo root after implementation:

```powershell
# Unit — provider + adapter + capabilities
npm run test:a2:unit

# Full CI slice (must stay green)
npm run test:ci
```

**`test:a2:unit` includes (when implemented):**

| Test file | Asserts |
|-----------|---------|
| `module-registry/.../metaplexMetadata.test.ts` | `getAdditionalMintSpace() === 0`; `getPreInitExtensionTypes() === []`; `buildPostInitInstructions` returns ≥1 ix; denylist on update authority |
| `tx-builder/.../legacySplAdapter.test.ts` | `buildMetadataAttachmentInstructions` resolves (no `LegacySplNotSupportedError`) |
| `tx-builder/.../deploymentTarget.test.ts` | `spl-legacy` capabilities: `metaplexMetadata: true` |

**Integration (local validator — operator-run, not CI):**

### Option A — Local validator (Linux / WSL / macOS)

Localnet must clone the Metaplex Token Metadata program (Classic SPL A2). Smeltr validator scripts include:

`--clone-upgradeable-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`

```powershell
npm run validator:clean
npm run validator:local:wsl       # Terminal 1 (WSL) — first start may take ~2 min (mainnet clone)
npm run test:a2:integration       # Terminal 2
```

### Option B — Windows native validator broken? Use devnet (no local validator)

Agave 4.x on Windows often fails genesis unpack: `Access is denied (os error 5)` while extracting `genesis.tar.bz2`. This is **not a Smeltr bug** — [Agave #24](https://github.com/anza-xyz/agave/issues/24).

```powershell
npm run test:a2:integration:devnet
```

Uses `SOLANA_TEST_RPC=https://api.devnet.solana.com` + devnet airdrop. Slower than localnet but **pass/fail equivalent** for the metadata two-tx smoke.

### Option C — WSL2 validator (best Windows experience)

```bash
# Inside WSL
bash scripts/start-local-validator-wsl.sh
```

Then from Windows (if `localhost:8899` reaches WSL):

```powershell
npm run test:a2:integration
```

Ledger path override: `$env:SMELTR_LOCALNET_LEDGER = "D:\smeltr-ledger"` then `npm run validator:local`.

Optional skip: `$env:SKIP_INTEGRATION="1"; npm run test:a2:integration`

| Test file | Asserts |
|-----------|---------|
| `tx-builder/.../legacyMetaplex.devnet.test.ts` | Tx1: classic SPL mint (`TOKEN_PROGRAM_ID`). Tx2: Metaplex metadata ix. On-chain: name/symbol/uri readable via Metaplex SDK or explorer-equivalent fetch |

**Pass:** all `test:a2:unit` tests green; integration test green on operator machine before mainnet smoke.

### Manual smoke — Devnet (required before “A2 done”)

**Setup:** Wallet on devnet, Smeltr app pointed at devnet RPC, SIWS optional for dashboard check.

| ID | Step | Expected | Result |
|----|------|----------|--------|
| A2-M1 | Deploy → select **Classic SPL** | Metadata form visible (not “coming soon”) | |
| A2-M2 | Fill name/symbol/logo → Review → Sign tx1 | Mint succeeds; auto tx2 wallet prompt (or manual Add Metadata) | |
| A2-M3 | Complete tx2 | Success screen shows metadata attached + explorer link | |
| A2-M4 | Solana Explorer → mint | Token shows name/symbol (Metaplex metadata account, not “Unknown”) | |
| A2-M5 | Sign in → Dashboard | Row shows name/symbol; `metadataAttached: true` | |
| A2-M6 | Deploy **Token-2022** with metadata (control) | Still auto tx2; native metadata on mint (regression) | |

**A2 done:** A2-M1–M6 all `PASS` + `npm run test:a2:unit` green.

### Manual smoke — Mainnet (recommended before marketing legacy)

| ID | Step | Expected | Result |
|----|------|----------|--------|
| A2-P1 | One Classic SPL + metadata deploy on mainnet | Both txs succeed; ~0.03 SOL platform fee + rent | |
| A2-P2 | Phantom/Solflare shows token name | Wallet reads Metaplex metadata | |

---

## A3 — MCP `tokenStandard` branch

### Done definition (all must be true)

| # | Deliverable |
|---|-------------|
| 1 | `validateConfig` accepts optional `tokenStandard: "token-2022" \| "spl-legacy"` (default `"token-2022"`) |
| 2 | `spl-legacy` + empty modules → validates mint-level fields only (decimals range, authority pubkeys if exposed) |
| 3 | `spl-legacy` + any module id → `valid: false` + explicit error (“modules require Token-2022”) |
| 4 | `estimateCost` respects `tokenStandard` (legacy: no extension rent bump; same platform fee note) |
| 5 | MCP `server.ts` Zod schemas document `tokenStandard` on `validate_config` and `estimate_cost` |
| 6 | `list_modules` / `describe_module` unchanged for Token-2022; optional note in validate response when legacy |
| 7 | README + `apps/web/app/docs/mcp/page.tsx` mention legacy validation path |

**Explicit non-goals for A3:** MCP cannot build transactions; no Metaplex upload; no on-chain deploy via MCP.

### Automated gate (CI)

```powershell
npm run test:a3:unit
npm run test:ci
```

**`test:a3:unit` = MCP package tests including:**

| Test case | Input | Expected |
|-----------|-------|----------|
| A3-U1 | `{ tokenStandard: "token-2022", modules: [transfer-fee valid] }` | `valid: true` (unchanged) |
| A3-U2 | `{ tokenStandard: "spl-legacy", modules: [] }` | `valid: true` |
| A3-U3 | `{ tokenStandard: "spl-legacy", modules: [{ id: "transfer-fee", … }] }` | `valid: false`; error mentions Token-2022 / modules |
| A3-U4 | `{ tokenStandard: "spl-legacy", modules: [{ id: "permanent-delegate", … }] }` | `valid: false` |
| A3-U5 | `{ tokenStandard: "spl-legacy" }` on `estimateCost` | Lower rent ceiling than multi-module T22; `platformFeeSol: 0.03` |
| A3-U6 | Omitted `tokenStandard` | Same as `"token-2022"` (backward compat) |

**Pass:** all A3-U* green in `packages/mcp-server/src/__tests__/tools.test.ts`.

### Manual smoke — MCP client (required before “A3 done”)

**Setup:** Smeltr MCP registered in Cursor or Claude Desktop (`packages/mcp-server` built).

| ID | Prompt / tool call | Expected | Result |
|----|-------------------|----------|--------|
| A3-M1 | `validate_config` with `tokenStandard: "spl-legacy"`, `modules: []` | `valid: true` | |
| A3-M2 | Same with `modules: [{ id: "transfer-fee", … }]` | `valid: false`; clear legacy error | |
| A3-M3 | `validate_config` without `tokenStandard` + valid T22 modules | Unchanged behavior | |
| A3-M4 | `estimate_cost` with `tokenStandard: "spl-legacy"` | Fee 0.03 SOL; note mentions classic SPL / no extensions | |

**A3 done:** A3-M1–M4 all `PASS` + `npm run test:a3:unit` green.

---

## npm scripts (repo root)

Added for phase gates — integration tests optional / manual:

| Script | Runs |
|--------|------|
| `npm run test:a2:unit` | module-registry + tx-builder A2 unit patterns |
| `npm run test:a2:integration` | `legacyMetaplex.devnet.test.ts` (requires local validator) |
| `npm run test:a3:unit` | MCP tools legacy branch tests |

Until A2/A3 code lands, `test:a2:unit` may run only existing related tests; expand jest patterns when files are added.

---

## Sequencing

```
A2 implement → test:a2:unit → devnet A2-M* → (optional mainnet A2-P*) → mark A2 done
A3 implement → test:a3:unit → MCP A3-M* → mark A3 done
```

Do **not** mark A3 done before A2 manual smokes pass — MCP legacy validation is meaningless if deploy cannot attach Metaplex metadata.

---

## References

- [`DEPLOYMENT_TARGET.md`](DEPLOYMENT_TARGET.md) — architecture
- [`../PRODUCT_DIRECTION.md`](../PRODUCT_DIRECTION.md) — track summary
- Existing T22 integration pattern: `packages/tx-builder/src/__tests__/metadata.devnet.test.ts`
