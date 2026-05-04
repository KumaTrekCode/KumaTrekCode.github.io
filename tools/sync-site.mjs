import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/**
 * Repository root (GitHub Pages document root).
 * 処理する HTML は `tools/sync-html-allowlist.json` で限定（新規ページは JSON にパスを追加）。
 * 終了時、ルート / projects 配下で allowlist に無い .html があると警告（tools/ は除外）。
 */
const root = resolve(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(resolve(root, "tools", "site.config.json"), "utf8"));

/** 同期対象 HTML（`tools/sync-html-allowlist.json`）。空配列は「全件」と同じ扱い。 */
const allowlistPath = resolve(root, "tools", "sync-html-allowlist.json");
let syncHtmlAllowSet = null;
if (existsSync(allowlistPath)) {
  try {
    const list = JSON.parse(readFileSync(allowlistPath, "utf8"));
    if (Array.isArray(list) && list.length > 0) {
      syncHtmlAllowSet = new Set(list.map((p) => String(p).split("\\").join("/")));
    }
  } catch (e) {
    console.warn("sync-site: invalid sync-html-allowlist.json, syncing all HTML:", e.message);
  }
}

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

/** allowlist に載っていない .html があれば警告（sync はしない） */
function warnHtmlOutsideAllowlist() {
  if (!syncHtmlAllowSet || syncHtmlAllowSet.size === 0) return;
  const allRel = walkHtmlFiles(root)
    .map(relPosix)
    .filter((rel) => rel.endsWith(".html") && !rel.startsWith("tools/"));
  for (const rel of allRel) {
    if (!syncHtmlAllowSet.has(rel)) {
      console.warn(`sync-site: warn  allowlist に無い HTML（sync 対象外）: ${rel}`);
    }
  }
}

const htmlAbsList = walkHtmlFiles(root);
for (const abs of htmlAbsList) {
  const rel = relPosix(abs);
  if (syncHtmlAllowSet && !syncHtmlAllowSet.has(rel)) continue;

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

warnHtmlOutsideAllowlist();
