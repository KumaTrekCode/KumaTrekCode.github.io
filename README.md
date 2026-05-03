# KumaTrekCode.github.io / ユーザーサイト用リポジトリ

Static personal portfolio for **GitHub Pages** (`https://kumatrekcode.github.io/`). Clone into a folder named **`KumaTrekCode.github.io`** if you like paths to match the remote.

**運用の流れ:** 変更から push までの手順は **[docs/WORKFLOW.md](docs/WORKFLOW.md)** にまとめています。

**レイヤー分け:** ルート直下は **GitHub Pages の公開ドキュメントルート**（HTML / CSS / 画像 / 制作物）。**`tools/`** はナビの注入・画像最適化・サイト用 JSON など **npm からだけ触る保守用**です（URL では配信されません）。

**Important:** After `npm run sync`, **CSS / images / in-page links use paths relative to each HTML file** (e.g. top page uses `assets/…`, nested pages use `../assets/…` or deeper prefixes). This works on **GitHub Pages** and when you open the site under a **subfolder** (e.g. VS Code Live Server: `http://127.0.0.1:5500/KumaTrekCode.github.io/index.html`). **`404.html` keeps `/…` URLs** for nav and CSS so unknown-path requests still load styles on production; nested Live Server may still show MIME errors for 404—use `npx serve` from this folder to preview 404 if needed.

---

## Repository layout / ディレクトリ構成

### 公開サイト（ルート＝ Pages のドキュメントルート）

| Path | Purpose |
|------|---------|
| `index.html` | Home（**X** 埋め込み `#x-feed` は `tools/partials/home-x-feed.html` から注入、制作物は `#works`） |
| `about.html` | 自己紹介の詳細ページ（ナビ「自己紹介」はここへ） |
| `404.html` | GitHub Pages 404 |
| `assets/` | 共有 CSS（`style.css` / `about.css` は `@import` で **`tokens.css`** を参照）・ファビコンなど |
| `img/` | **配信用の**最適化済み JPG/WebP。大きいマスターは **`img/source/`** に置き、`npm run optimize-images` / `build:icons` でルートの `img/` に生成する運用（リポジトリにマスターを含めない選択も可） |
| `projects/` | 制作物ページ（例: `open-cafe/` とその `site/`） |

### 保守用 `tools/`（同期・設定・パーシャル）

| Path | Purpose |
|------|---------|
| `tools/site.config.json` | **`canonicalSite`**（正規 URL）、**`ogImage`**、**`socialX`**。`sync` が OG に利用。**任意で `linkinatorSkip`**（1 本の正規表現）を書くと `lint:links` の `--skip` にそのまま使う。未指定時は `canonicalSite` のオリジンと X/Twitter を自動スキップ。 |
| `tools/partials/site-nav.html` | 共通ナビのひな形（`{{REL}}` を sync が階層用プレフィックスに置換） |
| `tools/partials/site-nav-root.html` | **`404.html` 専用**ナビ（`/…` のまま） |
| `tools/partials/site-footer.html` | 共通フッター（`<!-- site:footer:start -->` ブロックに注入） |
| `tools/partials/home-x-feed.html` | トップの X 埋め込みブロック（`<!-- site:home-x-feed:start -->` に注入） |
| `tools/sync-site.mjs` | **`sync-html-allowlist.json`** に列挙された HTML のみ処理。ナビ・フッター・X ブロック、**`site.config` に基づく OG**、ルート相対パスの**相対パス化**。 |
| `tools/sync-html-allowlist.json` | **`npm run sync` が書き換える HTML のパス一覧**（新規ページはここに追加）。 |
| `tools/IMAGES.md` | Gemini ファイル名と `icon-skill-*`・About カードの対応表。 |
| `tools/lint-links.mjs` | `site.config.json` を読み **linkinator** を実行（`npm run lint:links`）。 |
| `tools/lint-a11y.mjs` / `lint-a11y-one.mjs` | **axe-core + jsdom** で主要ページの a11y チェック（`npm run lint:a11y`）。 |
| `tools/optimize-images.mjs` | トップの **`hero-profile`** は優先して **`img/source/hero-firstview.png`**（なければ `img/source/hero-profile.png` / `img/hero-profile.png`）から **`img/hero-profile.{jpg,webp}`** を生成。`about-illustration` は従来どおり `img/about-illustration.png` マスター。 |
| `tools/build-skill-icons.mjs` | `img/` の Gemini 原本を **`img/source/icon-skill-*.png`** にリネーム後、**sm / md / lg** の PNG+WebP を `img/` に出力（保有スキル用の各アイコン、**ECU**、About「今後取得」の **Web** 用など）。**`icon-skill-future-python-*`** / **`icon-skill-future-linux-*`** は About「今後取得」用の Gemini 原本を ingest して tier 化（`npm run build:icons`）。`npm run check` に含まれる。 |

