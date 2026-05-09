import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(resolve(root, "tools", "site.config.json"), "utf8"));

function checkPath(label, p) {
  if (p == null || typeof p !== "string" || !p.trim()) {
    console.error(`verify-og-images: ${label}: empty or invalid path`);
    process.exit(1);
  }
  if (/^https?:\/\//i.test(p)) return;
  const rel = p.startsWith("/") ? p.slice(1) : p;
  const abs = resolve(root, rel);
  if (!existsSync(abs)) {
    console.error(`verify-og-images: ${label}: file not found: ${rel}`);
    process.exit(1);
  }
}

checkPath("ogImage", cfg.ogImage);
const byPage = cfg.ogImageByPage;
if (byPage && typeof byPage === "object") {
  for (const [page, img] of Object.entries(byPage)) {
    checkPath(`ogImageByPage["${page}"]`, img);
  }
}

console.log("verify-og-images: ok");
