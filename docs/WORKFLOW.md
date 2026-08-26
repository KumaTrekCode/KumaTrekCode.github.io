# サイト保守ワークフロー

GitHub Pages 用の静的 HTML リポジトリ向けの、変更から公開までの手順です。

**Open Cafe の WP 書き出しを AI で整える・`gh-pages-static` から rsync する**ときは、コピペ用プロンプトを **[docs/prompts/README.md](./prompts/README.md)** にまとめてあります（内容は随時更新してください）。

## よく触るファイル

| 目的 | 触る場所 |
|------|----------|
| 共通ナビ | `tools/partials/site-nav.html`（`404` 用は `site-nav-root.html`） |
| フッター | `tools/partials/site-footer.html` |
| About の長文（Introduction 〜 Future） | `tools/partials/about-sections.html`（`about.html` の `<!-- site:about-sections:* -->` 間に注入） |
| 正規 URL・OG・サイトマップ・ページタイトル | `tools/site.config.json`（`canonicalSite` / `ogImage` / **`ogImageByPage`** / **`sitemapUrls`** / **`pageMeta`** / 任意 **`syncHtmlWarnIgnorePrefixes`** / `socialX`） |
| 共有色・フォントなど | `assets/css/tokens.css`（各 CSS は `@import "./tokens.css"`） |
| Gemini アイコンと About カードの対応 | **[tools/IMAGES.md](../tools/IMAGES.md)** |
| **sync が触る HTML の一覧** | **`tools/sync-html-allowlist.json`**（パスを増やしたらここに追記） |
| **トップ `#works` の制作物カード（一覧の単一の正）** | **`tools/projects.json`**（`npm run sync` の前に `render-works` が自動実行され、`index.html` の `<!-- site:works:start -->`〜`end` を再生成）。ヒーロー直下の紹介文は `index.html` 側のため、**タイトル・一言説明の文言は `projects.json` を優先**し、トップ本文は重複表現を避ける |

## 新規制作物（静的）を追加するとき

別リポジトリで開発したサイトを、この Pages リポジトリに **静的成果物として** 載せる場合の典型手順です。

1. **`projects/<slug>/`** に公開用ファイルを置く（例: `index.html`、説明用 `index.html`、成果本体を `site/` などに分離）。
2. **`tools/sync-html-allowlist.json`** に、そのディレクトリ配下で `npm run sync` させたい **`.html` のパスを追加**。
3. **`package.json` の `validate` スクリプト** に、同じ HTML パスを **html-validate 対象として追加**。
4. **`tools/projects.json`** の `projects` 配列にオブジェクトを追加（`title` / `description` / `detailHref` / `ctaLabel`、任意で `note`）。トップのヒーロー文を変える場合は、**カードと同じ事実が二重に書かれていないか**だけ確認する。
5. そのページ用の **OG プレビュー画像**を変えたいときは、画像ファイルをリポジトリに追加し、**`tools/site.config.json` の `ogImageByPage`** に「HTML の相対パス → `/から始まる画像パス`」を追加する（未設定なら全体の **`ogImage`** が使われる）。
6. **`npm run sync`**（内部で `render-works` → `sync-site`）を実行し、差分をコミット。

`npm run sync` の終了時、allowlist に無い **ルート配下・`projects/` 配下の `.html`** があると **警告**が出ます（`tools/` 配下は対象外）。**`syncHtmlWarnIgnorePrefixes`** に載ったパス接頭辞配下は警告を出さない（例: WP 書き出しのみ増えるディレクトリ）。**自サイト用の新規 HTML** は **`tools/sync-html-allowlist.json` に追記**する。あわせて **`pageMeta`** にキーを足すと `<title>` / `description` を一元管理できる。

## 別リポジトリ（動的サイトなど）との関係

- **このリポジトリ**は GitHub Pages の **ドキュメントルート**として、**ビルド済みの静的ファイル**を置く想定です。
- **動的フレームワークのリポジトリ**は別のままにし、CI で `npm run build` などの成果物だけを **手でコピー**するか、**GitHub Actions で artifact をこの repo に push / PR** するか、方針を決めると保守しやすいです（Submodule 運用も可。チームや将来の自分が迷わないよう、方針を README に一言残すとよいです）。
- 公開 URL を **同一オリジン**にまとめるなら「静的出力を `projects/<name>/` に置く」形がシンプルです。別サブドメインに置く場合は、`lint:links` のスキップや外部リンクの扱いだけ `site.config.json` を確認してください。

