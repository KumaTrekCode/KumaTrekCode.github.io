# AI 用プロンプト置き場（Open Cafe WP 書き出し）

チャットが長くなったときのため、**そのままコピペできるプロンプト**を別ファイルに分けてあります。  
内容は実運用に合わせて **ここを直接編集して改善**してください。

## リポジトリ全体のエージェントループ

実装キューを1件だけ自走させるときは **[agent-loop.md](./agent-loop.md)**（`npm run task:next` → 実装 → `npm run check` → PR）。契約は [AGENTS.md](../../AGENTS.md)。

## まずはこの順（Open Cafe WP 書き出しの運用ステップ）

1. **チェック**: [page-check.md](./page-check.md)
2. **ページ整形/生成**: [gh-pages-static-html-page.md](./gh-pages-static-html-page.md)
3. **登録（allowlist / a11y）**: [page-register.md](./page-register.md)
4. **統合（rsync 方針A）**: [sync-gh-pages-static-to-repo.md](./sync-gh-pages-static-to-repo.md)
5. **保守性向上（共通化/パッチ集約）**: [maintainability.md](./maintainability.md)

## プロンプト一覧

| ファイル | 用途 |
|----------|------|
| [agent-loop.md](./agent-loop.md) | ROADMAP の次タスク1件を `npm run check` まで自走して PR するエージェント用プロンプト |
| [page-check.md](./page-check.md) | 1ページ分の静的書き出し品質チェック（パス/参照/リンク/OG） |
| [gh-pages-static-html-page.md](./gh-pages-static-html-page.md) | 書き出し HTML（別名保存の参考含む）を、GitHub Pages 向けに整える・2ページ目以降を作る |
| [page-register.md](./page-register.md) | 新規ページを `sync` / `lint:a11y` の対象に登録（allowlist 追記など） |
| [sync-gh-pages-static-to-repo.md](./sync-gh-pages-static-to-repo.md) | `gh-pages-static` から `open-cafe-wp-export` へ **方針 A（rsync 上書き同期）** で統合する |
| [maintainability.md](./maintainability.md) | 静的サイトの保守性を上げる（共通化・パッチ集約・壊れやすい参照の除去） |

## 配置の前提（パス）

- WordPress テーマ側の静的出力:  
  `Local Sites/.../themes/KUMA_DYA36_Open-Cafe/gh-pages-static`
- このリポジトリの掲載先:  
  `projects/open-cafe-wp-export/`

パスはプロンプト内の変数を、環境に合わせて差し替えてください。
