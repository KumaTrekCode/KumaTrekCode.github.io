import { readFileSync, writeFileSync, readdirSync, statSync, lstatSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/**
 * Repository root (GitHub Pages document root).
 * 処理する HTML は `tools/sync-html-allowlist.json` で限定（新規ページは JSON にパスを追加）。
 * 終了時、ルート / projects 配下で allowlist に無い .html があると警告（tools/ は除外）。
 * `robots.txt` / `sitemap.xml` は `canonicalSite` と `sitemapUrls` から毎回書き出す。
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
/** Leading horizontal whitespace on the marker line is part of the match so it is not left behind on each sync. */
const aboutSectionsBlock =
  /[ \t]*<!-- site:about-sections:start -->[\s\S]*?\n[ \t]*<!-- site:about-sections:end -->/;

/** 走査しないディレクトリ名（依存・キャッシュ・仮想環境など）。 */
const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".venv",
  "venv",
  "__pycache__",
  ".tox",
  ".mypy_cache",
  ".pytest_cache",
  ".ruff_cache",
  ".cache",
  "coverage",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".idea",
  ".vscode",
  "vendor",
  "site-packages",
]);

/** Path relative to repo root, forward slashes. */
function relPosix(absFile) {
  return relative(root, absFile).split("\\").join("/");
}

function walkHtmlFiles(dir, out = []) {
  let names;
  try {
    names = readdirSync(dir);
  } catch (e) {
    console.warn(`sync-site: warn  cannot read dir ${relPosix(dir)}: ${e.code || e.message}`);
    return out;
  }

  for (const name of names) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const abs = join(dir, name);
    let st;
    try {
      st = lstatSync(abs);
    } catch (e) {
      console.warn(`sync-site: warn  cannot lstat ${relPosix(abs)}: ${e.code || e.message}`);
      continue;
    }

    if (st.isSymbolicLink()) {
      try {
        st = statSync(abs);
      } catch (e) {
        console.warn(
          `sync-site: warn  broken symlink skipped: ${relPosix(abs)} (${e.code || e.message})`,
        );
        continue;
      }
    }

    try {
      if (st.isDirectory()) walkHtmlFiles(abs, out);
      else if (st.isFile() && name.endsWith(".html")) out.push(abs);
    } catch (e) {
      console.warn(`sync-site: warn  skip ${relPosix(abs)}: ${e.code || e.message}`);
    }
  }
  return out;
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

function canonicalBase() {
  return String(cfg.canonicalSite || "https://kumatrekcode.github.io").replace(/\/$/, "");
}

function escapeXmlText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escapeXmlLoc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function replaceNameDescriptionMeta(html, content) {
  const q = escapeAttr(content);
  if (/<meta\s*\n\s*name="description"/.test(html)) {
    return html.replace(
      /<meta\s*\n\s*name="description"\s*\n\s*content="[^"]*"\s*\n\s*\/>/,
      `<meta\n      name="description"\n      content="${q}"\n    />`,
    );
  }
  return html.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${q}" />`,
  );
}

function replaceOgDescriptionMeta(html, content) {
  if (!/property="og:description"/.test(html)) return html;
  const q = escapeAttr(content);
  if (/<meta\s*\n\s*property="og:description"/.test(html)) {
    return html.replace(
      /<meta\s*\n\s*property="og:description"\s*\n\s*content="[^"]*"\s*\n\s*\/>/,
      `<meta\n      property="og:description"\n      content="${q}"\n    />`,
    );
  }
  return html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${q}" />`,
  );
}

function replaceOgTitleMeta(html, content) {
  if (!/property="og:title"/.test(html)) return html;
  const q = escapeAttr(content);
  if (/<meta\s*\n\s*property="og:title"/.test(html)) {
    return html.replace(
      /<meta\s*\n\s*property="og:title"\s*\n\s*content="[^"]*"\s*\n\s*\/>/,
      `<meta\n      property="og:title"\n      content="${q}"\n    />`,
    );
  }
  return html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${q}" />`,
  );
}

