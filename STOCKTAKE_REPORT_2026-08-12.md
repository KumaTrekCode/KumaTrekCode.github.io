# STOCKTAKE REPORT — 2026-08-12

> 対象リポジトリ: **KumaTrekCode/KumaTrekCode.github.io**  
> 公開: https://kumatrekcode.github.io/  
> 作業ブランチ: `main` @ `b597785`（`ci: bump Actions Node from 20 to 22 for html-validate (#37)`）  
> 備考: 2026-08-11 版は一時ディレクトリ保存のため消失。本ファイルはリポジトリ内に恒久保存する再作成版。

---

## 1. `npm run check` 実行結果（2026-08-12 再計測）

| ステップ | 結果 | メモ |
|----------|------|------|
| `sync` / `minify:client` / `build:icons` | OK | icons 再生成で作業ツリーに画像差分が出る（本レポートではコミットしない） |
| `validate` (html-validate) | OK | 対象 5 HTML |
| `verify:partials` | OK | 11 block / 25 page |
| `verify:og` | OK | |
| `smoke:html` | OK | 5 page |
| `lint:js` | OK | |
| `lint:links` | OK | **Scanned 65 links**（失敗 0） |
| `lint:a11y` | OK | **20 pages**（`projects/open-cafe-wp-export/` 配下） |
| `audit:ci` (`npm audit --audit-level=high`) | **OK（現行 main）** | `npm ci` 後 **found 0 vulnerabilities** |

**総合（現行 `origin/main` 取り込み後）:** 検証系・audit とも通過見込み。  
※初回計測時はローカルが `b597785` 時点の古い lock / `node_modules` のままだったため **high 7 件** と誤認した（下記「監査メモ」参照）。

### 監査メモ（high 7 件の正体 — 修正不要の誤検知系）

初回に見えた 7 high は **現行リポジトリの欠陥ではなく、古いローカル依存ツリー** の結果だった。

| 要因 | 内容 |
|------|------|
| ローカル追従遅れ | 作業開始時 `main` が `b597785`。リモートは #38 等でセキュリティ修正済みまで進んでいた |
| 旧 override | 当時の `overrides.brace-expansion: "5.0.8"` は、GHSA-rgw5（2026-08-03 公開、patched `5.0.9`）以降は逆に vulnerable 固定になる |
| Advisory DB | `brace-expansion` / `fast-uri` / `js-yaml` の high は 2026-08-03〜08-06 に GHSA 公開。依存追加ではなく **監査 DB 更新** が主因 |
| 現行 | override は `5.0.9`、`fast-uri` は `3.1.5`。`npm ci` → **0 vulnerabilities** |

初回に数えていた 7 パッケージ名（親＋伝播）: `brace-expansion`, `minimatch`, `@eslint/config-array`, `@eslint/eslintrc`, `eslint`, `fast-uri`, `js-yaml`。

---

## 2. `lint:links` と Instagram 429 フレーク対策

**結論（現状確認）: 明示的な Instagram skip / retry 実装は見当たらないが、実効的にフレーク対象外。**

根拠:

1. Instagram URL（`https://www.instagram.com/opencafe`）は主に `projects/open-cafe-wp-export/*.html` に存在。
2. `tools/lint-links.mjs` の `entryPoints` は次のみ:
   - `index.html` / `about.html` / `404.html`
   - `projects/open-cafe/index.html` / `projects/open-cafe/site/index.html`
3. 既定 skip は `canonicalSite` + X/Twitter のみ（`linkinatorSkip` は `site.config.json` 未設定）。
4. そのため今回の `lint:links` は Instagram に到達せず、**65 links / 0 broken** で安定。

`docs/prompts/gh-pages-static-html-page.md` にも、wp-export を `entryPoints` に足すのはリンク整備後、と明記あり。  
将来 wp-export をリンク検査対象に入れる場合は、Instagram 429 対策（`linkinatorSkip` 追加など）が再必要になる。

---

## 3. Open PR / Issue（API 確認）

| 種別 | 状態 |
|------|------|
| Open Issues | **0** |
| Open PRs | **1** — [#51](https://github.com/KumaTrekCode/KumaTrekCode.github.io/pull/51) `docs(ideas): AIホーム画面レイアウト設計アプリ案を正本に記録` |

参考: [#6](https://github.com/KumaTrekCode/KumaTrekCode.github.io/pull/6)（esbuild bump）は **closed**（未マージの Dependabot PR。手動クローズ対象だったもの）。

---

## 4. `ROADMAP.md` との整合

| ROADMAP 項目 | 現状 | 整合 |
|--------------|------|------|
| Agent queue（空き） | `- [ ]` なし。「いま空き」と一致 | OK |
| Backlog: Open Cafe WP a11y／パス整備 | Backlog に残存。a11y は wp-export 20 ページ OK だが「残り」は prompts 経由の継続前提 | OK（未完了のまま妥当） |
| Backlog: youtube-dashboard 運用メモと導線 | Backlog に残存。近傍 PR（#42/#46 等）で docs 整備はあるが Backlog 未チェック | OK（トリアージ待ち） |
| Backlog: `docs/learning/` → Agent queue 切り出し運用 | Backlog に残存（#43 で運用メモ追加済み） | OK |
| Done: harness / agent-loop | Done 節と一致 | OK |

**Node.js:** ローカル `v22.17.1`。CI（`ci.yml` / `a11y-monthly.yml`）は **node-version: "22"**（#37 マージ済み）。「Node バージョン確認」は **完了扱い**でよい。

---

## 5. 未対応の残課題（リスト）

1. **GitHub label `dependencies` 未作成** — 現状ラベルは bug / documentation / enhancement 等のデフォルトのみ。Dependabot PR 整理用に未整備。
2. **Open PR #51** — ideas ドキュメントのレビュー／マージ判断。
3. **ROADMAP Backlog 3 件** — 完了条件を付けて Agent queue へ昇格するか、人間側でトリアージ継続。
4. **リモートブランチの残り** — #45 で stale merged ブランチ削除済み。なお `origin/cursor/*`（学習メモ系）や Dependabot ブランチ、ローカル `chore/ci-node-22` / `feature/python-portfolio` が残存。要不要の再棚卸し可。
5. **`REPO_SUMMARY.md`（2026-08-02）が未追跡** — 作業ツリーに `?? REPO_SUMMARY.md` あり。本レポートとは別物。取り込み要否は別判断。
6. **Instagram を `lint:links` 対象に含める場合の 429 対策** — 現状は対象外で回避。entryPoints 拡大時に `linkinatorSkip` 等を明示すること。
7. **（参考・対応済み）npm high 脆弱性** — 現行 main は 0 件。過去の「7 件」は古いローカルツリー起因。追加の audit fix は不要。

---

## 6. 補足（ブランチ／実験物）

- 実験・メモ系 remote: `cursor/agent-harness-loop-*`, `cursor/*-memo-*`, `cursor/learning-roadmap-wall-*` など。
- Dependabot remotes: `dependabot/npm_and_yarn/*` 複数。
- 「実験ブランチ削除済み」は #45 時点のクリーンアップを指す理解。**全 cursor/dependabot ブランチが消えたわけではない。**

---

## 7. 今回の成果物

- 本ファイル: `STOCKTAKE_REPORT_2026-08-12.md`（リポジトリルート）
- 目的: 棚卸し結果を一時ディレクトリではなく **Git 上に残す**