## 手順チェックリスト

1. **パーシャルや `site.config.json` を編集したら**  
   `npm run sync` — 先に **`tools/render-works.mjs`** が `index.html` の **`#works`** を `tools/projects.json` から再生成し、その後に各 HTML の `<!-- site:* -->`（ナビ・フッター・**About 長文**）、**`pageMeta` に基づく `<title>` / description / OG タイトル説明**、`og:url` / `og:image`、**`robots.txt` / `sitemap.xml`** を設定に合わせて書き換えます。  
   **同期対象**は `tools/sync-html-allowlist.json` に列挙されたファイルのみです（新しい `.html` を sync させたいときはパスを追加）。

2. **トップや About の写真を差し替えたら**  
   `npm run optimize-images` — マスターは README の「画像」節に従います。

3. **スキルアイコン用 PNG を差し替えたら**  
   `npm run build:icons`（`npm run check` にも含まれます）。対応表は **`tools/IMAGES.md`**。  
   **GitHub Actions（`CI=true`）**では、`GEMINI_TO_KEY` の各キーについて **`img/source/icon-skill-{key}.png` が必須**です。マスターが欠けるとビルドは失敗します。

4. **プッシュ前**  
   `npm run check` — `sync` → **`minify:client`**（`scroll-top.min.js`）→ `build:icons` → `html-validate` → **`verify:og`** → **`smoke:html`** → **`lint:js`**（`tools/**/*.mjs` の ESLint）→ **`lint:links`** → **`lint:a11y`** → `npm audit --audit-level=high`。

5. **リンクスキップを手で上書きしたい場合**  
   `tools/site.config.json` に **`linkinatorSkip`**（文字列・1 本の正規表現）を書くと、`lint:links` はそれをそのまま `--skip` に使います（未設定時は `canonicalSite` と X/Twitter/Instagram 向けパターンを自動生成。Instagram は wp-export 経由の 429 フレークを避けるため）。

6. **コミット**  
   `sync` 済みの HTML をコミットしてください（ナビ・フッター・X ブロック・OG は sync が再生成するため、手でだけ直した変更は次回の sync で消えます）。

7. **`main` へ push**  
   GitHub Actions の CI が `npm run check` を実行します。ローカルで `simple-git-hooks` が有効なら、`pre-push` で同じチェックが走ります。

8. **依存パッケージの見直し（目安: 四半期に一度）**  
   `npm run deps:report`（`npm outdated` のラッパー。終了コードは常に 0）で古い依存を確認し、問題があれば `package.json` を更新してから `npm install` と `npm run check` を回してください。自動修正は **`npm audit fix`** を手元で検討（CI は `audit --audit-level=high` のみ）。

9. **Dependabot**  
   **`.github/dependabot.yml`** により、**npm 依存**に対して週次でバージョン更新の PR が作成されることがあります。CI の `npm run check` が通るか確認してからマージしてください。

## アクセシビリティ（a11y）

- ローカル / CI では **`npm run lint:a11y`** が **axe-core + jsdom** で主要ページを検査します（外部スクリプトは実行されないため、動的に生成される DOM は対象外です）。
- ルールの無効化は環境変数 **`AXE_DISABLE_RULES`**（カンマ区切りのルール ID）で調整できます。
- **毎月 1 日 12:00 UTC** に **`.github/workflows/a11y-monthly.yml`** が同じ `lint:a11y` を実行します（手動は **Actions → Accessibility (monthly) → Run workflow**）。

## ローカルプレビュー

```bash
npm install
npm run sync
npx serve .
```

404 の挙動まで見る場合は、ルートで `serve` してから存在しないパスを開いてください。

## 大きいバイナリ

数十 MB 級の画像や PSD をリポジトリに載せる場合は **Git LFS** の利用を検討してください（`.gitattributes` で `*.psd` などを指定）。通常のポートフォリオ用 JPG/WebP は LFS なしで問題ないことが多いです。
