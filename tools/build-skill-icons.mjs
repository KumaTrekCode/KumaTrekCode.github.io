/**
 * About スキルアイコン: 原本を img/source/ に整理し、
 * スマホ(sm) / タブレット(md) / PC(lg) 向け PNG + WebP を img/ に出力する。
 *
 * 原本（Gemini ファイル名）を img/ に置いてから:
 *   npm run build:icons
 *
 * Web 学習用: `Gemini_Generated_Image_gwa5zxgwa5zxgwa5.png` → `icon-skill-webdev.png`（About「今後取得」カード）。
 * ECU 計測用: `Gemini_Generated_Image_lvfa8lvfa8lvfa8l.png` → `icon-skill-ecu.png`（About「保有スキル」）。
 * Linux 学習用: `Gemini_Generated_Image_l0mtfkl0mtfkl0mt.png` → `icon-skill-future-linux.png`（About「今後取得」）。
 * データ処理・自動化用: `Gemini_Generated_Image_9km4nj9km4nj9km4.png` → `icon-skill-future-python.png`（About「今後取得」）。
 * **CI（`CI=true`）**では、`GEMINI_TO_KEY` の各キーについて **`img/source/icon-skill-{key}.png` が必須**で、欠けると `process.exit(1)`。tier 生成に失敗しても同様です。
 * check からも実行されます。
 */
import sharp from "sharp";
import { existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceDir = resolve(root, "img/source");
const imgDir = resolve(root, "img");

/** Gemini 出力 → マスター名（img/source/icon-skill-{key}.png） */
const GEMINI_TO_KEY = [
  ["Gemini_Generated_Image_309sbi309sbi309s.png", "large-vehicle"],
  ["Gemini_Generated_Image_1r0j191r0j191r0j.png", "auto-mechanic"],
  ["Gemini_Generated_Image_4n4zgr4n4zgr4n4z.png", "electrician"],
  ["Gemini_Generated_Image_xwypu5xwypu5xwyp.png", "hazmat"],
  ["Gemini_Generated_Image_gwa5zxgwa5zxgwa5.png", "webdev"],
  ["Gemini_Generated_Image_lvfa8lvfa8lvfa8l.png", "ecu"],
  ["Gemini_Generated_Image_l0mtfkl0mtfkl0mt.png", "future-linux"],
  ["Gemini_Generated_Image_9km4nj9km4nj9km4.png", "future-python"],
];

const TIERS = [
  { suffix: "sm", maxW: 520, webpQ: 82 },
  { suffix: "md", maxW: 900, webpQ: 85 },
  { suffix: "lg", maxW: 1280, webpQ: 88 },
];

function cleanupLegacyFlatIcons() {
  const keys = [
    "large-vehicle",
    "auto-mechanic",
    "electrician",
    "hazmat",
    "webdev",
    "ecu",
    "future-linux",
    "future-python",
  ];
  for (const key of keys) {
    for (const ext of [".png", ".webp"]) {
      const base = `icon-skill-${key}${ext}`;
      const abs = resolve(imgDir, base);
      if (existsSync(abs)) {
        try {
          unlinkSync(abs);
        } catch {
          /* ignore */
        }
      }
    }
  }
}

async function ingestGeminiMasters() {
  mkdirSync(sourceDir, { recursive: true });
  for (const [geminiName, key] of GEMINI_TO_KEY) {
    const from = resolve(imgDir, geminiName);
    const to = resolve(sourceDir, `icon-skill-${key}.png`);
    if (existsSync(from)) {
      renameSync(from, to);
      console.log(`ingest: ${geminiName} → source/icon-skill-${key}.png`);
    } else if (!existsSync(to)) {
      console.warn(`skip ingest (missing): ${geminiName} and no source yet`);
    }
  }

}

async function emitTieredFromMaster(key) {
  const master = resolve(sourceDir, `icon-skill-${key}.png`);
  if (!existsSync(master)) {
    console.warn(`skip emit (no master): source/icon-skill-${key}.png`);
    return null;
  }

  const baseName = `icon-skill-${key}`;

  for (const { suffix, maxW, webpQ } of TIERS) {
    const baseOut = resolve(imgDir, `${baseName}-${suffix}`);
    await sharp(master)
      .resize(maxW, null, {
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen({ sigma: 0.35, m1: 1, m2: 0.12 })
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(`${baseOut}.png`);
    await sharp(`${baseOut}.png`)
      .webp({ quality: webpQ, effort: 6 })
      .toFile(`${baseOut}.webp`);
    const m = await sharp(`${baseOut}.png`).metadata();
    console.log(`  ${baseName}-${suffix}: ${m.width}x${m.height}`);
  }

  const lgMeta = await sharp(resolve(imgDir, `${baseName}-lg.png`)).metadata();
  return { width: lgMeta.width, height: lgMeta.height };
}

cleanupLegacyFlatIcons();
await ingestGeminiMasters();

if (process.env.CI === "true") {
  for (const [, key] of GEMINI_TO_KEY) {
    const master = resolve(sourceDir, `icon-skill-${key}.png`);
    if (!existsSync(master)) {
      console.error(
        `build-skill-icons (CI): missing master ${relative(root, master)} — commit img/source or add Gemini to img/.`
      );
      process.exit(1);
    }
  }
}

const dims = {};
const emitFailed = [];
for (const [, key] of GEMINI_TO_KEY) {
  const d = await emitTieredFromMaster(key);
  if (d) dims[key] = d;
  else emitFailed.push(key);
}

if (emitFailed.length) {
  console.warn("build-skill-icons: tier emit failed for:", emitFailed.join(", "));
  if (process.env.CI === "true") {
    console.error("build-skill-icons (CI): all GEMINI_TO_KEY entries must emit successfully.");
    process.exit(1);
  }
}

console.log("build-skill-icons: lg dimensions for HTML (reference):", JSON.stringify(dims, null, 2));
console.log("build-skill-icons: done");
