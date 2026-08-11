/**
 * linkinator を `tools/site.config.json` の正規 URL から導いたスキップ正規表現で実行する。
 * カスタムドメイン時は `canonicalSite` を更新すれば OG 用ホストのスキップも追従する（必要なら `linkinatorSkip` で上書き）。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const cfgPath = resolve(root, "tools", "site.config.json");
const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSkipPattern() {
  if (typeof cfg.linkinatorSkip === "string" && cfg.linkinatorSkip.trim()) {
    return cfg.linkinatorSkip.trim();
  }
  const raw = String(cfg.canonicalSite || "https://kumatrekcode.github.io").trim();
  const u = new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
  const origin = `${u.protocol}//${u.host}`;
  return `^${escapeRe(origin)}/|^https://(twitter\\.com/|x\\.com/)`;
}

const skip = buildSkipPattern();
const entryPoints = [
  "index.html",
  "about.html",
  "404.html",
  "projects/open-cafe/index.html",
  "projects/open-cafe/site/index.html",
  "projects/open-cafe-wp-export/index.html",
];

const linkinatorBin = resolve(root, "node_modules", ".bin", "linkinator");
const args = [...entryPoints, "--recurse", "--silent", "--skip", skip];

const r = spawnSync(linkinatorBin, args, { cwd: root, stdio: "inherit", encoding: "utf8" });
if (r.status !== 0) {
  process.exit(r.status ?? 1);
}
