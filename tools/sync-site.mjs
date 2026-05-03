import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/** Repository root (GitHub Pages document root). */
const root = resolve(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(resolve(root, "tools", "site.config.json"), "utf8"));

const navBlock = /<!-- site:nav:start -->[\s\S]*?<!-- site:nav:end -->/;
const footerBlock = /<!-- site:footer:start -->[\s\S]*?<!-- site:footer:end -->/;
const xFeedBlock = /<!-- site:home-x-feed:start -->[\s\S]*?<!-- site:home-x-feed:end -->/;

function walkHtmlFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walkHtmlFiles(abs, out);
    else if (st.isFile() && name.endsWith(".html")) out.push(abs);
  }
  return out;
}

/** Path relative to repo root, forward slashes. */
function relPosix(absFile) {
  return relative(root, absFile).split("\\").join("/");
}

/**
 * Prefix of `../` to reach site root from this HTML file.
 * `404.html` → null (keep root-relative URLs).
 */
function relPrefixFor(relPath) {
  if (relPath === "404.html") return null;
  const dir = dirname(relPath);
  if (dir === ".") return "";
  const depth = dir.split("/").filter(Boolean).length;
  return "../".repeat(depth);
}

function renderNav(relPrefix) {
  const name = relPrefix === null ? "site-nav-root.html" : "site-nav.html";
  let partial = readFileSync(resolve(root, "tools", "partials", name), "utf8");
  if (relPrefix !== null) {
    partial = partial.replaceAll("{{REL}}", relPrefix);
  }
  return partial;
}

function injectOg(html, relPath) {
  if (!/property="og:url"/.test(html) || !/property="og:image"/.test(html)) return html;
  const base = String(cfg.canonicalSite || "https://kumatrekcode.github.io").replace(/\/$/, "");
  const ogImgPath = String(cfg.ogImage || "/img/hero-profile.jpg");
  const ogImageAbs = ogImgPath.startsWith("http")
    ? ogImgPath
    : ogImgPath.startsWith("/")
      ? `${base}${ogImgPath}`
      : `${base}/${ogImgPath}`;
  const ogUrl = relPath === "index.html" ? `${base}/` : `${base}/${relPath}`;
  return html
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${ogUrl}" />`)
    .replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/, `<meta property="og:image" content="${ogImageAbs}" />`);
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
    .replaceAll('href="/about.html', `href="${p}about.html`)
    .replaceAll('href="/projects/', `href="${p}projects/`)
    .replaceAll('src="/assets/', `src="${p}assets/`)
    .replaceAll('src="/img/', `src="${p}img/`)
    .replaceAll('srcset="/img/', `srcset="${p}img/`);
}

function hasOgMeta(html) {
  return /property="og:url"/.test(html) && /property="og:image"/.test(html);
}

function shouldProcess(html) {
  return navBlock.test(html) || footerBlock.test(html) || xFeedBlock.test(html) || hasOgMeta(html);
}

const htmlAbsList = walkHtmlFiles(root);
for (const abs of htmlAbsList) {
  const rel = relPosix(abs);
  let html = readFileSync(abs, "utf8");
  if (!shouldProcess(html)) continue;

  const relPrefix = relPrefixFor(rel);

  if (navBlock.test(html)) {
    const navHtml = renderNav(relPrefix);
    html = html.replace(navBlock, `<!-- site:nav:start -->\n${navHtml}\n<!-- site:nav:end -->`);
  }

  if (footerBlock.test(html)) {
    const footer = readFileSync(resolve(root, "tools", "partials", "site-footer.html"), "utf8");
    html = html.replace(footerBlock, `<!-- site:footer:start -->\n${footer}\n<!-- site:footer:end -->`);
  }

  if (xFeedBlock.test(html)) {
    const xf = readFileSync(resolve(root, "tools", "partials", "home-x-feed.html"), "utf8");
    html = html.replace(xFeedBlock, `<!-- site:home-x-feed:start -->\n${xf}\n<!-- site:home-x-feed:end -->`);
  }

  html = injectOg(html, rel);
  html = rootPathsToRelative(html, relPrefix);
  writeFileSync(abs, html, "utf8");
  console.log("sync-site: ok", rel);
}