/** `tools/site.config.json` の `pageMeta` で `<title>` / description / OGP タイトル説明を上書き */
function injectPageMeta(html, relPath) {
  const pm = cfg.pageMeta && typeof cfg.pageMeta === "object" ? cfg.pageMeta[relPath] : null;
  if (!pm) return html;
  let out = html;
  if (pm.title) {
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeXmlText(pm.title)}</title>`);
  }
  if (pm.description) {
    out = replaceNameDescriptionMeta(out, pm.description);
  }
  const ogTitle = pm.ogTitle ?? pm.title;
  const ogDesc = pm.ogDescription ?? pm.description;
  if (ogTitle) out = replaceOgTitleMeta(out, ogTitle);
  if (ogDesc) out = replaceOgDescriptionMeta(out, ogDesc);
  return out;
}

function injectOg(html, relPath) {
  if (!/property="og:url"/.test(html) || !/property="og:image"/.test(html)) return html;
  const base = canonicalBase();
  const byPage = cfg.ogImageByPage && typeof cfg.ogImageByPage === "object" ? cfg.ogImageByPage[relPath] : null;
  const ogImgPath = String(byPage || cfg.ogImage || "/img/hero-profile.jpg");
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

function hasPageMeta(relPath) {
  return !!(cfg.pageMeta && typeof cfg.pageMeta === "object" && cfg.pageMeta[relPath]);
}

function shouldProcess(html, relPath) {
  return (
    navBlock.test(html) ||
    footerBlock.test(html) ||
    aboutSectionsBlock.test(html) ||
    hasOgMeta(html) ||
    hasPageMeta(relPath)
  );
}

function writeRobotsTxt() {
  const base = canonicalBase();
  const sitemapUrl = `${base}/sitemap.xml`;
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
  writeFileSync(join(root, "robots.txt"), body, "utf8");
  console.log("sync-site: ok robots.txt");
}

function writeSitemapXml() {
  const base = canonicalBase();
  const urls = cfg.sitemapUrls;
  if (!Array.isArray(urls) || urls.length === 0) {
    console.warn("sync-site: warn  site.config.json に sitemapUrls が無いため sitemap.xml をスキップします");
    return;
  }
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const entry of urls) {
    const path = String(entry.path ?? "");
    const loc = path === "" || path === "/" ? `${base}/` : `${base}/${path.replace(/^\//, "")}`;
    const freq = escapeXmlLoc(entry.changefreq || "monthly");
    const pri = escapeXmlLoc(entry.priority || "0.5");
    xml += `  <url>\n    <loc>${escapeXmlLoc(loc)}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>\n`;
  }
  xml += `</urlset>\n`;
  writeFileSync(join(root, "sitemap.xml"), xml, "utf8");
  console.log("sync-site: ok sitemap.xml");
}

function isIgnoredAllowlistWarn(rel) {
  const list = cfg.syncHtmlWarnIgnorePrefixes;
  if (!Array.isArray(list)) return false;
  return list.some((raw) => {
    const p = String(raw).split("\\").join("/").replace(/\/?$/, "/");
    const prefix = p.endsWith("/") ? p : `${p}/`;
    return rel === prefix.slice(0, -1) || rel.startsWith(prefix);
  });
}

/** allowlist に載っていない .html があれば警告（sync はしない） */
function warnHtmlOutsideAllowlist() {
  if (!syncHtmlAllowSet || syncHtmlAllowSet.size === 0) return;
  const allRel = walkHtmlFiles(root)
    .map(relPosix)
    .filter((rel) => rel.endsWith(".html") && !rel.startsWith("tools/"));
  for (const rel of allRel) {
    if (!syncHtmlAllowSet.has(rel)) {
      if (isIgnoredAllowlistWarn(rel)) continue;
      console.warn(`sync-site: warn  allowlist に無い HTML（sync 対象外）: ${rel}`);
    }
  }
}

const htmlAbsList = walkHtmlFiles(root);
for (const abs of htmlAbsList) {
  const rel = relPosix(abs);
  if (syncHtmlAllowSet && !syncHtmlAllowSet.has(rel)) continue;

  let html;
  try {
    html = readFileSync(abs, "utf8");
  } catch (e) {
    console.warn(`sync-site: warn  cannot read ${rel}: ${e.code || e.message}`);
    continue;
  }
  if (!shouldProcess(html, rel)) continue;

  const relPrefix = relPrefixFor(rel);

  try {
    if (navBlock.test(html)) {
      const navHtml = renderNav(relPrefix);
      html = html.replace(navBlock, `<!-- site:nav:start -->\n${navHtml}\n<!-- site:nav:end -->`);
    }

    if (footerBlock.test(html)) {
      const footer = readFileSync(resolve(root, "tools", "partials", "site-footer.html"), "utf8");
      html = html.replace(footerBlock, `<!-- site:footer:start -->\n${footer}\n<!-- site:footer:end -->`);
    }

    if (aboutSectionsBlock.test(html)) {
      const aboutSections = readFileSync(
        resolve(root, "tools", "partials", "about-sections.html"),
        "utf8",
      );
      html = html.replace(
        aboutSectionsBlock,
        `      <!-- site:about-sections:start -->\n${aboutSections}\n      <!-- site:about-sections:end -->`,
      );
    }

    html = injectPageMeta(html, rel);
    html = injectOg(html, rel);
    html = rootPathsToRelative(html, relPrefix);
    writeFileSync(abs, html, "utf8");
    console.log("sync-site: ok", rel);
  } catch (e) {
    console.warn(`sync-site: warn  failed processing ${rel}: ${e.code || e.message}`);
  }
}

writeRobotsTxt();
writeSitemapXml();
warnHtmlOutsideAllowlist();
