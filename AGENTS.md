# Agent contract（このリポジトリ）

AI エージェント（Cursor Cloud / Claude Code 等）が変更するときの契約。  
詳細な運用は [docs/harness-and-loop.md](docs/harness-and-loop.md)。タスク一覧は [ROADMAP.md](ROADMAP.md)。

## ハーネス（完了の定義）

1. **完了とみなす前に必ず** `npm run check` を通す（失敗したら人間を呼ばず、ログを読んで自分で直して再実行する）。
2. 変更が docs のみでサイト HTML / `tools/` / `package.json` に触れない場合でも、可能なら `npm run check` を走らせる。重い・環境不足で省略するときは PR 本文に理由を書く。
3. 新規の公開 HTML を増やすときは `tools/sync-html-allowlist.json`・必要なら `validate`・`pageMeta` を忘れない（[docs/WORKFLOW.md](docs/WORKFLOW.md)）。

## ループ（1 タスクの進め方）

1. `npm run task:next` で未完了タスクを1つ取得する（または ROADMAP の Agent queue 先頭の `- [ ]`）。
2. **一度に1タスクだけ**実装する。範囲を広げない。
3. `npm run check` → 失敗なら修正 → 再実行（目安: 同一タスクで最大 3 サイクル。尽きてもダメなら PR に失敗ログ要約を書いて止める）。
4. ブランチを push し PR を作る。ROADMAP の該当行を `[x]` にするのは **そのタスクの PR 内**で行う。
5. **マージは人間**（Human on the Loop）。エージェントは main へ直接 push しない。

## やってはいけないこと

- `npm run check` を通さずに「完了」と宣言する
- `img/` の生成物や大量アセットを無断削除する
- `tools/partials/` を無視して sync 対象 HTML のナビ／フッター／About 長文だけを手直しする（次回 sync で消える）
- 秘密情報・API キー・`.env` をコミットする
- `docs/learning/` がある場合、そこのチェックボックスを勝手に「実装タスク」としてコード変更の対象にしない（知識の整理は壁打ち用。実装キューは ROADMAP のみ）

## 知識（knowledge）との役割分担

| 置き場 | 役割 | エージェント |
|--------|------|----------------|
| `docs/learning/`（任意） | 動画・覚書の knowledge 蓄積とキャリア壁打ち | 参照可。勝手に完了チェックしない |
| `ROADMAP.md` | リポジトリで実装・検証できるタスク | **ここから1つだけ**取って実装する |
| `npm run check` | 品質ハーネス | ループの合格条件 |
