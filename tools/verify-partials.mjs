import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * tools/partials と allowlist HTML 内の注入ブロックが一致するか検証する。
 * footer の `/assets/` は sync の rootPathsToRelative 後の形と比較する。
 */
const root = resolve(import.meta.dirname, "..");
const allowlistPath = resolve(root, "tools", "sync-html-allowlist.json");
const partialDir = resolve(root, "tools", "partials");

const navBlock =
  /<!-- site:nav:start -->\n([\s\S]*?)\n<!-- site:nav:end -->/;
const footerBlock =
  /<!-- site:footer:start -->\n([\s\S]*?)\n<!-- site:footer:end -->/;
const aboutSectionsBlock =
  /<!-- site:about-sections:start -->\n([\s\S]*?)\n[ \t]*<!-- site:about-sections:end -->/;

function fail(msg) {
  console.error("verify-partials:", msg);
  process.exit(1);
}

function relPrefixFor(relPath) {
  if (relPath === "404.html") return null;
  const dir = dirname(relPath);
  if (dir === ".") return "";
  const depth = dir.split("/").filter(Boolean).length;
  return "../".repeat(depth);
}

function rootPathsToRelative(html, prefix) {
  if (prefix === null) return html;
  const p = prefix;
  return html
    .replaceAll('href="/assets/', `href="${p}assets/`)
    .replaceAll('href="/index.html', `href="${p}index.html`)
    .replaceAll('href="/about.html', `href="${p}about.html`)
    .replaceAll('href="/projects/', `href="${p}projects/`)
    .replaceAll('src="/assets/', `src="${p}assets/`)
    .replaceAll('src="/img/', `src="${p}img/`)
    .replaceAll('srcset="/img/', `srcset="${p}img/`);
}

function renderNav(relPrefix) {
  const name = relPrefix === null ? "site-nav-root.html" : "site-nav.html";
  let partial = readFileSync(resolve(partialDir, name), "utf8");
  if (relPrefix !== null) partial = partial.replaceAll("{{REL}}", relPrefix);
  return partial;
}

if (!existsSync(allowlistPath)) fail("missing tools/sync-html-allowlist.json");
const allowlist = JSON.parse(readFileSync(allowlistPath, "utf8"));
if (!Array.isArray(allowlist) || allowlist.length === 0) fail("empty allowlist");

const aboutPartial = readFileSync(resolve(partialDir, "about-sections.html"), "utf8");
const footerPartial = readFileSync(resolve(partialDir, "site-footer.html"), "utf8");

let checked = 0;
for (const rel of allowlist) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) fail(`missing ${rel}`);
  const html = readFileSync(abs, "utf8");
  const prefix = relPrefixFor(rel);

  if (navBlock.test(html)) {
    const m = html.match(navBlock);
    const expected = renderNav(prefix);
    if (!m || m[1] !== expected) fail(`${rel}: nav block does not match partial`);
    checked += 1;
  }

  if (footerBlock.test(html)) {
    const m = html.match(footerBlock);
    const expected = rootPathsToRelative(footerPartial, prefix);
    if (!m || m[1] !== expected) fail(`${rel}: footer block does not match partial (after path rewrite)`);
    checked += 1;
  }

  if (aboutSectionsBlock.test(html)) {
    const m = html.match(aboutSectionsBlock);
    if (!m || m[1] !== aboutPartial) fail(`${rel}: about-sections block does not match partial`);
    checked += 1;
  }
}

console.log("verify-partials: ok", checked, "block(s) across", allowlist.length, "page(s)");
