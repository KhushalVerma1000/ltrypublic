// Run from the ltrypublic root AFTER copying the files/ folder over your project:
//   node apply-palette.mjs
// Swaps purple/indigo/blue Tailwind classes for the new brand tokens in every
// other file, without touching anything else in them.
import fs from "node:fs";
import path from "node:path";

const SKIP = new Set([
  path.join("app", "games", "page.tsx"),
  path.join("app", "games", "loading.tsx"),
  path.join("app", "globals.css"),
  path.join("components", "Navbar.tsx"),
  path.join("components", "NextDrawBar.tsx"),
  path.join("components", "PoolCard.tsx"),
  path.join("components", "DrawingTimer.tsx"),
]);

let changed = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(tsx|ts)$/.test(e.name) || SKIP.has(p)) continue;
    const src = fs.readFileSync(p, "utf8");
    const out = src
      .replace(/purple-/g, "brand-")
      .replace(/(indigo|blue)-(\d)/g, "brand-$2")
      .replace(/bg-\[#f8fafc\]/g, "bg-paper");
    if (out !== src) { fs.writeFileSync(p, out); changed++; console.log("updated", p); }
  }
}
walk("app"); walk("components");
console.log(`\n${changed} files updated.`);
