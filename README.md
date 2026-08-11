# KumaTrekCode.github.io / ユーザーサイト用リポジトリ

Static personal portfolio for **GitHub Pages** (`https://kumatrekcode.github.io/`). Clone into a folder named **`KumaTrekCode.github.io`** if you like paths to match the remote.

**運用の流れ:** 変更から push までの手順は **[docs/WORKFLOW.md](docs/WORKFLOW.md)** にまとめています。

**Agent harness / loop:** AI エージェント向けの契約は **[AGENTS.md](AGENTS.md)**、実装キューは **[ROADMAP.md](ROADMAP.md)**（`npm run task:next` で次の1件）。品質の合格条件は既存の **`npm run check`**。仕組みの説明は **[docs/harness-and-loop.md](docs/harness-and-loop.md)**。学習メモ（knowledge）と実装キューは分けて運用する。

**レイヤー分け:** ルート直下は **GitHub Pages の公開ドキュメントルート**（HTML / CSS / 画像 / 制作物）。**`tools/`** はナビの注入・画像最適化・サイト用 JSON など **npm からだけ触る保守用**です（URL では配信されません）。

**別リポジトリの制作物:** 動的サイトや別プロジェクトのリポジトリはそのままにし、**静的ビルドの出力だけ**をこの repo の `projects/<名前>/` に置く運用が分かりやすいです（成果物のコピー or Actions で PR／デプロイ）。方針を決めたら README か [docs/WORKFLOW.md](docs/WORKFLOW.md) に一言残しておくと、後から見たときに迷いません。

**Important:** After `npm run sync`, **CSS / images / in-page links use paths relative to each HTML file** (e.g. top page uses `assets/…`, nested pages use `../assets/…` or deeper prefixes). This works on **GitHub Pages** and when you open the site under a **subfolder** (e.g. VS Code Live Server: `http://127.0.0.1:5500/KumaTrekCode.github.io/index.html`). **`404.html` keeps `/…` URLs** for nav and CSS so unknown-path requests still load styles on production; nested Live Server may still show MIME errors for 404—use `npx serve` from this folder to preview 404 if needed.

---

## CSS maintenance / CSS 保守メモ（共通化ルール）

- **Layout widths**: `assets/css/tokens.css` の `--container` / `--content` / `--container-wide` を唯一の基準にする（数値を各 CSS に散らさない）。
- **Page padding**: `--page-pad-x` を共通で使う（nav/main など）。
- **Page CSS**: `style.css` は共通（制作物詳細ページ用は **`assets/css/portfolio-project.css`** を `@import`）、ページ固有は `about.css` のように **追加中心**で書き、共通ルールの打ち消しを増やさない。
- **Nav / Footer / About 長文ブロック**: HTML を直接編集せず、該当する **`tools/partials/*.html`** を編集してから **`npm run sync`** で注入する（手修正は次回 sync で消える）。

---

## Repository layout / ディレクトリ構成

### 公開サイト（ルート＝ Pages のドキュメントルート）

| Path | Purpose |
|------|---------|
| `index.html` | Home（**`#works`** のカードは `<!-- site:works:start/end -->` 内を **`tools/render-works.mjs`** が **`tools/projects.json`** から再生成。**ヒーロー直下の紹介文などは `index.html` 本文**で、カード一覧と二重管理にならないよう一言の差分に留める） |
| `about.html` | 自己紹介の詳細ページ（ナビ「自己紹介」はここへ） |
| `404.html` | GitHub Pages 404 |
| `assets/` | 共有 CSS（`style.css` / `about.css` は `@import` で **`tokens.css`** を参照）・ファビコンなど |
| `img/` | **配信用の**最適化済み JPG/WebP。大きいマスターは **`img/source/`** に置き、`npm run optimize-images` / `build:icons` でルートの `img/` に生成する運用（リポジトリにマスターを含めない選択も可） |
| `projects/` | 制作物ページ（例: `open-cafe/` とその `site/`、`youtube-dashboard/` のクレカ動画ランキング） |

### 保守用 `tools/`（同期・設定・パーシャル）

