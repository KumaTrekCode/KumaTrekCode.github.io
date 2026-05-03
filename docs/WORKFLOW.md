# サイト保守ワークフロー

GitHub Pages 用の静的 HTML リポジトリ向けの、変更から公開までの手順です。

## よく触るファイル

| 目的 | 触る場所 |
|------|----------|
| 共通ナビ | `tools/partials/site-nav.html`（`404` 用は `site-nav-root.html`） |
| フッター | `tools/partials/site-footer.html` |
| トップの X 埋め込みブロック | `tools/partials/home-x-feed.html` |
| 正規 URL・OG 画像パス・SNS | `tools/site.config.json`（`canonicalSite` / `ogImage` / `socialX`） |
| 共有色・フォントなど | `assets/css/tokens.css`（各 CSS は `@import "./tokens.css"`） |
| Gemini アイコンと About カードの対応 | **[tools/IMAGES.md](../tools/IMAGES.md)** |
| **sync が触る HTML の一覧** | **`tools/sync-html-allowlist.json`**（パスを増やしたらここに追記） |

## 手順チェックリスト

1. **パーシャルや `site.config.json` を編集したら**  
   `npm run sync` — 各 HTML の `<!-- site:* -->` ブロックと、`og:url` / `og:image` を設定に合わせて書き換えます。  
   **同期対象**は `tools/sync-html-allowlist.json` に列挙されたファイルのみです（新しい `.html` を sync させたいときはパスを追加）。

2. **トップや About の写真を差し替えたら**  
   `npm run optimize-images` — マスターは README の「画像」節に従います。

3. **スキルアイコン用 PNG を差し替えたら**  
   `npm run build:icons`（`npm run check` にも含まれます）。対応表は **`tools/IMAGES.md`**。  
   **GitHub Actions（`CI=true`）**では、`GEMINI_TO_KEY` の各キーについて **`img/source/icon-skill-{key}.png` が必須**です。マスターが欠けるとビルドは失敗します。

4. **プッシュ前**  
   `npm run check` — `sync` → `build:icons` → `html-validate` → **`lint:links`**（`tools/lint-links.mjs` が `site.config.json` の **`canonicalSite`** から OG 用ホストのスキップ正規表現を組み立てます）→ **`lint:a11y`**（axe-core + jsdom）→ `npm audit --audit-level=high`。

5. **リンクスキップを手で上書きしたい場合**  
   `tools/site.config.json` に **`linkinatorSkip`**（文字列・1 本の正規表現）を書くと、`lint:links` はそれをそのまま `--skip` に使います（未設定時は `canonicalSite` と X/Twitter 向けパターンを自動生成）。

6. **コミット**  
   `sync` 済みの HTML をコミットしてください（ナビ・フッター・X ブロック・OG は sync が再生成するため、手でだけ直した変更は次回の sync で消えます）。

7. **`main` へ push**  
   GitHub Actions の CI が `npm run check` を実行します。ローカルで `simple-git-hooks` が有効なら、`pre-push` で同じチェックが走ります。

8. **依存パッケージの見直し（目安: 四半期に一度）**  
   `npm run deps:report`（`npm outdated` のラッパー。終了コードは常に 0）で古い依存を確認し、問題があれば `package.json` を更新してから `npm install` と `npm run check` を回してください。自動修正は **`npm audit fix`** を手元で検討（CI は `audit --audit-level=high` のみ）。

## アクセシビリティ（a11y）

- ローカル / CI では **`npm run lint:a11y`** が **axe-core + jsdom** で主要ページを検査します（外部スクリプトは実行されないため、X 埋め込み内部までは対象外です）。
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
