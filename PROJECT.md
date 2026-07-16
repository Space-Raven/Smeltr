# Smeltr Token Platform

**Company:** Smeltr Technologies LLC  
**This repo / smeltr.org:** Token Platform product only (not the whole company portfolio)  
**Status:** public-beta (mainnet deploy at [smeltr.org](https://smeltr.org))  
**Last updated:** 2026-07-05

**THE RULES (master):** `~/Desktop/smeltr_tech/prototypes/agent-ops/` — sync daily or when operator asks.

## Source of truth (read first)

| Repo | Role | Action |
|------|------|--------|
| **`Token-Platform-Merged`** (this repo) | **Canonical** — public beta @ smeltr.org | **Work here** |
| `C:\Users\joshk\Unnamed Crypto Project` | Older MVP snapshot (~June 2026); broken build, Mocha/Jest mix, duplicate `/src` | **Archive / comparison only** — do not revive unless operator explicitly overrides |

**Operator decision (2026-07-05):** All engineering proceeds in **Token-Platform-Merged**. Do not run “repo recovery” phases 1–6 against Unnamed Crypto Project — that work is already done or superseded here.

If an agent proposes stabilizing Unnamed Crypto Project, redirect to this repo and [`docs/PRODUCT_DIRECTION.md`](docs/PRODUCT_DIRECTION.md) tracks A–C.

## What this is

Non-custodial infrastructure for deploying Solana tokens (Token-2022 today; classic SPL in progress). Users connect a wallet and sign transactions; Smeltr never holds mint authority or user keys. Public beta on mainnet.

## Active work (2026 H2)

| Track | Summary | Doc |
|-------|---------|-----|
| **Legacy SPL** | Classic SPL mint path; Metaplex metadata next | [`docs/PRODUCT_DIRECTION.md`](docs/PRODUCT_DIRECTION.md) |
| **Multi-chain** | ChainAdapter → EVM spike | Same + `CLAUDE.md` |
| **UI + brand** | Forge shell from `brand/` masters | [`docs/ui-overhaul/README.md`](docs/ui-overhaul/README.md) |

Full sequencing: `corporate/engineering-roadmap.md` *(local only)*.

## Where to find things

| I need… | Go to… |
|---------|--------|
| **Brand / logos / export sizes** | [`brand/README.md`](brand/README.md) → [`brand/SPECS.md`](brand/SPECS.md) |
| **Social / marketing copy** | [`marketing/social/solo-founder-pack.md`](marketing/social/solo-founder-pack.md) |
| **Engineering roadmap** | `corporate/engineering-roadmap.md` *(local only — not in git)* |
| **Agent / architecture context** | [`CLAUDE.md`](CLAUDE.md) |
| **Developer setup** | [`README.md`](README.md) |
| **Active audits** | [`docs/audits/`](docs/audits/) — `Agent(job)-auditN-TokenPlatform.md` |
| **Architecture (deploy targets)** | [`docs/architecture/DEPLOYMENT_TARGET.md`](docs/architecture/DEPLOYMENT_TARGET.md) |
| **A2 / A3 smoke gates** | [`docs/architecture/SMOKE_TESTS_A2_A3.md`](docs/architecture/SMOKE_TESTS_A2_A3.md) |
| **Product direction (tracks A–C)** | [`docs/PRODUCT_DIRECTION.md`](docs/PRODUCT_DIRECTION.md) |
| **UI overhaul plan** | [`docs/ui-overhaul/README.md`](docs/ui-overhaul/README.md) |
| **MCP launch notes** | [`docs/MCP_LAUNCH.md`](docs/MCP_LAUNCH.md) |
| **Contact** | pjorg@smeltr.org |

## Recent audit history (resolved)

| Date | Audit id | Scope | Outcome |
|------|----------|-------|---------|
| *(none archived yet)* | | | |

Completed audits are summarized here then removed from `docs/audits/`.

## Notes

- Smeltr+ / Stripe premium tier is built but needs production env keys to activate.
- Internal strategy docs live under `corporate/` — do not commit or push that folder.
