# stocktake — リポジトリ棚卸し

KumaTrekCode.github.io の現状診断を、毎回同じ項目セットで実行する。

## 前提

- 対象リポジトリは **KumaTrekCode.github.io**（明示されていない場合は作業前に確認）
- 調査のみで始め、依頼があればレポートをリポジトリ内へコミットする
- 一時ディレクトリ（`/tmp` 等）に成果物を置かない

## 実施手順

1. `git fetch` し、ローカル `main` が remote より古くないか確認する（古ければ取り込み後に診断）
2. `npm run check` を実行し、次を記録する
   - リンクチェック件数（`lint:links`）
   - a11y 対象ページ数（`lint:a11y`）
   - 脆弱性件数（`audit:ci` / `npm audit`）
   - 全体の成否と、失敗した場合の最初の失敗ステップ
3. `lint:links` の既知フレーク対策が有効か確認する
   - Instagram 等の外部 SNS が検査対象に含まれていないか
   - `tools/site.config.json` の `linkinatorSkip`、および `tools/lint-links.mjs` の entryPoints を確認
4. Open PR / Open Issue の一覧を取得する（`gh` または GitHub API）
5. `ROADMAP.md` と実際の状態の整合性を確認する
   - Agent queue / Backlog の未完了と実態
   - Done 追記フォーマット（短い完了事実 + 必要なら PR#N）とのずれ
6. 未対応の残課題をリストアップする

## 成果物

- レポートファイル名: `STOCKTAKE_REPORT_YYYY-MM-DD.md`（実行日）
- 保存先: リポジトリルート（または既存の `docs/`）
- 依頼があればコミット・push する（一時ディレクトリ禁止）

## 報告フォーマット

- 表は使わない（箇条書き / 「項目: 状態」）
- 要点はコードブロックにまとめ、コピーしやすくする
- 絵文字は ✅❌⚠️ の状態表示のみ
