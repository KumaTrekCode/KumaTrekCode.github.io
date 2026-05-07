import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";

const root = resolve(import.meta.dirname, "..");
const targetDir = resolve(root, "projects", "open-cafe-wp-export");

function fixOne(absPath) {
  const html = readFileSync(absPath, "utf8");
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const nodes = Array.from(doc.querySelectorAll(".access__dl"));
  let changed = false;

  for (const el of nodes) {
    if (el.tagName.toLowerCase() === "dl") continue;

    const dl = doc.createElement("dl");
    dl.className = el.className;
    dl.innerHTML = el.innerHTML;
    el.replaceWith(dl);
    changed = true;
  }

  if (!changed) return false;

  const out = dom.serialize();
  writeFileSync(absPath, out, "utf8");
  return true;
}

let touched = 0;
for (const name of readdirSync(targetDir)) {
  if (!name.endsWith(".html")) continue;
  const abs = join(targetDir, name);
  if (fixOne(abs)) touched++;
}

console.log(`fix-wp-export-access-dl: updated ${touched} file(s)`);

