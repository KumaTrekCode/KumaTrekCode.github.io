# AI 用プロンプト置き場（Open Cafe WP 書き出し）

チャットが長くなったときのため、**そのままコピペできるプロンプト**を別ファイルに分けてあります。  
内容は実運用に合わせて **ここを直接編集して改善**してください。

| ファイル | 用途 |
|----------|------|
| [gh-pages-static-html-page.md](./gh-pages-static-html-page.md) | 書き出し HTML（別名保存の参考含む）を、GitHub Pages 向けに整える・2ページ目以降を作る |
| [sync-gh-pages-static-to-repo.md](./sync-gh-pages-static-to-repo.md) | `gh-pages-static` から `open-cafe-wp-export` へ **方針 A（rsync 上書き同期）** で統合する |

## 配置の前提（パス）

- WordPress テーマ側の静的出力:  
  `Local Sites/.../themes/KUMA_DYA36_Open-Cafe/gh-pages-static`
- このリポジトリの掲載先:  
  `projects/open-cafe-wp-export/`

パスはプロンプト内の変数を、環境に合わせて差し替えてください。
