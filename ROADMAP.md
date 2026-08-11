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

- [x] `kuma-patch-wire`: Open Cafe wp-export 本番相当ページへ kuma-patch.css/js を配線（`ci-smoke.html` 除外、normalizeDrawerNav ガード付き）
- [x] `jsdom29-upgrade`: a11y ハーネス用 jsdom を 25 → 29.1.1 に更新（`npm run check` 通過。Dependabot #1 は本PRで相当対応のためクローズ可）
- [x] `dependabot-cleanup`: Dependabot 整理（superseded クローズ: #3,#5,#19,#28／相当マージ: #18 axe-core 4.12.1・#29 globals 17.8.0／#1 jsdom major は `jsdom29-upgrade` で対応）
- [x] `cleanup-stale-branches`: マージ済みPR由来の残存 remote ブランチを削除（`cursor/*-504b` 系・`chore/ci-node-22`・クローズ済み Dependabot ブランチ。open の #1 / #44 の head は除外）
- [x] `open-cafe-a11y-register`: Open Cafe WP 書き出しの未登録ページを allowlist / lint:a11y に登録し、drawer の aria-label / aria-controls を揃える
- [x] `youtube-dashboard-ops-memo`: youtube-dashboard の運用ランブック更新とナビ Portfolio → `#works` 導線整理
- [x] `learning-extract-ops`: `docs/learning/` は移動せず、サイト／tools 成果だけを人間が完了条件つきで ROADMAP へ昇格する運用を文書化してクローズ
- [x] `harness-scaffold`: ハーネスとループの足場（AGENTS.md / ROADMAP / docs/harness-and-loop.md / `npm run task:next` / README 導線）を追加する
- [x] `agent-loop-prompt`: docs/prompts/agent-loop.md と prompts README への導線を追加する
- [x] `cleanup-branches`: 古いクローズ済みPRのブランチを削除（#30-34の5ブランチ）
- [x] `fix-vulnerabilities`: セキュリティ脆弱性を解消（eslint 10.8.1へアップグレード等、PR #38）
- [x] `cleanup-technical-debt`: canonical URL修正と生成ファイルのGit追跡解消（PR #39）
