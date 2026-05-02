# KumaTrekCode.github.io / ユーザーサイト用リポジトリ

Static personal portfolio for **GitHub Pages** (`https://KumaTrekCode.github.io/`). Clone this repo into a folder named **`KumaTrekCode.github.io`** so local paths match GitHub and documentation.

## Repository layout / ディレクトリ構成

| Path | Purpose |
|------|---------|
| `index.html` | Home |
| `assets/css/style.css` | Shared styles |
| `assets/favicon.svg` | Tab icon (simple bear motif) |
| `blog/` | Blog index + one HTML file per post |
| `projects/open-cafe/` | Sample work page + optional `site/` build output |
| `404.html` | GitHub Pages custom 404 (uses root-relative `/assets/…`; use `npx serve` locally to preview) |

## English

- **Language:** Page copy is **Japanese only** (static HTML).
- **SEO / sharing:** Each main HTML page has a `<meta name="description">`. The home page also has basic Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image` pointing at `img/profile.jpeg`).
- **Local preview:** `npx serve .` from this directory (recommended). Opening `index.html` via `file://` still works for most pages, but **`404.html` expects a site root** (`/assets/…`).
- **GitHub Pages:** Enable **Settings → Pages** on branch `main`, folder `/ (root)` when you want the site live.
- **Editor defaults:** `.editorconfig` keeps UTF-8, LF, 2-space indentation consistent across editors.

---

## 日本語

- **言語:** サイト本文は **日本語のみ** の静的 HTML です。
- **検索・シェア:** 主要ページに `<meta name="description">` を入れています。トップには OGP（`og:*`）と X 用 `twitter:card` もあり、`og:image` は `img/profile.jpeg` を参照します。
- **ローカル確認:** このディレクトリで `npx serve .` を推奨します。`file://` で `index.html` を開くこともできますが、**`404.html` はサイトルート前提**（`/assets/…`）です。
- **GitHub Pages:** 公開するときに **Settings → Pages** で `main` と `/ (root)` を選びます。
- **エディタ設定:** `.editorconfig` で UTF-8・改行 LF・2スペースインデントを揃えます。

## Further ideas (optional) / さらにやるなら（任意）

- Add **`robots.txt`** / **`meta name="description"`** when you care about search snippets.
- **`og:image`** when you want prettier social cards.
- If navigation grows, introduce a **small static site generator** (e.g. Eleventy) only as a build step, still deploying plain HTML to Pages.
