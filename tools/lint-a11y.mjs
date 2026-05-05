/**
 * 各 HTML を子プロセスで axe-core + jsdom 検査（プロセス間で axe 状態が汚染されない）。
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const runner = resolve(root, "tools", "lint-a11y-one.mjs");

const pages = [
  "index.html",
  "about.html",
  "404.html",
  "projects/open-cafe/index.html",
  "projects/open-cafe/site/index.html",
  "projects/open-cafe-wp-export/index.html",
  "projects/open-cafe-wp-export/concept.html",
];

for (const rel of pages) {
  const r = spawnSync(process.execPath, [runner, rel], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}
