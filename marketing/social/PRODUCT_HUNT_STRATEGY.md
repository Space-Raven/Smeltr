# Smeltr — Product Hunt Launch Strategy

**Last updated:** July 2026  
**Website:** https://smeltr.org  
**Profile photo:** `apps/web/public/profile-photo.png` — export from `brand/source/mark.svg`  
**Workflow:** `brand/README.md` · **Check masters:** `cd apps/web && npm run brand:check`

---

## Positioning (read this first)

Product Hunt rewards **tools that solve a clear problem for makers**. Smeltr wins as:

> **Non-custodial Token-2022 deployment infrastructure for Solana** — composable extension modules, schema-validated configs, your wallet signs everything.

**Lead with:** developer infrastructure, inspectable non-custodial guarantee, Token-2022 correctness.  
**Do not lead with:** token launching as investment, price, memecoins, or “get rich.”

**Differentiators to hammer:**
1. Runtime denylist — platform keys **throw** in authority slots (not policy prose)
2. Real Token-2022 module compatibility engine (same code as MCP + deploy UI)
3. Correct two-transaction metadata pattern (overfund mint, no broken reallocate)
4. MCP server — AI assistants can validate configs before deploy (`/docs/mcp`)

**Beta constraints (be honest on PH):**
- Smeltr+ subscriptions **not open** — all modules free during beta
- Real mainnet deploys — wallet signs, permanent on-chain

---

## Profile & gallery assets

### Profile photo (required)

| Platform | Spec | File |
|----------|------|------|
| Product Hunt | 240×240 min, square | `profile-photo.png` |
| X / Twitter | 400×400, displays as circle | same |
| Discord | 512×512 recommended | `profile-icon.png` |

**Use the icon-only mark** (ribbed amber S + sparks on dark brown) — **not** the horizontal banner wordmark. Text is illegible at avatar size.

Regenerate after SVG edits:
```bash
cd apps/web && npm run brand:export
```

Source: `public/profile-icon.svg` — matches `smeltr-banner.jpg` forge metaphor (software smelting, not extract/cannabis).

### Gallery (5 images — PH converts better with screenshots)

| # | Asset | Caption |
|---|-------|---------|
| 1 | `og-image.png` | Deploy Token-2022 tokens without writing code |
| 2 | Deploy flow screenshot | Compose modules → validate → review → sign |
| 3 | Module picker | Transfer fee, soulbound, permanent delegate — compatibility checked |
| 4 | Review panel | See every instruction and authority before you sign |
| 5 | MCP / docs | Validate configs in Claude or Cursor via Smeltr MCP |

**Capture screenshots at 1270×760** (PH gallery sweet spot). Use mainnet or clearly labeled beta UI.

---

## Submission copy (updated)

**Name:** Smeltr

**Tagline (≤60 chars):**
```
Non-custodial Token-2022 launcher for Solana
```

**Topics:** Developer Tools, Web3, Open Source, Artificial Intelligence, Productivity

**Description (≤500 chars):**
```
Deploy Solana Token-2022 tokens without writing code — and without surrendering your mint authority.

Pick composable extension modules (transfer fees, soulbound locks, permanent delegate). Smeltr validates compatibility, builds correctly ordered transactions, and throws if any platform address appears in an authority field.

Your wallet signs every step. No account required. Open source.

Includes an MCP server so AI assistants can validate Token-2022 configs before you deploy.
```

---

## Maker's first comment (post within 5 minutes of going live)

```
Hey Product Hunt 👋 — I'm [NAME], builder of Smeltr.

The problem: deploying Token-2022 with extensions means getting instruction order, rent sizing, and metadata attachment right — or burning SOL on failed txs. Most launchers also can't prove they won't touch your mint authority.

Smeltr is non-custodial infrastructure:
• Composable modules (transfer fee, non-transferable, permanent delegate)
• Real compatibility validation before you sign
• assertNoPlatformAuthority() on every authority field — inspectable in our GitHub
• MCP server for Claude/Cursor — validate configs via AI before going on-chain

Public beta on mainnet. Smeltr+ paid tier isn't open yet — everything is free to try.

Happy to go deep on Token-2022 mechanics, metadata sizing, or the non-custodial architecture. Ask anything.
```

