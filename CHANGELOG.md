# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-05-09

### Added

- Static GitHub Pages portfolio (Home, Profile / About, Open cafe project summary).
- `tools/` pipeline: `render-works`, `sync-site` (nav, footer, About body partial, OG), link and a11y lint scripts.
- `robots.txt` and `sitemap.xml` generated from `tools/site.config.json` on each `npm run sync`.
- Per-page Open Graph images via `tools/site.config.json` (`ogImage`, `ogImageByPage`) and `npm run verify:og`.
- `pageMeta` in `site.config.json` for `<title>` / description / OG title & description on main pages.
- `npm run smoke:html`, `npm run lint:js` (ESLint for `tools/**/*.mjs`), `npm run minify:client` (esbuild → `scroll-top.min.js`).

### Changed

- Portfolio project page styles live in `assets/css/portfolio-project.css` (imported from `style.css`).
- Sticky header / scroll-to-top z-index use CSS tokens `--z-header` / `--z-scroll-top` in `tokens.css`.
