# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-05-09

### Added

- Static GitHub Pages portfolio (Home, Profile / About, Open cafe project summary).
- `tools/` pipeline: `render-works`, `sync-site` (nav, footer, About body partial, OG), link and a11y lint scripts.
- `robots.txt` and `sitemap.xml` for `https://kumatrekcode.github.io`.
- Per-page Open Graph images via `tools/site.config.json` (`ogImage`, `ogImageByPage`) and `npm run verify:og`.

### Changed

- Portfolio project page styles live in `assets/css/portfolio-project.css` (imported from `style.css`).