| Path | Purpose |
|------|---------|
| `tools/site.config.json` | **`canonicalSite`**、**`ogImage`**、**`ogImageByPage`**、**`socialX`**、**`sitemapUrls`**（`sync` が **`sitemap.xml`** を生成）、**`pageMeta`**（キーは HTML の相対パス → **`title` / `description` / 任意 `ogTitle`・`ogDescription`** を `sync` が各ページの `<head>` に反映）、**`syncHtmlWarnIgnorePrefixes`**（allowlist 外警告を抑止するパス接頭辞の配列）。**任意 `linkinatorSkip`** は `lint:links` の `--skip` にそのまま使う。 |
| `tools/partials/site-nav.html` | 共通ナビのひな形（`{{REL}}` を sync が階層用プレフィックスに置換） |
| `tools/partials/site-nav-root.html` | **`404.html` 専用**ナビ（`/…` のまま） |
| `tools/partials/site-footer.html` | 共通フッター（`<!-- site:footer:start -->` ブロックに注入） |
| `tools/partials/about-sections.html` | **`about.html`** の Profile 直下〜 Future までの長いセクション（`<!-- site:about-sections:start/end -->` に注入） |
| `tools/projects.json` | トップ **`#works`** の制作物一覧（タイトル・一言・リンク・CTA）。編集後は **`npm run sync`**（内部で `render-works` が先に走る）。 |
| `tools/render-works.mjs` | `projects.json` → `index.html` の `<!-- site:works:start -->`〜`end` を書き換え（`npm run render:works` 単体でも可）。 |
| `tools/sync-site.mjs` | **`sync-html-allowlist.json`** に列挙された HTML のみ処理。ナビ・フッター・**About 長文**、**`pageMeta`**、**OG**、**`robots.txt` / `sitemap.xml` の書き出し**、ルート相対パスの**相対パス化**。終了時、allowlist 外の `.html` は **`syncHtmlWarnIgnorePrefixes` 以外**で **警告**。 |
| `tools/sync-html-allowlist.json` | **`npm run sync` が書き換える HTML のパス一覧**（新規ページはここに追加）。 |
| `tools/IMAGES.md` | Gemini ファイル名と `icon-skill-*`・About カードの対応表。 |
| `tools/verify-og-images.mjs` | **`ogImage`** と **`ogImageByPage`** のサイト内パスがリポジトリ上に存在するか検証（`npm run verify:og`。`npm run check` に含まれる）。 |
| `tools/smoke-html.mjs` | 主要 HTML にナビ・フッター・**`scroll-top.min.js`** 等が含まれるかの軽い検査（`npm run smoke:html`）。`package.json` の **`validate` 対象パス**と揃えること。 |
| `tools/minify-scroll-top.mjs` | **`assets/js/scroll-top.js`** を **`assets/js/scroll-top.min.js`** に minify（`npm run minify:client`。`npm run check` に含まれる）。 |
| `eslint.config.js` | **`tools/**/*.mjs`** 向け ESLint（`npm run lint:js`）。 |
| `tools/lint-links.mjs` | `site.config.json` を読み **linkinator** を実行（`npm run lint:links`）。 |
| `tools/lint-a11y.mjs` / `lint-a11y-one.mjs` | **axe-core + jsdom** で主要ページの a11y チェック（`npm run lint:a11y`）。 |
| `tools/optimize-images.mjs` | トップの **`hero-profile`** は優先して **`img/source/hero-firstview.png`**（なければ `img/source/hero-profile.png` / `img/hero-profile.png`）から **`img/hero-profile.{jpg,webp}`** を生成。`about-illustration` は従来どおり `img/about-illustration.png` マスター。 |
| `tools/build-skill-icons.mjs` | `img/` の Gemini 原本を **`img/source/icon-skill-*.png`** にリネーム後、**sm / md / lg** の PNG+WebP を `img/` に出力（保有スキル用の各アイコン、**ECU**、About「今後取得」の **Web** 用など）。**`icon-skill-future-python-*`** / **`icon-skill-future-linux-*`** は About「今後取得」用の Gemini 原本を ingest して tier 化（`npm run build:icons`）。`npm run check` に含まれる。 |

### その他

| Path | Purpose |
|------|---------|
| `package.json` / `package-lock.json` | npm スクリプトと依存（html-validate, eslint, esbuild, sharp, linkinator, axe-core, jsdom, simple-git-hooks など） |
| `.htmlvalidate.json` | `html-validate` の設定（リポジトリルートで実行） |
| `.github/workflows/ci.yml` | `npm ci` → **`npm run check`**（`sync`・`minify:client`・`build:icons`・`validate`・`verify:og`・`smoke:html`・`lint:js`・`lint:links`・`lint:a11y`・`audit`）。 |
| `.github/workflows/a11y-monthly.yml` | 月次で **`npm run lint:a11y`** のみ実行（手動トリガー可）。 |
| `.github/dependabot.yml` | **npm** 依存の週次バージョン更新 PR（マージ前に `npm run check` を確認）。 |
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

**`projects/open-cafe-wp-export/` の大量アセット:** 教材用 WordPress 書き出しのため **リポジトリに含める方針**でよいが、履歴肥大や clone 時間が気になる場合は **別ブランチ／別成果物ストレージ**も検討する。`sync` の allowlist 外警告は **`syncHtmlWarnIgnorePrefixes`** で意図的に抑止している（新規の「自サイト用」HTML を増やしたときは allowlist へ追記する）。

### 2. ナビ・フッター・About の長文を変える

- **ナビ:** `tools/partials/site-nav.html`（および必要なら `site-nav-root.html`）
- **フッター:** `tools/partials/site-footer.html`
- **About（Introduction 〜 Future）:** `tools/partials/about-sections.html`（`about.html` のマーカー間に注入）
- 編集後に **`npm run sync`**。対応する `<!-- site:*:start -->`〜`end` 内が上書きされます。
- **該当ブロックを手だけ直さない**（次回 `sync` で消えるため）。必ずパーシャル経由にする。

### 2.1. WP 書き出しページの a11y 修正（Open cafe デモ）