---

## Timeline

### T−7 to T−3 days
- [ ] Create PH maker account; complete profile with `profile-photo.png`
- [ ] Schedule launch **Tuesday 12:01 AM Pacific** (PH day resets midnight PT; Tue–Thu outperform Mon/Fri)
- [ ] Prep 5 gallery screenshots; upload draft if PH allows
- [ ] Line up 15–25 genuine supporters (Solana devs, beta users) — **they must open producthunt.com and search Smeltr**, not only click a direct link (PH discount suspicious traffic)
- [ ] Draft launch tweet + Discord posts; do **not** post PH link before go-live

### T−1 day
- [ ] Confirm `SITE_MODE=live` on smeltr.org before PH launch
- [ ] Smoke-test deploy flow on mainnet
- [ ] Pin GitHub README MCP section
- [ ] Publish `@smeltr/mcp-server` to npm if not done (PH dev audience will try it)

### Launch day (hour by hour)

| Time (PT) | Action |
|-----------|--------|
| 12:01 AM | Submit / confirm live on PH; post maker comment immediately |
| 12:05 AM | Tweet from @Smeltr_App with PH link + one-liner |
| 12:15 AM | Solana Discord / developer communities (value-first, not spam) |
| 8:00 AM | Second visibility wave — quote-tweet with screenshot |
| All day | Reply to **every** PH comment within 30 min |
| 6:00 PM | “Day 1” update tweet — honest stats, thank supporters |
| 11:00 PM | Final push tweet to US evening audience |

### T+1 to T+7
- [ ] Follow up with commenters; collect feedback into GitHub issues
- [ ] Post “what we learned” thread (builds trust, not hype)
- [ ] Submit sitemap in Google Search Console if not done

---

## What works / what fails on PH

| Works | Fails |
|-------|-------|
| Technical depth in comments | “Best token launcher” / price talk |
| Open-source + link to denylist code | Astroturfed upvote brigades |
| MCP angle for AI/dev crowd | Promising guaranteed outcomes |
| Honest beta disclaimer | Hiding that deploys are real mainnet |
| Screenshots of review/sign flow | Stock photos or AI brand imagery |

---

## Hunter strategy (optional but valuable)

A credible **hunter** with PH following can 2–3× visibility. Ideal profile:
- Solana/Web3 developer advocate (not crypto influencer)
- Has hunted dev tools before

Pitch: *“Open-source non-custodial Token-2022 infra — runtime authority denylist, MCP for AI validation.”*

If self-launching, that's fine — maker launches are common; compensate with stronger gallery + comment engagement.

---

## Cross-post sequence (launch day)

1. **X** — hook + PH link + screenshot
2. **Reddit** — r/solana, r/soldev (follow sub rules; technical post, not shill) — see `reddit-posts.md`
3. **Discord** — Solana project channels — see `discord-kit.md`
4. **Hacker News** — optional “Show HN: Smeltr – non-custodial Token-2022 deployer” — **different audience**, post 2–3 hours after PH to avoid splitting morning attention

---

## Metrics to track

- PH upvotes + comment count (goal: top 5 of day = strong; top 10 = solid for niche dev tool)
- smeltr.org/deploy sessions (referrer: producthunt.com)
- GitHub stars + MCP npm downloads
- SIWS sign-ins / deployments indexed (dashboard)

---

## Related files

- `marketing/social/product-hunt-kit.md` — short-form copy snippets
- `marketing/social/twitter-pack.md` — launch tweets
- `docs/MCP_LAUNCH.md` — npm + registry publish
- `apps/web/public/profile-icon.svg` — avatar source of truth
