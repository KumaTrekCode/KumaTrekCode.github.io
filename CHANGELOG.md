# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Changes since 1.0.0 (2026-05-09). Headings only. The YouTube ranking job is one line.

### Added

- Agent harness, task loop, and learning-note / roadmap-wall docs.
- `REPO_SUMMARY`, stocktake notes, and the reduce / align / sustain file rule.
- Open Cafe wp-export a11y registration and kuma-patch wiring.

### Changed

- YouTube dashboard daily ranking updates continued (148 commits in this period).
- CI moved to Node 22, with `actions/checkout` and `actions/setup-node` at v5. Default link check skips Instagram.
- Dev dependencies on main: esbuild 0.28.2, globals 17.13.0, simple-git-hooks 2.14.0, axe-core 4.14.0, jsdom 30.1.3, eslint 10.14.0, html-validate 11.18.0, linkinator 8.1.0. The 2026-11-07 merges are #78, #69, #82, #84, #85, #86, and #68.

### Fixed

- npm audit high findings cleared, including sharp 0.35.5 and undici 8.12.4 (2026-11-07). Moderate findings remain and do not fail `audit:ci`.

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
