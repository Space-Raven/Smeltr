/**
 * Export brand/mock/*.svg → brand/mock/*.png
 * Run: cd apps/web && npm run brand:export-mocks
 */
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const mockDir = join(dir, "..", "mock");

const exports = [
  { svg: "profile-square.svg", png: "profile-square.png", width: 512 },
  { svg: "profile-square.svg", png: "profile-photo-400.png", width: 400 },
  { svg: "banner-social.svg", png: "banner-social-1500x500.png", width: 1500 },
  { svg: "coin-brass.svg", png: "coin-brass-512.png", width: 512 },
  { svg: "coin-brass.svg", png: "coin-brass-1024.png", width: 1024 },
  { svg: "metadata-tx-diagram.svg", png: "metadata-tx-diagram-1600.png", width: 1600 },
  { svg: "metadata-tx-diagram.svg", png: "metadata-tx-diagram-1200.png", width: 1200 },
];

for (const { svg, png, width } of exports) {
  const svgPath = join(mockDir, svg);
  const outPath = join(mockDir, png);
  const resvg = new Resvg(readFileSync(svgPath), { fitTo: { mode: "width", value: width } });
  writeFileSync(outPath, resvg.render().asPng());
  console.log(`[brand:mock] ${png} ← ${svg} @ ${width}px`);
}
