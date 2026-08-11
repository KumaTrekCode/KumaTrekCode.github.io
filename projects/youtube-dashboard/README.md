# クレカ動画ランキング ダッシュボード（運用ランブック）

YouTube Data API で過去1週間のクレジットカード関連動画を集計し、閲覧数 TOP5 を GitHub Pages に公開。同時に LINE Flex Message で毎日通知する。

**開発・モジュール構成の詳細:** [CONTEXT.md](./CONTEXT.md)  
**公開 URL:** https://kumatrekcode.github.io/projects/youtube-dashboard/index.html  
**サイト上の導線:** トップの [Portfolio（#works）](../../index.html#works) カード「クレカ動画ランキング」

---

## 運用ステータス（現行）

| 項目 | 状態 |
|---|---|
| コード実装 | 完了（news モードが本番） |
| GitHub Actions（`Update YouTube Dashboard`） | 稼働中（schedule + 手動） |
| LINE 通知 | Actions 内で HTML 生成後に送信 |
| 生成物 | `index.html` のみ main へコミット（`ranking.json` はジョブ内一時・gitignore） |

日次更新が止まっている／HTML の日付が古いときは、下の「失敗時プレイブック」へ。

---

## 毎日の流れ（定時）

1. **cron:** `0 22 * * *` UTC ＝ 翌朝 **07:00 JST**（GitHub 都合で 10分〜数十分遅延しうる）
2. `python generate_html.py`（デフォルト news モード）→ `index.html` + `ranking.json`
3. `python notify_line.py`（`ranking.json` を読んで LINE Push）
4. 変更があれば `projects/youtube-dashboard/index.html` のみ commit & push

ワークフロー定義: `.github/workflows/update_dashboard.yml`

**注意:** 前日にローカル等でクォータを使い切っていると、朝 07:00 JST はまだリセット前（目安 **16:00 JST**）のため失敗しうる。普段はローカルで `generate_html.py` を連続実行しない。

---

## 手動実行（Actions）

1. GitHub → **Actions** → **Update YouTube Dashboard**
2. **Run workflow**
3. Success を確認し、LINE と [公開 URL](https://kumatrekcode.github.io/projects/youtube-dashboard/index.html) をチェック

クォータ超過後の再実行は **16:00 JST 以降**が安全。

---

## Secrets / API キー

| 名前 | 用途 | 置き場 |
|---|---|---|
| `YOUTUBE_API_KEY` | YouTube Data API v3 | GitHub Actions Secrets / ローカル `.env` |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging Push | 同上 |
| `LINE_USER_ID` | 通知先（`U...`） | 同上 |

- ローカル: `cp .env.example .env` して記入（`.env` は gitignore。コミット禁止）
- Actions: Settings → Secrets and variables → Actions
- プレースホルダ文字列は `env_utils` が拒否する

---

## ローカル起動

```bash
cd projects/youtube-dashboard
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # キーを記入

python fetch_videos.py           # 取得だけ確認（任意・API 消費あり）
python generate_html.py          # HTML + ranking.json（API 消費あり）
python notify_line.py --dry-run  # LINE JSON 確認（送信なし）
python notify_line.py            # 実送信

python -m http.server 8765       # http://localhost:8765/index.html
```

`file://` では YouTube iframe が失敗しうるため、必ず HTTP サーバ経由で確認する。

依存: `requirements.txt`（`requests`, `Jinja2`）。Python は Actions で 3.11。

---

## クォータ目安

- 無料枠の目安: 1日あたり約 **10,000 units**（Google Cloud コンソールで確認）
- 本番 news モード: 検索クエリが複数本（`SEARCH_QUERY_TEMPLATES`）あり、`search.list` は **100 units/回** 前後。加えて `videos.list`
- **日次 Actions 1回**を基本とし、ローカル再実行は必要なときだけ

---

## 設定ノブ（よく触る場所）

| 変更したいこと | 編集先 |
|---|---|
| 検索キーワード・除外語 | `config.py` の `SEARCH_QUERY_TEMPLATES` / `EXCLUDE_TERMS` |
| TOP 件数・検索日数 | `TOP_N` / `DEFAULT_DAYS` |
| チャンネル限定モード | `TRUSTED_CHANNEL_IDS`（現状プレースホルダ。本番は news） |
| 公開 URL 表示 | `DASHBOARD_URL` |
| HTML 見た目 | `templates/index.html.j2`（生成後の `index.html` を手編集しない） |

---

## 失敗時プレイブック

| 症状 | 確認ポイント |
|---|---|
| Actions が赤 / `Quota exceeded` | YouTube クォータ。16:00 JST 以降に手動再実行。ローカル連続実行を止める |
| LINE が来ないが HTML は更新 | Secrets の LINE 2件。ジョブログの `Send LINE notification`。401 ならトークン再発行 |
| HTML も LINE も更新なし | `Generate dashboard HTML` 失敗（キー未設定・空結果）。ログ全文を見る |
| コミットがスキップ | ランキング内容が前日と同じ → 正常（`No changes to commit`） |
| ページが空っぽい | フィルタ後 0 件の可能性。クエリ／除外語を見直し |
| サイトのナビから辿れない | トップ `#works` 経由。本ダッシュボードは共通ナビ非搭載のスタンドアロン HTML |

ジョブ順の注意: LINE 通知は **commit より前**。LINE ステップ失敗時はそのランの HTML が push されない。

---

## サイト導線・同期方針

- ポートフォリオ一覧: ルート `index.html` の `#works`（`tools/projects.json`）
- グローバルナビ「Portfolio」は `#works` を指す（Open cafe 専用リンクではない）
- 生成 `index.html` は sync allowlist **外**（日次 bot コミットと衝突させない）。meta はテンプレート側が正

---

## ファイル構成（運用で見るもの）

```
README.md              # 本ランブック（運用の正）
CONTEXT.md             # 開発コンテキスト・詳細設計
config.py              # キーワード・件数など
.env.example           # Secrets の型
generate_html.py       # 取得 → HTML / ranking.json
notify_line.py         # LINE 送信
templates/index.html.j2
index.html             # GitHub Pages 公開物（生成）
```

モジュール全体図は [CONTEXT.md](./CONTEXT.md) を参照。
