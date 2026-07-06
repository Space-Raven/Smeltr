/**
 * Brand export pipeline — brand/source/ → apps/web/public/
 *
 *   npm run brand:export           — all available masters
 *   npm run brand:export -- og     — OG PNG only
 *   npm run brand:export -- profile — profile PNGs only
 *   npm run brand:export -- svg     — copy SVG masters to public/
 *
 * See brand/README.md — never AI-generate; never crop banner → profile.
 */
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(dir, "..", "public");
const sourceDir = join(dir, "..", "..", "..", "brand", "source");

function master(name) {
  return join(sourceDir, name);
}

function exportSvgToPng(svgPath, outPath, width) {
  const svg = readFileSync(svgPath);
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  writeFileSync(outPath, resvg.render().asPng());
}

function exportOg() {
  const src = master("og.svg");
  if (!existsSync(src)) {
    console.warn("[brand] skip og — missing brand/source/og.svg");
    return;
  }
  exportSvgToPng(src, join(publicDir, "og-image.png"), 1200);
  console.log("[brand] og-image.png ← brand/source/og.svg");
}

function exportProfile() {
  const src = master("mark.svg");
  if (!existsSync(src)) {
    console.warn(
      "[brand] skip profile — missing brand/source/mark.svg\n" +
        "        Design a 512×512 icon in Figma (see brand/README.md). Do not crop the banner."
    );
    return;
  }
  exportSvgToPng(src, join(publicDir, "profile-icon.png"), 512);
  exportSvgToPng(src, join(publicDir, "profile-photo.png"), 400);
  console.log("[brand] profile-icon.png + profile-photo.png ← brand/source/mark.svg");
}

/** Copy SVG masters into public/ for Next.js static serving. */
function copySvgMasters() {
  const copies = [
    ["og.svg", "og-image.svg"],
    ["mark.svg", "profile-icon.svg"],
    ["token-logo.svg", "token-logo.svg"],
    ["logo-mark.svg", "logo-mark.svg"],
    ["logo.svg", "logo.svg"],
    ["favicon.svg", "favicon.svg"],
  ];
  for (const [from, to] of copies) {
    const src = master(from);
    if (!existsSync(src)) continue;
    copyFileSync(src, join(publicDir, to));
    console.log(`[brand] public/${to} ← brand/source/${from}`);
  }
}

function exportTokenLogo() {
  const src = master("token-logo.svg");
  if (!existsSync(src)) return;
  exportSvgToPng(src, join(publicDir, "token-logo.png"), 512);
  console.log("[brand] token-logo.png ← brand/source/token-logo.svg");
}

const arg = process.argv[2] ?? "all";

if (arg === "all" || arg === "og") exportOg();
if (arg === "all" || arg === "profile") exportProfile();
if (arg === "all" || arg === "token") exportTokenLogo();
if (arg === "all" || arg === "svg") copySvgMasters();
