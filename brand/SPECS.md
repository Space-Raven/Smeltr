# Smeltr brand asset specifications

All masters live in `brand/source/`. Run `npm run brand:export` to regenerate `apps/web/public/` PNGs.

---

## Asset matrix

| Asset | Master | Export size(s) | Platform | Composition notes |
|-------|--------|----------------|----------|-------------------|
| **Coin mark (canonical)** | Figma `mark/coin` from `s-mark-filled` | — | Reference only | `brand/reference/s-mark-filled.png` |
| **Profile photo** | `mark.svg` | 400, 512 | X, PH, LinkedIn, Discord | Square; **coin mark** centered; circle safe zone 75% |
| **Token logo** | `token-logo.svg` | 512 PNG | Deploy UI, samples, PH | Coin ring + S + optional SMELTR label |
| **OG / social card** | `og.svg` | 1200×630 | X, Discord, Slack, PH gallery #1 | Landscape; coin mark + minimal text |
| **Horizontal banner** | `logo.svg` or `wordmark.svg` | 1600×400 | X header, email | S + divider + Smeltr wordmark |
| **Favicon** | `favicon.svg` | 32×32 | Browser tab | Simplified S only; no ring/sparks if cluttered |
| **App logo (header)** | `logo-mark.svg` | SVG | smeltr.org header | 32px display height; coin or S-only |

---

## Profile photo (`mark.svg` → profile-photo.png)

| Spec | Value |
|------|-------|
| Canvas | 512×512 |
| Display export | 400×400 (`profile-photo.png`) |
| Retina export | 512×512 (`profile-icon.png`) |
| Background | `#1A0C05` solid or subtle radial amber glow |
| Safe zone | 64px padding (circle crop on X removes corners) |
| Content | Ribbed S + 2–3 sparks only |

**Test:** Shrink to 48×48 — S silhouette must still read as S, not 8 or 0.

---

## OG image (`og.svg` → og-image.png)

| Spec | Value |
|------|-------|
| Canvas | 1200×630 (1.91:1) |
| Format | PNG for social crawlers (SVG unreliable on X) |
| Title | Max 40 chars visible at thumbnail |
| Tagline | Max 60 chars |
| Avoid | Module pill overload; walls of text |

**Current hero grade:** B− (correct copy, generic layout). **Target:** Distinctive mark-led composition.

---

## Product Hunt gallery

| Slot | Size | Content |
|------|------|---------|
| 1 | 1270×760 or OG | Brand hero |
| 2–5 | 1270×760 | **Real app screenshots** — not marketing SVGs |

Screenshots beat illustrated cards for PH conversion. Capture from production UI.

---

## Export script outputs

```
brand/source/mark.svg  ──►  apps/web/public/profile-icon.png   (512)
                         └──  apps/web/public/profile-photo.png (400)

brand/source/og.svg    ──►  apps/web/public/og-image.png       (1200×630)

brand/source/*.svg     ──►  apps/web/public/*.svg              (copied verbatim)
```

---

## Changelog

When you update a master, note it here:

| Date | Asset | Change |
|------|-------|--------|
| 2026-07-04 | `s-mark-filled` | Canonical coin mark approved (Figma); tweaks pending before SVG masters |
| 2026-07-03 | — | Established Figma-first workflow; deprecated banner crop |
