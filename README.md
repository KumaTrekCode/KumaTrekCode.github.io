# KumaTrekCode.github.io / ユーザーサイト用リポジトリ

Static personal portfolio for **GitHub Pages** (`https://kumatrekcode.github.io/`). Clone into a folder named **`KumaTrekCode.github.io`** if you like paths to match the remote.

**Important:** After `npm run sync`, **CSS / images / in-page links use paths relative to each HTML file** (e.g. top page uses `assets/…`, `blog/` uses `../assets/…`). This works on **GitHub Pages** and when you open the site under a **subfolder** (e.g. VS Code Live Server: `http://127.0.0.1:5500/KumaTrekCode.github.io/index.html`). **`404.html` keeps `/…` URLs** for nav and CSS so unknown-path requests still load styles on production; nested Live Server may still show MIME errors for 404—use `npx serve` from this folder to preview 404 if needed.

---

## Repository layout / ディレクトリ構成

| Path | Purpose |
|------|---------|
| `site.config.json` | **Canonical site URL** (reference / future use) and **`socialX`** for the nav link; `npm run sync` injects nav + X only. |
| `partials/site-nav.html` | **Shared navigation** (path-relative); `{{REL}}` + `{{X_URL}}` filled by `npm run sync`. |
| `partials/site-nav-root.html` | **404 only:** nav links stay `/…` for GitHub Pages odd URLs. |
| `scripts/sync-site.mjs` | Injects nav + rewrites `/assets/`, `/img/`, `/blog/`, `/projects/` to **path-relative** URLs per page (404 keeps `/` for nav + CSS). |
| `scripts/optimize-images.mjs` | Builds `img/*.jpg` + `img/*.webp` from **`img/hero-profile.png`** and **`img/about-illustration.png`** when present (Sharp). |
| `index.html` | Home |
| `img/hero-profile.{jpg,webp}` | Hero + `og:image` (optimized) |
| `img/about-illustration.{jpg,webp}` | About section |
| `assets/css/style.css` | Shared styles |
| `assets/favicon.svg` | Tab icon |
| `blog/` | Blog |
| `projects/open-cafe/` | Sample work + optional `site/` |
| `404.html` | GitHub Pages 404 |
| `.github/workflows/ci.yml` | Runs `npm run sync` + `html-validate` on push / PR |

---

## Maintenance / 運用メモ（1〜5の対応）

### 1. 画像を差し替える

1. 必要なら **`img/hero-profile.png`** / **`img/about-illustration.png`** を置く（高解像度のマスター用）。リポジトリには含めなくてもよい（容量削減）。含める場合は再コミット。
2. `npm install`（初回または `package.json` 変更後）
3. `npm run optimize-images` → `hero-profile` / `about-illustration` の **JPG・WebP** を再生成。
4. `index.html` の `<picture>` 内 **`width` / `height`** が実寸とずれたら、生成後のピクセルに合わせて更新。

### 2. ナビを変える

- **`partials/site-nav.html`** を編集（ルート相対パス `/index.html` などを維持）。
- 続けて **`npm run sync`**。各 HTML の `<!-- site:nav:start -->`〜`<!-- site:nav:end -->` 内が上書きされます。
- **手でナビだけ直さない**（次回 `sync` で消えるため）。必ずパーシャル経由にする。

### 3. サイト URL（カスタムドメインなど）

- **`site.config.json`** の `canonicalSite` を手元のメモとして更新（現状 `sync` は参照しません）。
- **`index.html`** の `og:url` と `og:image` の **絶対 URL** を、新しいドメインに合わせて直接書き換えてください（GitHub Pages の「ブランチ直公開」ではビルド工程がないため）。
- ナビのパスは **`/` 始まりのルート相対**のままなので、**同一サイト内のパス構成が変わらない限り**はそのままで大丈夫です。

### 4. ローカル確認

```bash
npm install
npm run sync
npx serve .
```

ブラウザで表示された URL（通常 `http://localhost:3000`）からトップを開くと `/assets/…` が解決されます。

### 5. CI（HTML チェック）

`main` への push / PR で **GitHub Actions** が `npm ci` → `npm run sync` → `npm run validate` を実行します。ローカルでも **`npm run check`**（`sync` + `validate`）を推奨します。

---

## English

- **Language:** Japanese-only page copy (static HTML).
- **SEO:** Per-page `meta name="description"`; home includes Open Graph + `twitter:card`. `og:image` uses the optimized hero JPEG.
- **GitHub Pages:** Publish from branch **`main`**, folder **`/ (root)`** (or adjust to match your settings).
- **Editor:** `.editorconfig` for UTF-8 / LF / 2-space indentation.

---

## 日本語

- **言語:** サイト本文は日本語のみの静的 HTML です。
- **SEO:** 各ページに `description`。トップは OGP と `twitter:card`。`og:image` は軽量な `hero-profile.jpg` を参照します。
- **GitHub Pages:** ブランチ `main` のルートから公開する想定です。
- **エディタ:** `.editorconfig` で整形の基準を揃えています。

## Further ideas (optional) / さらにやるなら（任意）

- **`robots.txt`** / Search Console 連携
- **`apple-touch-icon.png`**
- 記事が増えたら **目次ページ**や **タグ**の設計
