import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(resolve(root, "site.config.json"), "utf8"));
const xUrl = String(cfg.socialX);

let partial = readFileSync(resolve(root, "partials/site-nav.html"), "utf8");
partial = partial.replaceAll("{{X_URL}}", xUrl);

const files = [
  "index.html",
  "404.html",
  "blog/index.html",
  "blog/2026-05-hello.html",
  "projects/open-cafe/index.html",
  "projects/open-cafe/site/index.html",
];

const navBlock = /<!-- site:nav:start -->[\s\S]*?<!-- site:nav:end -->/;

for (const rel of files) {
  const abs = resolve(root, rel);
  let html = readFileSync(abs, "utf8");
  if (!navBlock.test(html)) {
    console.warn(`skip (no nav markers): ${rel}`);
    continue;
  }
  html = html.replace(navBlock, `<!-- site:nav:start -->\n${partial}\n<!-- site:nav:end -->`);
  writeFileSync(abs, html, "utf8");
  console.log("sync-site: ok", rel);
}
