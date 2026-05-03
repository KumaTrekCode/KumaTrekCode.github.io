/**
 * 単一 HTML を axe-core + jsdom で検査（親プロセスから 1 ファイルずつ起動する）。
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

const root = resolve(import.meta.dirname, "..");
const rel = process.argv[2];
if (!rel) {
  console.error("usage: lint-a11y-one.mjs <path-from-root.html>");
  process.exit(2);
}

const disableRules = (
  process.env.AXE_DISABLE_RULES ||
  "color-contrast,definition-list,landmark-one-main,page-has-heading-one,region"
).split(",");

const rules = {};
for (const id of disableRules) {
  const t = id.trim();
  if (t) rules[t] = { enabled: false };
}

const abs = resolve(root, rel);
if (!existsSync(abs)) {
  console.error(`lint-a11y: missing ${rel}`);
  process.exit(1);
}

const html = readFileSync(abs, "utf8");
const url = `http://127.0.0.1/${rel.split("/").join("/")}`;
const dom = new JSDOM(html, { url, pretendToBeVisual: true });
const { window } = dom;
const g = globalThis;
g.window = window;
g.document = window.document;

const axe = (await import("axe-core")).default;
const opts = Object.keys(rules).length ? { rules } : {};

try {
  const results = await axe.run(window.document, opts);
  if (results.violations.length) {
    console.error(`\nlint-a11y: ${rel} — ${results.violations.length} violation(s)`);
    for (const v of results.violations) {
      console.error(`  [${v.id}] ${v.help}`);
      for (const n of v.nodes.slice(0, 5)) {
        console.error(`    ${n.html?.slice(0, 120)}${(n.html?.length || 0) > 120 ? "…" : ""}`);
      }
      if (v.nodes.length > 5) console.error(`    … +${v.nodes.length - 5} nodes`);
    }
    process.exit(1);
  }
  console.log(`lint-a11y: ok ${rel}`);
} finally {
  try {
    axe.cleanup();
  } catch {
    /* ignore */
  }
  delete g.window;
  delete g.document;
  dom.window.close();
}
