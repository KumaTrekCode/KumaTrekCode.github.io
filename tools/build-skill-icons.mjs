/**
 * About スキルアイコン: 原本を img/source/ に整理し、
 * スマホ(sm) / タブレット(md) / PC(lg) 向け PNG + WebP を img/ に出力する。
 *
 * 原本（Gemini ファイル名）を img/ に置いてから:
 *   npm run build:icons
 *
 * check からも実行されます。
 */
import sharp from "sharp";
import { copyFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceDir = resolve(root, "img/source");
const imgDir = resolve(root, "img");

/** Gemini 出力 → マスター名（img/source/icon-skill-{key}.png） */
const GEMINI_TO_KEY = [
  ["Gemini_Generated_Image_309sbi309sbi309s.png", "large-vehicle"],
  ["Gemini_Generated_Image_1r0j191r0j191r0j.png", "auto-mechanic"],
  ["Gemini_Generated_Image_4n4zgr4n4zgr4n4z.png", "electrician"],
  ["Gemini_Generated_Image_xwypu5xwypu5xwyp.png", "hazmat"],
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

  const webGemini = resolve(imgDir, "Gemini_Generated_Image_4dygl44dygl44dyg.png");
  const webTo = resolve(sourceDir, "icon-skill-webdev.png");
  const bear = resolve(root, "assets/img/bear-webdev.png");
  if (existsSync(webGemini)) {
    renameSync(webGemini, webTo);
    console.log(`ingest: Gemini …4dygl… → source/icon-skill-webdev.png`);
  } else if (existsSync(bear) && !existsSync(webTo)) {
    copyFileSync(bear, webTo);
    console.log(`ingest: assets/img/bear-webdev.png → source/icon-skill-webdev.png`);
  }
}

async function emitTieredFromMaster(key) {
  const master = resolve(sourceDir, `icon-skill-${key}.png`);
  if (!existsSync(master)) {
    console.warn(`skip emit (no master): source/icon-skill-${key}.png`);
    return null;
  }

  const meta = await sharp(master).metadata();
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

async function emitWebdevSquare() {
  const master = resolve(sourceDir, "icon-skill-webdev.png");
  if (!existsSync(master)) {
    console.warn("skip webdev (no source/icon-skill-webdev.png)");
    return { width: 512, height: 512 };
  }

  const tiers = [
    { suffix: "sm", size: 360, webpQ: 82 },
    { suffix: "md", size: 512, webpQ: 85 },
    { suffix: "lg", size: 768, webpQ: 88 },
  ];

  for (const { suffix, size, webpQ } of tiers) {
    const baseOut = resolve(imgDir, `icon-skill-webdev-${suffix}`);
    await sharp(master)
      .resize(size, size, {
        fit: "contain",
        kernel: sharp.kernel.lanczos3,
        background: { r: 15, g: 18, b: 24, alpha: 1 },
      })
      .png({ compressionLevel: 9 })
      .toFile(`${baseOut}.png`);
    await sharp(`${baseOut}.png`).webp({ quality: webpQ, effort: 6 }).toFile(`${baseOut}.webp`);
    console.log(`  icon-skill-webdev-${suffix}: ${size}x${size}`);
  }

  return { width: 768, height: 768 };
}

cleanupLegacyFlatIcons();
await ingestGeminiMasters();

const dims = {};
for (const [, key] of GEMINI_TO_KEY) {
  const d = await emitTieredFromMaster(key);
  if (d) dims[key] = d;
}
dims.webdev = await emitWebdevSquare();

console.log("build-skill-icons: lg dimensions for HTML (reference):", JSON.stringify(dims, null, 2));
console.log("build-skill-icons: done");
