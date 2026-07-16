# Figma DIY — Smeltr brand (start here)

Your sketch (`brand/reference/sketch-s.jpg`) is the **shape reference** for the geometric S.  
Vector starters are already in `brand/source/` — import them into Figma and refine.

---

## Step 0 — Open Figma (free)

1. Go to [figma.com](https://figma.com) → **New design file**
2. Name it **Smeltr Brand**
3. Create a page: **01 — Foundations**

---

## Step 1 — Import references

Drag into Figma:

| File | Purpose |
|------|---------|
| `brand/reference/sketch-s.jpg` | Your pen sketch — trace this |
| `brand/source/s-mark-core.svg` | Bare S path (100×100) |
| `brand/source/mark.svg` | Full profile mark draft |
| `brand/source/token-logo.svg` | Coin / token variant draft |

Lock the sketch layer at **40% opacity**. Work on layers above it.

---

## Step 2 — Set up color styles

In Figma → **Local styles** → create these fills:

| Style name | Hex |
|------------|-----|
| `forge/bg` | `#1A0C05` |
| `forge/mid` | `#2D1507` |
| `amber/primary` | `#F59E0B` |
| `amber/light` | `#FBBF24` |
| `amber/deep` | `#92400E` |
| `cream/text` | `#FEF3C7` |

---

## Step 3 — Trace the geometric S

### Option A — Edit the imported SVG (fastest)

1. Import `s-mark-core.svg`
2. Ungroup → select the path
3. Compare to sketch — adjust anchor points until the **outer silhouette** matches your drawing
4. The sketch uses interlocking vertical bars; the SVG uses one filled outline so it reads at **32px** (favicon test)

### Option B — Pen tool from scratch

1. Place sketch at 40% opacity
2. Use **Pen (P)** to trace the **outer edge only** (not every inner line)
3. Target symmetry: the S should look identical flipped vertically at the waist (y ≈ 45 in 100-unit space)
4. Key points from sketch:
   - Top bar spans wide
   - Pinches at center (50, 45)
   - Bottom bar mirrors top

**Favicon test:** Duplicate your path → scale to 32×32 frame → must still read as **S**, not 8 or 5.

---

## Step 4 — Add forge texture (ribs)

1. Draw horizontal lines across the S shape (7px spacing)
2. Select S path + lines → **Flatten** or use lines as mask
3. Clip ribs inside S: select ribs → **Use as mask** with S shape on top
4. Rib color: `#92400E` at 45–50% opacity over amber gradient fill

Or: keep ribs as a separate layer group masked by the S — easier to tweak in Figma.

---

## Step 5 — Build frames (pages 02–04)

### Page 02 — Marks

| Frame | Size | Contents |
|-------|------|----------|
| `mark/square` | 512×512 | S + ribs + 2–3 sparks, forge bg, **no wordmark** |
| `mark/token` | 512×512 | S inside coin ring (see `token-logo.svg`) |
| `app/favicon` | 32×32 | S only, no sparks, high contrast |

Draw a **380×380 circle guide** on `mark/square` — X/Discord crop to circle.

### Page 03 — Wordmark

| Frame | Size | Contents |
|-------|------|----------|
| `mark/wordmark-h` | 1600×400 | S + vertical divider + "Smeltr" cream text |

Reference old banner: `brand/reference/smeltr-banner.jpg` for spacing — but use **new geometric S**, not the old ribbed curve.

### Page 04 — Social

| Frame | Size | Contents |
|-------|------|----------|
| `social/og` | 1200×630 | Large S left, wordmark + one tagline right |
| `social/ph-1` … `ph-4` | 1270×760 | App screenshots (not illustrations) |

---

## Step 6 — Sparks (forge accent)

On `mark/square` and `token`:

- 2–3 circles, amber `#FBBF24` → `#FDE68A`
- Place at **upper-right of top S bar** (where heat would fly off metal)
- Add blur: Figma effect **Layer blur 6–10** for glow
- **Omit sparks on favicon** (32px)

---

## Step 7 — Export back to repo

When a frame is approved:

1. Select frame → **Export** → SVG
2. Save to `brand/source/`:

| Frame | File |
|-------|------|
| `mark/square` | `mark.svg` |
| `mark/token` | `token-logo.svg` |
| `mark/wordmark-h` | `logo.svg` |
| `app/favicon` | `favicon.svg` |
| `mark/square` (32 export) | `logo-mark.svg` |
| `social/og` | `og.svg` |

3. Run from repo root:
   ```bash
   cd apps/web && npm run brand:export
   npm run brand:check
   ```

4. Preview:
   - `apps/web/public/profile-photo.png` — X avatar
   - `apps/web/public/og-image.png` — link preview

**Never edit PNGs in `public/` by hand.**

---

## Step 8 — Replace site header (after logo-mark.svg export)

The export script copies `brand/source/logo-mark.svg` → `apps/web/public/logo-mark.svg`.

Redeploy to update smeltr.org header (currently still legacy Minty icon until you export).

---

## Token logo usage

`token-logo.svg` is for:

- Default icon style for tokens deployed via Smeltr (test token gallery, docs)
- App store / PH gallery slot showing "what a Smeltr-forged token looks like"
- **Not** the profile photo — profile uses `mark.svg` (square, no coin ring)

---

## Quality checklist before launch

- [ ] S reads clearly at **32×32** (favicon frame)
- [ ] S reads clearly at **48×48** (X avatar preview)
- [ ] Profile mark has **no wordmark**
- [ ] OG hero is **mark-led**, not text-only
- [ ] All frames use color styles (no one-off hex)
- [ ] `npm run brand:check` passes
- [ ] Sketch reference archived at `brand/reference/sketch-s.jpg`

---

## Current repo drafts (starting point)

These SVGs trace your sketch already — refine in Figma, re-export:

- `brand/source/mark.svg` — profile
- `brand/source/token-logo.svg` — coin
- `brand/source/og.svg` — social hero v2 (mark + wordmark)
- `brand/source/s-mark-core.svg` — path only for editing

**Your job in Figma:** tighten the path against the sketch, tune ribs/sparks, approve compositions per frame.
