# Brand masters

**Canonical mark (PNG):** `master/s-mark-filled.png`  
**Vector composition (512):** `master/s-mark-composition.svg`  
**S path only:** `../s-mark-core.svg`

Export mocks: `npm run brand:export-mocks` (from `apps/web`)

| File | Status | Notes |
|------|--------|-------|
| `master/s-mark-filled.png` | **Approved direction** | Figma export - source of truth for S shape |
| `master/s-mark-composition.svg` | Mock vector match | Double-stroke S, 6 sparks, gradient |
| `s-mark-core.svg` | Path library | Import path into Figma; do not swap geometry |
| `mark.svg`, `token-logo.svg`, etc. | **Stale drafts** | Ribbed/filled placeholders - replace from master |

When Figma is final: export SVGs here, then `npm run brand:export`.
