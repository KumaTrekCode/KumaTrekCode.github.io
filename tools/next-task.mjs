#!/usr/bin/env node
/**
 * Print the first open task from ROADMAP.md Agent queue.
 * Usage: node tools/next-task.mjs [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const roadmapPath = path.join(root, "ROADMAP.md");
const asJson = process.argv.includes("--json");

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

if (!fs.existsSync(roadmapPath)) {
  fail(`ROADMAP.md not found at ${roadmapPath}`);
}

const text = fs.readFileSync(roadmapPath, "utf8");
const lines = text.split(/\r?\n/);

let inQueue = false;
/** @type {{ id: string, title: string, line: number } | null} */
let found = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^##\s+Agent queue\b/.test(line)) {
    inQueue = true;
    continue;
  }
  if (inQueue && /^##\s+/.test(line)) {
    break;
  }
  if (!inQueue) continue;

  const m = line.match(
    /^\s*-\s*\[ \]\s*`([^`]+)`\s*:\s*(.+?)\s*$/,
  );
  if (m) {
    found = { id: m[1], title: m[2], line: i + 1 };
    break;
  }
}

if (!found) {
  if (asJson) {
    console.log(JSON.stringify({ ok: true, task: null }, null, 2));
  } else {
    console.log("No open tasks in ROADMAP.md Agent queue.");
  }
  process.exit(0);
}

if (asJson) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        task: {
          id: found.id,
          title: found.title,
          line: found.line,
          file: "ROADMAP.md",
          verify: "npm run check",
        },
      },
      null,
      2,
    ),
  );
} else {
  console.log(`Next task: \`${found.id}\``);
  console.log(found.title);
  console.log(`(ROADMAP.md:${found.line})`);
  console.log("Verify with: npm run check");
  console.log("Contract: AGENTS.md");
}
