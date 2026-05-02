import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** Repository root (GitHub Pages document root). */
const root = resolve(import.meta.dirname, "..");
const cfg = JSON.parse(
  readFileSync(resolve(root, "tools", "site.config.json"), "utf8"),
);
const xUrl = String(cfg.socialX);

/** Depth from repo root (site root): how many `../` to reach root. */
const REL_PREFIX = {
  "index.html": "",
  "404.html": null,
  "projects/open-cafe/index.html": "../../",
  "projects/open-cafe/site/index.html": "../../../",
};

const files = Object.keys(REL_PREFIX);

const navBlock = /<!-- site:nav:start -->[\s\S]*?<!-- site:nav:end -->/;

function renderNav(relPrefix) {
  const name = relPrefix === null ? "site-nav-root.html" : "site-nav.html";
  let partial = readFileSync(resolve(root, "tools", "partials", name), "utf8");
  partial = partial.replaceAll("{{X_URL}}", xUrl);
  if (relPrefix !== null) {
    partial = partial.replaceAll("{{REL}}", relPrefix);
  }
  return partial;
}

/**
 * Root-relative paths (/assets/, /img/, /projects/…) break when the site is opened
 * under a subpath (e.g. Live Server: /KumaTrekCode.github.io/index.html).
 * Rewrite to path-relative using the page's depth prefix.
 */
function rootPathsToRelative(html, prefix) {
  if (prefix === null) return html;
  const p = prefix;
  return html
    .replaceAll('href="/assets/', `href="${p}assets/`)
    .replaceAll('href="/index.html', `href="${p}index.html`)
    .replaceAll('href="/projects/', `href="${p}projects/`)
    .replaceAll('src="/img/', `src="${p}img/`)
    .replaceAll('srcset="/img/', `srcset="${p}img/`);
}

for (const rel of files) {
  const abs = resolve(root, rel);
  let html = readFileSync(abs, "utf8");
  if (!navBlock.test(html)) {
    console.warn(`skip (no nav markers): ${rel}`);
    continue;
  }
  const relPrefix = REL_PREFIX[rel];
  const navHtml = renderNav(relPrefix);
  html = html.replace(navBlock, `<!-- site:nav:start -->\n${navHtml}\n<!-- site:nav:end -->`);
  html = rootPathsToRelative(html, relPrefix);
  writeFileSync(abs, html, "utf8");
  console.log("sync-site: ok", rel);
}
