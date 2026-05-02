import sharp from "sharp";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Repository root; optimized files are written to `img/` at site root. */
const root = resolve(import.meta.dirname, "..");

async function emit(name, maxWidth, qualityJpg = 82, qualityWebp = 82) {
  const srcPng = resolve(root, "img", `${name}.png`);
  if (!existsSync(srcPng)) {
    console.warn(`optimize-images: skip ${name} (missing ${srcPng}; place source PNG to regenerate)`);
    return;
  }
  const base = resolve(root, "img", name);
  const img = sharp(srcPng).rotate();
  const resized = img.resize({ width: maxWidth, withoutEnlargement: true });
  await resized.clone().jpeg({ quality: qualityJpg, mozjpeg: true }).toFile(`${base}.jpg`);
  await resized.clone().webp({ quality: qualityWebp }).toFile(`${base}.webp`);
  const meta = await sharp(`${base}.jpg`).metadata();
  console.log(`${name}: ${meta.width}x${meta.height} -> ${base}.jpg / ${base}.webp`);
}

await emit("hero-profile", 720);
await emit("about-illustration", 960);
console.log("optimize-images: done");
