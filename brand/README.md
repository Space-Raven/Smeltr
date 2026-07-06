# Smeltr brand assets — workflow

**Problem with the old approach:** Profile photos were cropped from a horizontal banner, OG cards were coded as generic text layouts, and `logo-mark.svg` still says "Minty." Each format needs its **own composition** — you cannot crop or auto-generate your way to good social assets.

**Principle:** Design in Figma → export masters → rasterize with `npm run brand:export`. No AI image generation for brand. No cropping one asset to fake another.

**Start here:** [`FIGMA-DIY.md`](./FIGMA-DIY.md) — step-by-step using your geometric S sketch.

**Shape reference:** `brand/source/master/s-mark-filled.png` — **canonical coin mark** (Figma export)

Legacy: `brand/reference/sketch-s.jpg` (hand sketch only, not for mocks)

---

## Pipeline (the workflow)

```
┌─────────────────────────────────────────────────────────────┐
│  1. COMPOSE — Figma (Smeltr Brand file)                      │
│     One frame per deliverable, designed for that aspect     │
│     ratio and viewing size.                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ Export SVG or PNG @2x
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. MASTER — brand/source/*.svg (or .png for photo refs)    │
│     Version-controlled source of truth. Edit here, not in     │
│     apps/web/public/.                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ npm run brand:export
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. DEPLOY — apps/web/public/*.png                          │
│     Generated outputs for Next.js, PH, X, Discord.          │
│     Safe to regenerate; never hand-edit PNGs in public/.    │
└─────────────────────────────────────────────────────────────┘
```

---

## Figma file structure (create this once)

Create a free Figma file: **Smeltr Brand** with these frames:

| Frame name | Size | Purpose |
|------------|------|---------|
| `mark/square` | 512×512 | Profile photo, Discord icon, favicon base |
| `mark/wordmark-horizontal` | 1600×400 | Twitter header, email sig, wide banners |
| `social/og` | 1200×630 | Link previews (X, Discord, PH gallery hero) |
| `social/ph-gallery` | 1270×760 | Product Hunt screenshot slots (×4) |
| `app/favicon` | 32×32 | Browser tab (export SVG) |

**Safe zones:** For `mark/square`, keep the ribbed S + sparks inside a **380×380 center circle** — X and Discord crop to circle and will clip corners.

**Brand tokens** (add as Figma styles):

| Token | Hex | Use |
|-------|-----|-----|
| Forge bg | `#1A0C05` | Backgrounds |
| Forge mid | `#2D1507` | Gradients |
| Amber primary | `#F59E0B` | Accent, sparks |
| Amber deep | `#92400E` | S ribbing shadows |
| Cream text | `#FEF3C7` | Wordmark on dark |

Reference: `brand/source/master/s-mark-filled.png` (canonical coin mark).

---

## Canonical mark: `s-mark-filled`

**Source of truth:** Figma component built from `s-mark-filled` — one master **S + ring + sparks** group, reused across frames.

**Status:** Direction approved; **tweaks pending** before replacing `brand/source/*.svg`.

### Tweak checklist (before export to source/)

| Item | Notes |
|------|--------|
| S silhouette | Must read as **S** at 32×32, not 8 or 0 |
| Ring weight | Coin border vs inner circle — match token mockups |
| Spark count/placement | 3–5 max; top-right of S curve |
| Gradient | Orange coin fill vs dark-forge variants per asset |
| Outlined vs filled S | Figma export uses outline; confirm for favicon simplification |

### Where `s-mark-filled` propagates

```
Figma: mark/coin (512×512)  ← s-mark-filled master component
         │
         ├── mark/square (512)     → brand/source/mark.svg        → profile-photo, profile-icon, Discord/X avatar
         ├── mark/token (512)      → brand/source/token-logo.svg  → token-logo.png, deploy UI samples
         ├── app/favicon (32)      → brand/source/favicon.svg     → browser tab (simplified, no sparks)
         ├── app/header (32h SVG)  → brand/source/logo-mark.svg   → smeltr.org nav
         ├── mark/wordmark-h       → brand/source/logo.svg        → S + divider + Smeltr
         └── social/og (1200×630)  → brand/source/og.svg          → og-image.png, PH hero
```

**Rule:** Edit the **Figma component once** → re-export all dependent frames → `npm run brand:export`. Do not tweak PNGs in `public/` or one SVG in isolation.

---

## What makes each asset good

### Profile (`mark/square`) — currently weak

**Why banner crop failed:** Horizontal logo composition ≠ square avatar. Divider, wordmark bleed, and off-center S read awkward at 48px.

**What good looks like:**
- Icon **only** (no wordmark)
- Ribbed amber S centered, sparks at top-right of S curve
- Dark forge background fills the square
- Reads clearly at **32×32** (favicon test)

### OG hero (`social/og`) — fine, not distinctive

**Why it's bland:** Text-heavy card layout — could be any SaaS. No distinctive mark artwork; generic pills.

**Upgrade path (one Figma session):**
- Left 40%: large ribbed S mark (same as profile, bigger)
- Right: Smeltr wordmark + one-line tagline (max 8 words)
- Drop the three module pills OR replace with a single subtle forge grid
- Less copy = more memorable at thumbnail size

### Horizontal banner (`mark/wordmark-horizontal`)

Use for PH header, GitHub social preview, email — **not** as a crop source for profile.

---

## Repo commands

```bash
# After updating files in brand/source/
cd apps/web && npm run brand:export

# Export only OG or only profile
npm run brand:export -- og
npm run brand:export -- profile
```

**Validate before commit:**
```bash
npm run brand:check   # verifies masters exist + exports succeed
```

---

## File map

| Master (`brand/source/`) | Generated (`apps/web/public/`) |
|--------------------------|--------------------------------|
| `mark.svg` | `profile-icon.png` (512), `profile-photo.png` (400) |
| `og.svg` | `og-image.png` (1200×630) |
| `favicon.svg` | `favicon.svg` (copied as-is) |
| `logo.svg` | `logo.svg` |
| `logo-mark.svg` | `logo-mark.svg` |

See `brand/SPECS.md` for dimensions and platform mapping.

---

## Legacy debt (fix in Figma, export to source/)

These files in `apps/web/public/` are **still Minty** (indigo coin + leaf) and don't match the forge banner:

- `logo-mark.svg`
- `logo.svg`
- `favicon.svg`

Replace all three from the same Figma `mark/square` frame for consistency.

---

## What NOT to do

| Don't | Do instead |
|-------|------------|
| AI-generate brand images | Figma + export |
| Crop banner → profile | Design `mark/square` frame |
| Edit PNGs in `public/` directly | Edit `brand/source/`, re-export |
| Hand-code OG layout in SVG long-term | Figma compose → export `og.svg` |
| Use "smelt/extract" imagery | Forge/metal metaphor only (software smelting) |

---

## Optional: professional polish

If the Figma pass still isn't "write home about" level:

1. **Brief a designer for 2–3 hours** — give them `brand/reference/smeltr-banner.jpg` + `brand/SPECS.md` + link to smeltr.org
2. Deliverables: Figma file + exported SVGs dropped into `brand/source/`
3. Budget alternative: refine in Figma yourself using the ribbed S from banner as traced vector

---

## Related docs

- `brand/SPECS.md` — pixel specs per platform
- `marketing/social/PRODUCT_HUNT_STRATEGY.md` — launch asset checklist
- `docs/MCP_LAUNCH.md` — npm/registry (separate from visual brand)
