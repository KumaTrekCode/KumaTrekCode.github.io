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

## 手順チェックリスト

1. **パーシャルや `site.config.json` を編集したら**  
   `npm run sync` — 各 HTML の `<!-- site:* -->` ブロックと、`og:url` / `og:image` を設定に合わせて書き換えます。

2. **トップや About の写真を差し替えたら**  
   `npm run optimize-images` — マスターは README の「画像」節に従います。

3. **スキルアイコン用 PNG を差し替えたら**  
   `npm run build:icons`（`npm run check` にも含まれます）。

4. **プッシュ前**  
   `npm run check` — `sync` → `build:icons` → `html-validate` → 内部リンク（linkinator）→ `npm audit --audit-level=high`。linkinator は **OG 用の本番絶対 URL** と **X へのリンク**をスキップする設定なので、カスタムドメインに変えたら `package.json` の **`lint:links`** の `--skip` を合わせて更新してください。

5. **コミット**  
   `sync` 済みの HTML をコミットしてください（ナビ・フッター・X ブロック・OG は sync が再生成するため、手でだけ直した変更は次回の sync で消えます）。

6. **`main` へ push**  
   GitHub Actions の CI が同じ `check` 相当を実行します。ローカルで `simple-git-hooks` が有効なら、`pre-push` で `npm run check` が走ります。

## ローカルプレビュー

```bash
npm install
npm run sync
npx serve .
```

404 の挙動まで見る場合は、ルートで `serve` してから存在しないパスを開いてください。

## 大きいバイナリ

数十 MB 級の画像や PSD をリポジトリに載せる場合は **Git LFS** の利用を検討してください（`.gitattributes` で `*.psd` などを指定）。通常のポートフォリオ用 JPG/WebP は LFS なしで問題ないことが多いです。
