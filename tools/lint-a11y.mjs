/**
 * 各 HTML を子プロセスで axe-core + jsdom 検査（プロセス間で axe 状態が汚染されない）。
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const runner = resolve(root, "tools", "lint-a11y-one.mjs");

const pages = [
  "projects/open-cafe-wp-export/concept.html",
  "projects/open-cafe-wp-export/index.html",
  "projects/open-cafe-wp-export/menu-bread-sweets.html",
  "projects/open-cafe-wp-export/menu-drink.html",
  "projects/open-cafe-wp-export/menu-salad.html",
  "projects/open-cafe-wp-export/menu.html",
  "projects/open-cafe-wp-export/news-page-2.html",
  "projects/open-cafe-wp-export/news-single-01.html",
  "projects/open-cafe-wp-export/news-single-02.html",
  "projects/open-cafe-wp-export/news-single-03.html",
  "projects/open-cafe-wp-export/news-single-04.html",
  "projects/open-cafe-wp-export/news-single-05.html",
  "projects/open-cafe-wp-export/news-single-06.html",
  "projects/open-cafe-wp-export/news-single-07.html",
  "projects/open-cafe-wp-export/news-single-08.html",
  "projects/open-cafe-wp-export/news-single-09.html",
  "projects/open-cafe-wp-export/news-single-10.html",
  "projects/open-cafe-wp-export/news-single-11.html",
  "projects/open-cafe-wp-export/news-single-12.html",
  "projects/open-cafe-wp-export/news.html",
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
