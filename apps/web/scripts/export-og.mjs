/**
 * Export og-image.svg → og-image.png (1200×630) for social crawlers.
 * Run from apps/web: npm run og:export
 *
 * Do NOT use AI image generation for brand OG assets — export from SVG only.
 */
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(dir, "..", "public");
const svg = readFileSync(join(publicDir, "og-image.svg"));
const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
const png = resvg.render().asPng();
writeFileSync(join(publicDir, "og-image.png"), png);
console.log(`Wrote og-image.png (${png.length} bytes)`);
