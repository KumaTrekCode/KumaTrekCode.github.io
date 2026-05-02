# KumaTrekCode.github.io / ユーザーサイト用リポジトリ

Static personal portfolio for **GitHub Pages** (`https://kumatrekcode.github.io/`). Clone into a folder named **`KumaTrekCode.github.io`** if you like paths to match the remote.

**レイヤー分け:** ルート直下は **GitHub Pages の公開ドキュメントルート**（HTML / CSS / 画像 / 制作物）。**`tools/`** はナビの注入・画像最適化・サイト用 JSON など **npm からだけ触る保守用**です（URL では配信されません）。

**Important:** After `npm run sync`, **CSS / images / in-page links use paths relative to each HTML file** (e.g. top page uses `assets/…`, nested pages use `../assets/…` or deeper prefixes). This works on **GitHub Pages** and when you open the site under a **subfolder** (e.g. VS Code Live Server: `http://127.0.0.1:5500/KumaTrekCode.github.io/index.html`). **`404.html` keeps `/…` URLs** for nav and CSS so unknown-path requests still load styles on production; nested Live Server may still show MIME errors for 404—use `npx serve` from this folder to preview 404 if needed.

---

## Repository layout / ディレクトリ構成

### 公開サイト（ルート＝ Pages のドキュメントルート）

| Path | Purpose |
|------|---------|
| `index.html` | Home（更新・短文は **X** の埋め込み `#x-feed` とナビの外部リンクで代用） |
| `404.html` | GitHub Pages 404 |
| `assets/` | 共有 CSS・ファビコンなど |
| `img/` | 画像（最適化済み JPG/WebP と、任意のソース PNG） |
| `projects/` | 制作物ページ（例: `open-cafe/` とその `site/`） |

### 保守用 `tools/`（同期・設定・パーシャル）

| Path | Purpose |
|------|---------|
| `tools/site.config.json` | **`socialX`**（ナビの X URL）と **`canonicalSite`**（メモ用）。`npm run sync` が読み込み。 |
| `tools/partials/site-nav.html` | 共通ナビのひな形（`{{REL}}` + `{{X_URL}}` を sync が埋める） |
| `tools/partials/site-nav-root.html` | **`404.html` 専用**ナビ（`/…` のまま） |
| `tools/sync-site.mjs` | 各 HTML の `<!-- site:nav:start -->`〜`end` にナビを差し込み、`/assets/` などを**相対パスに書き換え** |
| `tools/optimize-images.mjs` | `img/*.png` マスターから **`img/*.jpg` / `*.webp`** を生成（Sharp） |

### その他

| Path | Purpose |
|------|---------|
| `package.json` / `package-lock.json` | npm スクリプトと依存（html-validate, sharp） |
| `.htmlvalidate.json` | `html-validate` の設定（リポジトリルートで実行） |
| `.github/workflows/ci.yml` | `npm ci` → `sync` → `validate` |
| `.editorconfig` / `.gitignore` | エディタ・Git の共通設定 |

---

## Maintenance / 運用メモ（1〜5の対応）

### 1. 画像を差し替える

1. 必要なら **`img/hero-profile.png`** / **`img/about-illustration.png`** を置く（高解像度のマスター用）。リポジトリには含めなくてもよい（容量削減）。含める場合は再コミット。
2. `npm install`（初回または `package.json` 変更後）
3. `npm run optimize-images` → `hero-profile` / `about-illustration` の **JPG・WebP** を再生成。
4. `index.html` の `<picture>` 内 **`width` / `height`** が実寸とずれたら、生成後のピクセルに合わせて更新。

### 2. ナビを変える

- **`tools/partials/site-nav.html`**（および必要なら **`tools/partials/site-nav-root.html`**）を編集。
- 続けて **`npm run sync`**。各 HTML の `<!-- site:nav:start -->`〜`<!-- site:nav:end -->` 内が上書きされます。
- **手でナビだけ直さない**（次回 `sync` で消えるため）。必ずパーシャル経由にする。

### 3. サイト URL（カスタムドメインなど）

- **`tools/site.config.json`** の `canonicalSite` を手元のメモとして更新（現状 `sync` は参照しません）。
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
