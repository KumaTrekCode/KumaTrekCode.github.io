## プロンプト: 新規ページ追加の「登録」手順（allowlist / a11y）

静的ページを追加したとき、`npm run sync` / `npm run lint:a11y` に載せるための「登録」作業を、迷わず依頼するためのプロンプトです。

---

あなたはこのリポジトリ（`KumaTrekCode.github.io`）の保守担当です。新規ページを追加したので、次を行ってください。

## 入力

- 追加したページ（相対パス）:
  - `projects/open-cafe-wp-export/[PAGE].html`
  - （複数あるなら列挙）

## 作業

1. `tools/sync-html-allowlist.json` に、上のページパスを追記する（配列の末尾付近で OK）。
2. `tools/lint-a11y.mjs` の `pages` 配列にも同じパスを追記する。
3. `npm run sync` を実行して、対象ページに `<!-- site:* -->` ブロックがある場合は反映されることを確認する。
4. `npm run lint:a11y` を実行し、エラーが出たら最小限の HTML 修正で直す（可能なら CSS は触らない）。

## 出力

- 変更したファイルの一覧
- `npm run sync` / `npm run lint:a11y` の結果（成功/失敗、失敗なら要点）

