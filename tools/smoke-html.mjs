import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * html-validate と同じ主要ページに、sync 済みマーカーとフッター JS を含むか軽く検査する。
 * `package.json` の validate 対象を変えたらここも揃えること。
 */
const root = resolve(import.meta.dirname, "..");
const pages = [
  "index.html",
  "about.html",
  "404.html",
  "projects/open-cafe/index.html",
  "projects/open-cafe/site/index.html",
];

function fail(msg) {
  console.error("smoke-html:", msg);
  process.exit(1);
}

for (const rel of pages) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) fail(`missing ${rel}`);
  const html = readFileSync(abs, "utf8");
  if (!html.includes("<!-- site:nav:start -->")) fail(`${rel}: missing nav marker`);
  if (!html.includes("<!-- site:footer:start -->")) fail(`${rel}: missing footer marker`);
  if (!html.includes("scroll-top")) fail(`${rel}: missing scroll-top button`);
  if (!html.includes("scroll-top.min.js")) fail(`${rel}: missing scroll-top.min.js script`);
  if (rel !== "404.html" && !/property="og:url"/.test(html)) fail(`${rel}: missing og:url`);
}

console.log("smoke-html: ok", pages.length, "page(s)");
