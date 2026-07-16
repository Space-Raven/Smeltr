/**
 * Verify brand masters exist before launch / PH submit.
 * Exit 1 if required masters are missing.
 */
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const sourceDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "brand", "source");

const required = [
  { file: "og.svg", label: "OG social card" },
  { file: "mark.svg", label: "Profile / avatar (512 square)" },
];

const recommended = [
  { file: "logo-mark.svg", label: "Header icon (replace Minty legacy)" },
  { file: "favicon.svg", label: "Browser favicon" },
  { file: "wordmark.svg", label: "Horizontal banner" },
];

let failed = false;

console.log("Brand master check (brand/source/):\n");

for (const { file, label } of required) {
  const ok = existsSync(join(sourceDir, file));
  console.log(`  ${ok ? "✓" : "✗"} ${file} — ${label}`);
  if (!ok) failed = true;
}

console.log("\nRecommended:");
for (const { file, label } of recommended) {
  const ok = existsSync(join(sourceDir, file));
  console.log(`  ${ok ? "✓" : "○"} ${file} — ${label}`);
}

if (failed) {
  console.error("\nMissing required masters. See brand/README.md");
  process.exit(1);
}

console.log("\nOK — run npm run brand:export to regenerate public/ PNGs");
