# Beta launch checklist



**Purpose:** Close the three **beta blockers** in `corporate/engineering-roadmap.md` before heavy marketing or Product Hunt.



**Sign-off:** Operator initials + date on each row when complete.



---



## Current status (2026-07-07)



| Blocker | Status | Summary |

|---------|--------|---------|

| **1 — Dedicated mainnet RPC** | ✅ **Done** | Production RPC configured on Vercel |

| **2 — Irys sweeper cron env** | ⬜ **Open** | Confirm `CRON_SECRET` + `PLATFORM_FOUNDER_PUBKEY` + readiness probe |

| **3 — Live mainnet mint smoke** | 🟡 **Partial** | **Mainnet mint path verified** on production (tx1 + metadata checks pass). **Formal smoke not signed off** — complete rows below and record PASS. |



**To close Blocker 3:** Run through B3-6–B3-7 (SIWS + dashboard, Classic SPL regression) on **smeltr.org**, fill Result column, then mark Blocker 3 done in `corporate/engineering-roadmap.md`.



---



## Blocker 1 — Dedicated mainnet RPC ✅ DONE



Public `api.mainnet-beta.solana.com` rate-limits `getBalance` and `confirmTransaction`. Smeltr's deploy flow uses both (pre-flight balance check + tx confirmation).



| Step | Action | Result |

|------|--------|--------|

| B1-1 | Create Helius or QuickNode mainnet RPC URL | ✅ |

| B1-2 | Set `NEXT_PUBLIC_SOLANA_RPC_URL` in **Vercel → Production** (triggers redeploy — NEXT_PUBLIC_ is build-time) | ✅ |

| B1-3 | Optionally set `PLATFORM_RPC_URL` (same or restricted key) for server ops / sweeper | |

| B1-4 | Redeploy production; confirm site loads (not "Network not configured" guard) | ✅ |

| B1-5 | Header network badge shows **Mainnet** with your RPC host (hover tooltip) | ✅ |



**Signed off:** 2026-07-07



**Automated check (production):**



```powershell

$env:CRON_SECRET = "<your-vercel-cron-secret>"

curl -H "Authorization: Bearer $env:CRON_SECRET" https://smeltr.org/api/ops/readiness

```



Expect `"rpc": { "automatedReady": true, "reachable": true, ... }`.



---



## Blocker 2 — Irys sweeper cron env ⬜ OPEN



Daily cron: `vercel.json` → `GET /api/ops/sweep-irys` at 00:00 UTC.



| Step | Action | Result |

|------|--------|--------|

| B2-1 | Generate random `CRON_SECRET` (32+ bytes); set in Vercel **Production** | |

| B2-2 | Set `PLATFORM_FOUNDER_PUBKEY` (sole sweep destination — your Founder wallet) | |

| B2-3 | Confirm `PLATFORM_IRYS_PRIVATE_KEY` is set (hot upload wallet) | |

| B2-4 | Redeploy | |

| B2-5 | Call `/api/ops/readiness` — `"sweeper": { "automatedReady": true }` | |

| B2-6 | Optional dry-run: trigger cron manually in Vercel dashboard; check logs for 200 (sweep or "below threshold") | |



**Invariant:** Sweeper only transfers to `PLATFORM_FOUNDER_PUBKEY` — hard-coded in route, never from request input.



---



## Blocker 3 — Live mainnet mint smoke test 🟡 PARTIAL



Re-verify the full deploy path after adapter / auto-metadata changes. **Real SOL** (~0.03 platform fee + rent).



**Already verified (operator, 2026-07-07):** Production mainnet Token-2022 mint — deploy path and on-chain checks pass. Not yet a full documented smoke run.



| Step | Action | Expected | Result |

|------|--------|----------|--------|

| B3-1 | Deploy on **smeltr.org** with mainnet wallet (or `npm run smoke:mainnet` locally) | | 🟡 mint verified; formal run not recorded |

| B3-2 | Connect wallet on **Mainnet** with ≥ 0.05 SOL | | ✅ (implied by mint pass) |

| B3-3 | **Token-2022:** name/symbol/logo → Review → Sign tx1 | Mint succeeds | ✅ |

| B3-4 | Auto tx2 (or "Add Metadata" if auto skipped) | Metadata attached; success screen | ✅ |

| B3-5 | Explorer shows token name (not Unknown) | | ✅ |

| B3-6 | SIWS sign-in → Dashboard row with `metadataAttached: true` | | ⬜ |

| B3-7 | **Classic SPL (regression):** Metaplex metadata, both txs | Both txs succeed | ⬜ |



**To close:** Complete B3-6 and B3-7 on production, add initials/date on this table, update roadmap Blocker 3 → ✅.



---



## Quick reference — Vercel Production env vars



| Variable | Required for beta | Notes |

|----------|-------------------|-------|

| `NEXT_PUBLIC_SOLANA_RPC_URL` | ✅ | Mainnet Helius/QuickNode — **not** public solana.com |

| `CRON_SECRET` | ✅ | Bearer token for cron + `/api/ops/readiness` |

| `PLATFORM_FOUNDER_PUBKEY` | ✅ | Sweeper destination |

| `PLATFORM_IRYS_PRIVATE_KEY` | ✅ | Hot Irys wallet |

| `NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST` | ✅ | Build-time; redeploy after change |

| `NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT` | ✅ | Protocol fee (0.03 SOL) |

| `DATABASE_URL` | ✅ | Postgres |

| `SESSION_JWT_SECRET` | ✅ | SIWS sessions |



See `.env.example` for full list.



---



## When all blockers pass



Update `corporate/engineering-roadmap.md` § "Blocking a clean beta launch" — all three rows ✅ with date.



Then proceed to Phase 1 monetization (Stripe, Smeltr+ gate) per roadmap.


