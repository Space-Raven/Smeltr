# Smeltr — Session Context Handoff

Paste this at the start of a new Claude Code session to resume work on this project.

---

## Project Identity

**Name:** Smeltr (previously unnamed; renamed this session from "Mintforge" → "Smeltr")  
**Repo:** `Token-Platform-Merged/`  
**Description:** Non-custodial Solana Token-2022 deployment platform. Users pick extension modules, upload metadata to Arweave, and sign two wallet transactions. Platform never holds mint authority.  
**Stack:** Next.js 14, TypeScript, Tailwind CSS 3, Prisma, @solana/spl-token (Token-2022), @solana/wallet-adapter-react, Irys/Arweave for metadata, SIWS auth, jose JWT, Zod.

---

## What Was Done This Session

### 1. Graphic design assets (all in `apps/web/public/`)
- `logo.svg` — coin + mint leaf wordmark
- `logo-mark.svg` — icon only (coin with leaf sprouting)
- `favicon.svg` — 32px favicon
- `og-image.svg` — 1200×630 OpenGraph/Twitter card image
- `icons/module-transfer-fee.svg` — indigo coin stack with % arrow
- `icons/module-non-transferable.svg` — orange shield + lock
- `icons/module-permanent-delegate.svg` — red crown + key
- `test-tokens/` — 15 token icons: LUNA, EMBER, VOID, REEF, PEAK, GLYPH, PULSE, DRIFT, FORGE, NOVA, JADE, FLUX, DUSK, ATOM, ZEST
- `test-tokens/gallery.html` — browsable gallery (open in browser directly)

### 2. App infrastructure created (previously missing)
- `app/globals.css` — full Tailwind base + component classes (`btn-primary`, `card`, `input`, `badge`, `alert-*`, `module-card`, `address`, etc.) + wallet adapter overrides
- `app/layout.tsx` — sticky header with nav (Deploy / Dashboard / Blog / GitHub), 4-column footer with social links, full OG/Twitter meta tags, JSON-LD structured data, Inter font
- `app/page.tsx` — landing page with hero, module showcase cards, how-it-works steps, CTA strip
- `tailwind.config.js` — brand colours, Inter font, custom animations
- `postcss.config.js` — Tailwind + autoprefixer
- `next.config.js` — transpilePackages for monorepo, Arweave/Irys image domains
- `public/sitemap.xml`, `public/robots.txt`, `public/manifest.json`

**IMPORTANT:** Tailwind, autoprefixer, postcss were added to `devDependencies` in `package.json` but `npm install` has NOT been run yet (sandbox network restrictions). Run `cd apps/web && npm install` before `npm run dev`.

### 3. Blog routes (in `apps/web/app/blog/`)
- `page.tsx` — blog index
- `how-to-deploy-solana-token-2022-transfer-fee/page.tsx`
- `solana-soulbound-token-non-transferable-extension/page.tsx`
- `permanent-delegate-token-2022-explained/page.tsx`

### 4. Documents produced (repo root)
- `Smeltr-Whitepaper.docx` — 9-section technical whitepaper with layman callouts
- `Smeltr-Presenter-Briefing.docx` — one-liner, Q&A, narrative arc, module cheat sheet
- `Smeltr-Monetization-Strategy.docx` — 8 revenue models with pros/cons, recommended phasing
- `Smeltr-Marketing-Strategy.docx` — GTM strategy, channels, KPIs, content calendar

### 5. Marketing assets (in `marketing/`)
- `social/twitter-pack.md` — 10-tweet launch thread + 5 evergreen + reply templates
- `social/product-hunt-kit.md` — tagline, description, maker comment, launch checklist
- `social/reddit-posts.md` — r/solana + r/solanadev launch posts + T+7 follow-up
- `social/discord-kit.md` — full server structure, pinned messages, outreach scripts
- `social/newsletter-pitch.md` — two pitch templates (dev-focused + general web3)
- `email/launch-announcement.html` — HTML launch email
- `email/onboarding.html` — post-deployment confirmation email

---

## Current State of the Codebase

### What exists and is functional
- `packages/module-registry/` — Transfer Fee, Non-Transferable, Permanent Delegate modules with Zod schemas, `assertNoPlatformAuthority()`, `validateModuleSelection()`, `ExtensionCollisionError`
- `packages/tx-builder/` — `buildMintInstructions()` (correct 4-step instruction order), `buildMetadataAttachmentInstructions()` (correct overfunding pattern — no reallocate)
- `apps/web/hooks/useTokenDeployment.ts` — prepare/review/confirm/attachMetadata state machine
- `apps/web/hooks/useSiwsAuth.ts` — SIWS sign-in flow
- `apps/web/hooks/useIrysUpload.ts` — Arweave upload via Irys (NOT smoke-tested yet)
- `apps/web/app/deploy/page.tsx` — full deploy flow UI
- `apps/web/app/dashboard/page.tsx` — deployment history, resume metadata attachment
- `apps/web/app/api/auth/` — nonce + verify SIWS endpoints
- `apps/web/app/api/deployments/` — GET/POST/PATCH deployment records
- `apps/web/lib/submitTransaction.ts` — 1232-byte size guard before sign/submit
- `apps/web/lib/risk.ts` — HIGH_IMPACT_MODULES, HIGH_IMPACT_MODULE_WARNINGS
- `apps/web/prisma/schema.prisma` — AuthNonce, Deployment, Subscription models

### Known gaps / immediate priorities
1. **Run `npm install`** in `apps/web/` (Tailwind not installed)
2. **Smoke-test Irys upload** on devnet — method names (getPrice, getBalance, fund, uploadData) are Bundlr-era and unverified against installed @irys/web-upload package
3. **Populate `PLATFORM_AUTHORITY_DENYLIST`** from env config — production blocker; without this the authority guard is inactive
4. **Run devnet integration test** — `packages/tx-builder/src/__tests__/metadata.devnet.test.ts` requires `solana-test-validator` running locally with `--runInBand`
5. **Stripe integration** — checkout session endpoint, webhook handler (must verify signatures), gated platform-funded upload endpoint; `Subscription` model exists in schema, SIWS auth is built as prereq

### Architecture invariants — do not break these
- **Two-transaction pattern is permanent** — tx 1 creates mint + overfunds for metadata space; tx 2 calls `InitializeTokenMetadata` only. No `createReallocateInstruction`, no extra lamport transfer in tx 2.
- **Instruction order in tx 1 is load-bearing:** `CreateAccount` → module inits → `InitializeMetadataPointer` → `InitializeMint`
- **`assertNoPlatformAuthority()` is called before every instruction build** — never remove or bypass
- **Wallet address in deployment records comes from SIWS session**, never request body
- **PATCH /api/deployments returns 404 (not 403)** on ownership mismatch — intentional

---

## Monetization Roadmap (decided this session)

**Phase 1 — immediate:** 0.02 SOL deployment fee (SystemProgram.transfer in tx 1) + free templates  
**Phase 2 — weeks 2–4:** Premium subscription via Stripe ($12/mo Builder, $49/mo Studio) — platform-funded Irys uploads as key perk; infrastructure already scaffolded  
**Phase 3 — month 2–3:** API-as-a-service (tx-builder as hosted REST API, metered billing) + branded token pages  
**Phase 4 — deferred:** Module marketplace + white-label licensing  

---

## Social / Marketing Handles (placeholders — update before launch)
- Twitter: `@smeltrapp`
- Discord invite: `discord.gg/smeltr`
- GitHub: `github.com/smeltrapp`
- Domain: `smeltr.org` (production at https://www.smeltr.org)
