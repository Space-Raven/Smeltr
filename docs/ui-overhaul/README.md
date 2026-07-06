# UI overhaul — brand integration plan

**Track C** from [`PRODUCT_DIRECTION.md`](../PRODUCT_DIRECTION.md).  
**Brand pipeline:** [`brand/README.md`](../../brand/README.md)

---

## Asset map

| UI need | Master | Public path | Command |
|---------|--------|-------------|---------|
| Nav / favicon | `brand/source/logo-mark.svg` | `/logo-mark.svg` | `npm run brand:export -- svg` |
| Profile / social avatar | `brand/source/mark.svg` | `/profile-photo.png` | `npm run brand:export -- profile` |
| OG card | `brand/source/og.svg` | `/og-image.png` | `npm run brand:export -- og` |
| Token sample UI | `brand/source/token-logo.svg` | `/token-logo.png` | `npm run brand:export` |
| Dev/social mocks | `brand/mock/*.png` | reference only | `npm run brand:export-mocks` |

**Never:** crop banner → profile; AI-generate marks.

---

## Phase C1 — Shell + tokens ✅ started

- [x] Forge CSS variables in `apps/web/app/globals.css`
- [x] `apps/web/lib/brand/tokens.ts` — shared constants for TSX
- [x] Dark forge `SiteHeader` / `SiteFooter` in `layout.tsx`
- [ ] Re-export SVG masters after Figma tweak checklist (`brand/README.md`)

## Phase C2 — Deploy + dashboard

- [ ] Forge card components (replace flat white panels)
- [ ] Module picker icons aligned to `brand/source/`
- [ ] Review panel typography + amber warning banners (brand-consistent)
- [ ] Dashboard empty state (`engineering-roadmap` 1.5E)

## Phase C3 — Marketing pages

- [ ] Homepage hero: mark-led layout per `brand/README.md` OG guidance
- [ ] `/about` already forge-themed — use as reference for other pages
- [ ] `/modules/*` consistent extension iconography

## Phase C4 — Export + verify

- [ ] `npm run brand:export` in CI or pre-release checklist
- [ ] `npm run brand:check` before PH / social launch
- [ ] Visual regression: header, deploy, OG preview at 1200×630

---

## Design reference

Forge palette (from brand tokens):

- Background: `#1A0C05`, `#2D1507`, `#3D1F08`
- Accent: `#F59E0B`, `#FDE68A`, `#FEF3C7`
- Text on dark: `#FDE68A` body, `#FEF3C7` headings

About page (`apps/web/app/about/page.tsx`) is the in-app style reference.