WP 書き出しの `projects/open-cafe-wp-export/*.html` は、axe のルールにより `<dt>/<dd>` が `<dl>` 外にあると指摘されます。
必要なら次を実行して、`.access__dl` を `<dl class="access__dl">` に自動変換します。

```bash
npm run fix:wp-export-a11y
```

### 3. サイト URL・OG 画像（カスタムドメインなど）

- **`tools/site.config.json`** の **`canonicalSite`** と **`ogImage`**（サイト内パスなら先頭 `/` の相対、別 CDN なら `https://…`）を更新します。
- **ページ別の共有プレビュー画像**が必要なときは、同ファイルの **`ogImageByPage`** に「HTML の相対パス → 画像パス」を追加します（例: `"projects/open-cafe/index.html": "/projects/open-cafe/screenshot.png"`）。未指定のページは **`ogImage`** が使われます。
- **`npm run sync`** を実行すると、OG 用の **`og:url` / `og:image`** が各 HTML から一括で書き換わります。コミット前に **`npm run verify:og`**（または `npm run check`）で画像ファイルの実在を確認できます。
- カスタムドメインに変えたあと、**`canonicalSite`** を更新すれば `lint:links` の本番オリジン用スキップは追従します。別パターンが必要なときだけ **`tools/site.config.json` の `linkinatorSkip`** を設定してください。
- **`npm run sync`** のたびに **`robots.txt`** と **`sitemap.xml`** を **`canonicalSite`** と **`sitemapUrls`** から再生成**する。URL を増やすときは **`tools/site.config.json` の `sitemapUrls`** を編集する（手で `sitemap.xml` だけ直すと次回 sync で上書きされる）。

### 3.1. ページの `<title>` と `description`（一元管理）

- 主要ページの **`<title>`**、**`meta name="description"`**、**`og:title` / `og:description`**（タグがあるページのみ）は **`tools/site.config.json` の `pageMeta`** を編集し、**`npm run sync`** で HTML に反映する。該当キーは **`sync-html-allowlist.json` と同じ相対パス**（例: `"index.html"`、`"projects/open-cafe/index.html"`）。**`ogTitle` / `ogDescription` を省略**すると `title` / `description` と同じ文面になる。
- Open cafe のように **OG タイトル行が無い HTML** では `pageMeta` の `ogTitle` は反映されない。OG まで揃えたいときは当該 HTML に **`meta property="og:title"`**（および必要なら **`og:description`**）を置いてから sync する。

### 3.2. クライアント JS の minify

- 先頭へ戻るボタン用の **`assets/js/scroll-top.js`** を編集したら **`npm run check`**（または **`npm run minify:client`**）で **`assets/js/scroll-top.min.js`** を再生成してコミットする。配信はフッターパーシャル経由で **`.min.js`** を参照している。

### 4. ローカル確認

```bash
npm install
npm run sync
npx serve .
```

ブラウザで表示された URL（通常 `http://localhost:3000`）からトップを開くと `/assets/…` が解決されます。

### 5. CI と Git フック

`main` への push / PR で **GitHub Actions** が **`npm run check`** を実行します（`sync`・`minify:client`・`build:icons`・`validate`・`verify:og`・`smoke:html`・`lint:js`・`lint:links`・`lint:a11y`・`npm audit --audit-level=high`）。**`npm run deps:report`**（`npm outdated`）で依存の棚卸し目安にできます。

`npm install` 後は **`simple-git-hooks`** が有効になり、**`pre-push`** で同じ `npm run check` が走ります（初回のみ `.git` がある環境で `prepare` がフックを書き込みます）。

---

## English

- **Language:** Japanese-only page copy (static HTML).
- **SEO:** Per-page `meta name="description"` and `<title>` are driven by **`tools/site.config.json` → `pageMeta`** on sync; key pages include Open Graph + `twitter:card`. `og:url` / `og:image` are filled from the same config when you run **`npm run sync`**. **`robots.txt`** / **`sitemap.xml`** are regenerated from **`canonicalSite`** / **`sitemapUrls`** each sync.
- **GitHub Pages:** Publish from branch **`main`**, folder **`/ (root)`** (or adjust to match your settings).
- **Editor:** `.editorconfig` for UTF-8 / LF / 2-space indentation.

---

## 日本語

- **言語:** サイト本文は日本語のみの静的 HTML です。
- **SEO:** `<title>` と `description` は **`tools/site.config.json` の `pageMeta`** と **`npm run sync`** で揃えます。主要ページは OGP と `twitter:card`。`og:url` / `og:image` も同設定です。**`robots.txt` / `sitemap.xml`** は **`canonicalSite` / `sitemapUrls`** から sync が再生成します。
- **GitHub Pages:** ブランチ `main` のルートから公開する想定です。
- **エディタ:** `.editorconfig` で整形の基準を揃えています。

## Further ideas (optional) / さらにやるなら（任意）

- Search Console 連携（**`sitemap.xml`** はルートにあります）
- **`apple-touch-icon.png`**
- 記事が増えたら **目次ページ**や **タグ**の設計
