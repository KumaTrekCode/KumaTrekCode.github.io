import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as esbuild from "esbuild";

const root = resolve(import.meta.dirname, "..");
const srcPath = resolve(root, "assets", "js", "scroll-top.js");
const outPath = resolve(root, "assets", "js", "scroll-top.min.js");

const src = readFileSync(srcPath, "utf8");
const out = await esbuild.transform(src, {
  minify: true,
  target: "es2020",
});
writeFileSync(outPath, out.code, "utf8");
console.log("minify-scroll-top: ok", outPath);
