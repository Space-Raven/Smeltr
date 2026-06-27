# Smeltr — Project Ideas Backlog

Status key: `[BACKLOG]` `[EXPLORE]` `[POST-ALPHA]` `[PARKED]`

---

## PjorgJam `[BACKLOG]`
**DeFi Music & Art Distribution Platform**

Decentralized alternative to Bandcamp/streaming for musicians and artists. Users purchase tokens that represent ownership of albums, art projects, or other media — and can resell those tokens on secondary markets while the original creator receives a cut of every transaction via the Token-2022 transfer-fee extension.

**Philosophy:** Strongly oppose traditional DRM, which has primarily benefited corporate interests over artists. The piracy deterrent is market-based: if infinite free copies exist, the token loses resale value — so holders are incentivized to protect scarcity. Token utility can be stacked beyond the underlying media (exclusive ticket access, early drops, community membership) to add value that free copies can't replicate.

**Differentiator:** Sound.xyz / Royal proved dedicated fanbases will use wallets. Bandcamp's collapse under Songtradr left an aggrieved artist community actively seeking alternatives. Transfer-fee extension is purpose-built for this use case.

**Open question:** DRM vs. "ownership as patronage with resale upside" — lean into the latter.

**Cold start problem:** Talent recruitment with existing followings is the primary challenge.

---

## Alloy `[EXPLORE]`
**Token-Gated API Access Tiers for Developers**


Developers mint tiered access tokens (free / pro / enterprise) for their own APIs or tools using Smeltr. Alloy provides a lightweight TypeScript SDK (`@smeltr/alloy` or `@alloy/verify`) that any backend can drop in to check token ownership against a connected wallet.

Transfer-fee extension means the original developer earns royalties on resale of pro licenses. Every developer who ships with Alloy becomes a Smeltr distribution channel — network effect.

**Fits:** Platform's "neutral infrastructure" philosophy. B2B, low legal risk.

**Next step:** Needs deeper exploration — architecture, SDK design, pricing model.

---

## Pjorg Quest `[BACKLOG]`
**NFT-Gated Showcase Game**

Simple browser game gating access behind ownership of a non-transferable Smeltr token. Showcase vehicle for the platform's non-transferable extension and a tangible end-user demo.

**Stack:** Phaser / Three.js (web-based — removes wallet friction, Phantom injects directly into browser).

**Asset pipeline:** ComfyUI workflow already in place for 2D concept art and UI assets.

**Note:** Keep scope small — this is a showcase, not a shipping game product.

---

## Booknook `[BACKLOG]`
**On-Chain Commitment & Accountability Bonds**

Users lock tokens against a stated goal with a peer-designated arbiter. If the goal is met by the agreed deadline, tokens return to the owner. If not, tokens burn (not transfer to another party — this keeps it out of gambling law territory and eliminates financial incentive for bad-faith arbitration).

**Legal basis:** Burn-on-failure model mirrors stickK.com, which has operated since 2008 without regulatory issues. Further configurations (tokens to charity, to arbiter, etc.) deferred until post-legal-review.

**Tech:** Permanent-delegate extension for settlement. Optional oracle integration for objective/date-based resolution. Peer-designated arbiter maps cleanly onto existing Solana program patterns.

**Investor angle:** "Programmable accountability, non-custodial, zero platform cut" — strong narrative.

**Status:** Most technically interesting project on the list. Legal-safe version is buildable now; expanded configurations require legal review first.

---

## Pjorg Championships `[ACTIVE]`
**"Pjorg the Game" — not "Pjorg the Cat"**

Pjorg is a traditional Swedish drinking game. Full codification of rules, lore, and tournament structure is in progress — see `PJORG.md` (internal only).

**Client-facing description:** *"Players solve cryptic riddles to find hidden coins before the stroke of midnight."*

**Strategy:** All Smeltr/platform mentions of Pjorg are completely sincere at all times. The game's history and culture speak for themselves.

**Planned:**
- Host the first American Pjorg Championships as a brand/buzz play
- Token-based entry fee, commemorative non-transferable winner token
- Stream the event for community building
- On-chain token riddles or puzzle mechanics integrated into gameplay (revisit after ruleset is codified)

**Publicity angle:** Whimsical, distinctive, deeply committed — speaks to the current cultural moment. Strong potential for organic reach.

---

## Mascot / LoRA Training `[POST-ALPHA]`
**pjorg cat character + ComfyUI pipeline**

Scripts built and saved in `comfyui/`. Full pipeline (generate → filter → organize → train) is in place. Parked until post-alpha.

- `comfyui/generate_training_images.py` — ComfyUI API batch generator
- `comfyui/filter_training_images.py` — Claude vision quality filter  
- `comfyui/pipeline.py` — end-to-end orchestrator
- `comfyui/pjorg-txt2img-workflow.json` — manual ComfyUI workflow