### その他

| Path | Purpose |
|------|---------|
| `package.json` / `package-lock.json` | npm スクリプトと依存（html-validate, sharp, linkinator, axe-core, jsdom, simple-git-hooks など） |
| `.htmlvalidate.json` | `html-validate` の設定（リポジトリルートで実行） |
| `.github/workflows/ci.yml` | `npm ci` → **`npm run check`**（`sync`・`build:icons`・`validate`・`lint:links`・`lint:a11y`・`audit`）。 |
| `.github/workflows/a11y-monthly.yml` | 月次で **`npm run lint:a11y`** のみ実行（手動トリガー可）。 |
| `.editorconfig` / `.gitignore` | エディタ・Git の共通設定 |

---

## Maintenance / 運用メモ（詳細は [docs/WORKFLOW.md](docs/WORKFLOW.md)）

### 1. 画像を差し替える

1. **方針:** 編集用の大きい PNG やカメラ原本は **`img/source/`**（必要なら Git LFS）に置き、**公開用の軽量ファイル**（`img/*.jpg` / `*.webp` など）はスクリプトで生成してコミットする、という分離を推奨します。
2. トップ画像のマスターは **`img/source/hero-firstview.png`**（または `img/source/hero-profile.png` / `img/hero-profile.png`）。About 用イラストは **`img/about-illustration.png`**。リポジトリに含めるかは任意。
3. `npm install`（初回または `package.json` 変更後）
4. `npm run optimize-images` → `hero-profile` / `about-illustration` の **JPG・WebP** を再生成。
5. `index.html` の `<picture>` 内 **`width` / `height`** が実寸とずれたら、生成後のピクセルに合わせて更新。

**数十 MB 級のデータ**を履歴に載せる場合は **[Git LFS](https://git-lfs.com/)**（`.gitattributes` でパス指定）を検討してください。

### 2. ナビ・フッター・トップの X ブロックを変える

- **ナビ:** `tools/partials/site-nav.html`（および必要なら `site-nav-root.html`）
- **フッター:** `tools/partials/site-footer.html`
- **X 埋め込み:** `tools/partials/home-x-feed.html`
- 編集後に **`npm run sync`**。対応する `<!-- site:*:start -->`〜`end` 内が上書きされます。
- **該当ブロックを手だけ直さない**（次回 `sync` で消えるため）。必ずパーシャル経由にする。

### 3. サイト URL・OG 画像（カスタムドメインなど）

- **`tools/site.config.json`** の **`canonicalSite`** と **`ogImage`**（サイト内パスなら先頭 `/` の相対、別 CDN なら `https://…`）を更新します。
- **`npm run sync`** を実行すると、OG 用の **`og:url` / `og:image`** が各 HTML から一括で書き換わります。
- カスタムドメインに変えたあと、**`canonicalSite`** を更新すれば `lint:links` の本番オリジン用スキップは追従します。別パターンが必要なときだけ **`tools/site.config.json` の `linkinatorSkip`** を設定してください。

### 4. ローカル確認

```bash
npm install
npm run sync
npx serve .
```

ブラウザで表示された URL（通常 `http://localhost:3000`）からトップを開くと `/assets/…` が解決されます。

### 5. CI と Git フック

`main` への push / PR で **GitHub Actions** が **`npm run check`** を実行します（`sync`・`build:icons`・`validate`・`lint:links`・`lint:a11y`・`npm audit --audit-level=high`）。**`npm run deps:report`**（`npm outdated`）で依存の棚卸し目安にできます。

`npm install` 後は **`simple-git-hooks`** が有効になり、**`pre-push`** で同じ `npm run check` が走ります（初回のみ `.git` がある環境で `prepare` がフックを書き込みます）。

---

## English

- **Language:** Japanese-only page copy (static HTML).
- **SEO:** Per-page `meta name="description"`; key pages include Open Graph + `twitter:card`. `og:url` / `og:image` are filled from **`tools/site.config.json`** when you run **`npm run sync`**.
- **GitHub Pages:** Publish from branch **`main`**, folder **`/ (root)`** (or adjust to match your settings).
- **Editor:** `.editorconfig` for UTF-8 / LF / 2-space indentation.

---

## 日本語

- **言語:** サイト本文は日本語のみの静的 HTML です。
- **SEO:** 各ページに `description`。主要ページは OGP と `twitter:card`。`og:url` / `og:image` は `tools/site.config.json` と `npm run sync` で揃えます。
- **GitHub Pages:** ブランチ `main` のルートから公開する想定です。
- **エディタ:** `.editorconfig` で整形の基準を揃えています。

## Further ideas (optional) / さらにやるなら（任意）

- **`robots.txt`** / Search Console 連携
- **`apple-touch-icon.png`**
- 記事が増えたら **目次ページ**や **タグ**の設計
