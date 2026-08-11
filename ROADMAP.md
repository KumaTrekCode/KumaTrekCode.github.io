# ROADMAP（リポジトリ実装キュー）

エージェントと人間が共有する **実装タスク** の一覧。  
キャリア・学習の壁打ち（knowledge）は `docs/learning/`（別 PR／マージ後）。こちらは **コード／ドキュメントを変え、`npm run check` で検証できること**だけを書く。

## 使い方

- エージェント: `npm run task:next` → 1 件実装 → `npm run check` → PR（[AGENTS.md](AGENTS.md)）
- 人間: アイデアは Backlog へ。Agent queue に上げるとき、完了条件を1行で書く
- 形式: `- [ ] \`task-id\`: 説明（完了条件: …）`
- Done 追記: `- [x] \`task-id\`: 短い完了事実（詳細はPR#Nを参照）`（PR番号羅列・ブランチ内訳は書かない）

## Agent queue

上から順に拾う。**未完了の `- [ ]` だけが `npm run task:next` の対象。**

（いま空き。Backlog から完了条件つきで昇格させる）

## Backlog（人間がトリアージ）

任意タスク（優先度低〜中・未着手）。Agent queue へ上げるときは完了条件を1行で足す。

（いま空き）

## Notes（次回以降の検討・未結論）

実装判断はまだしない。入口メモのみ。

- ROADMAP肥大化対策: Doneセクションが100行を超えたら `ROADMAP_ARCHIVE.md` への分離を検討する
- Cursor 向け skills 運用の検討（繰り返し使っているやり切り活動系プロンプトの再利用可能な形への整理）

## Done

- [x] `dependabot-dependencies-label`: `dependencies` ラベルを作成済み
- [x] `lint-links-instagram-429`: Instagram 429 フレーク対策済み
- [x] `cleanup-local-experiment-branches`: ローカル実験ブランチ削除済み
- [x] `kuma-patch-wire`: wp-export へ kuma-patch を配線（詳細はPR#49を参照）
- [x] `jsdom29-upgrade`: jsdom を 29.1.1 へ更新（詳細はPR#48を参照）
- [x] `dependabot-cleanup`: Dependabot PR を整理（詳細はPR#44を参照）
- [x] `cleanup-stale-branches`: マージ済み由来の残存 remote ブランチを削除（詳細はPR#45を参照）
- [x] `open-cafe-a11y-register`: wp-export 未登録ページの a11y 登録（詳細はPR#41を参照）
- [x] `youtube-dashboard-ops-memo`: 運用メモとナビ導線を整理（詳細はPR#42を参照）
- [x] `learning-extract-ops`: knowledge→ROADMAP 昇格運用を文書化（詳細はPR#43を参照）
- [x] `harness-scaffold`: エージェント用ハーネス／タスクループ足場を追加（詳細はPR#36を参照）
- [x] `agent-loop-prompt`: agent-loop プロンプトと導線を追加（詳細はPR#36を参照）
- [x] `cleanup-branches`: クローズ済みPRの古いブランチを削除（詳細はPR#40を参照）
- [x] `fix-vulnerabilities`: 依存のセキュリティ脆弱性を解消（詳細はPR#38を参照）
- [x] `cleanup-technical-debt`: canonical URL 等の技術的負債を整理（詳細はPR#39を参照）
