import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
const projectsPath = resolve(root, "tools", "projects.json");
const indexPath = join(root, "index.html");

const worksBlock =
  /<!--\s*site:works:start\s*-->[\s\S]*?<!--\s*site:works:end\s*-->/;

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s) {
  return escHtml(s).replace(/'/g, "&#39;");
}

function renderNote(note) {
  if (!note || !note.linkUrl) return "";
  const label = escHtml(note.linkLabel || "");
  const suffix = escHtml(note.suffix || "");
  const href = escAttr(note.linkUrl);
  return `
          <p class="note">
            <a href="${href}" rel="noopener noreferrer" target="_blank"
              >${label}</a
            >${suffix}
          </p>`;
}

function renderCard(p) {
  const title = escHtml(p.title);
  const description = escHtml(p.description);
  const href = escAttr(p.detailHref);
  const cta = escHtml(p.ctaLabel || "詳細を見る");
  const noteBlock = renderNote(p.note);
  return `        <div class="card">
          <h3>${title}</h3>
          <p>${description}</p>${noteBlock}
          <a class="btn" href="${href}"
            >${cta}</a
          >
        </div>`;
}

function main() {
  if (!existsSync(projectsPath)) {
    console.error("render-works: missing tools/projects.json");
    process.exit(1);
  }
  const { projects } = JSON.parse(readFileSync(projectsPath, "utf8"));
  if (!Array.isArray(projects) || projects.length === 0) {
    console.error("render-works: tools/projects.json must have a non-empty projects array");
    process.exit(1);
  }

  let html = readFileSync(indexPath, "utf8");
  if (!worksBlock.test(html)) {
    console.error(
      "render-works: index.html must contain <!-- site:works:start --> ... <!-- site:works:end -->",
    );
    process.exit(1);
  }

  const inner = projects.map(renderCard).join("\n");
  const replacement = `<!-- site:works:start -->\n${inner}\n        <!-- site:works:end -->`;

  html = html.replace(worksBlock, replacement);
  writeFileSync(indexPath, html, "utf8");
  console.log("render-works: ok", projects.length, "card(s) → index.html");
}

main();
