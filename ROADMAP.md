# ROADMAP（リポジトリ実装キュー）

エージェントと人間が共有する **実装タスク** の一覧。  
キャリア・学習の壁打ち（knowledge）は `docs/learning/`（別 PR／マージ後）。こちらは **コード／ドキュメントを変え、`npm run check` で検証できること**だけを書く。

## 使い方

- エージェント: `npm run task:next` → 1 件実装 → `npm run check` → PR（[AGENTS.md](AGENTS.md)）
- 人間: アイデアは Backlog へ。Agent queue に上げるとき、完了条件を1行で書く
- 形式: `- [ ] \`task-id\`: 説明（完了条件: …）`

## Agent queue

上から順に拾う。**未完了の `- [ ]` だけが `npm run task:next` の対象。**

（いま空き。Backlog から完了条件つきで昇格させる）

## Backlog（人間がトリアージ）

（いま空き）

## Done

- [x] `dependabot-cleanup`: Dependabot 整理（superseded クローズ: #3,#5,#19,#28／相当マージ: #18 axe-core 4.12.1・#29 globals 17.8.0・`npm run check` 通過／#1 jsdom major は未着手で open のまま）
- [x] `open-cafe-a11y-register`: Open Cafe WP 書き出しの未登録ページを allowlist / lint:a11y に登録し、drawer の aria-label / aria-controls を揃える