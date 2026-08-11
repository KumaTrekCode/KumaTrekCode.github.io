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

- [ ] Open Cafe WP 書き出しページの a11y／パス整備の残り（prompts 経由）
- [ ] youtube-dashboard の運用メモとサイト導線の整理
- [ ] `docs/learning/` の knowledge から「サイト／tools に落とす成果」だけを Agent queue へ切り出す運用を試す

## Done

- [x] `harness-scaffold`: ハーネスとループの足場（AGENTS.md / ROADMAP / docs/harness-and-loop.md / `npm run task:next` / README 導線）を追加する
- [x] `agent-loop-prompt`: docs/prompts/agent-loop.md と prompts README への導線を追加する
- [x] `cleanup-branches`: 古いクローズ済みPRのブランチを削除（#30-34の5ブランチ）
- [x] `fix-vulnerabilities`: セキュリティ脆弱性を解消（eslint 10.8.1へアップグレード等、PR #38）
- [x] `cleanup-technical-debt`: canonical URL修正と生成ファイルのGit追跡解消（PR #39）
- [x] `dependabot-cleanup`: 古いDependabot PRの整理（#1,#3,#18,#19,#28,#29は自動クローズ済み、対応不要）
