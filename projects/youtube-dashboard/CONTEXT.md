# YouTube クレジットカード動画ランキング — 開発コンテキスト

> このファイルは Cursor へのプロンプト貼り付け用・**開発／設計コンテキスト**です。  
> **現行の運用状態・起動手順・失敗時プレイブックの正本は [README.md](./README.md)**（運用ランブック）。  
> 本ファイルの古いステータス記述と食い違う場合は README を優先してください。

---

## 1. プロジェクト概要

| 項目 | 内容 |
|---|---|
| **目的** | YouTube Data API を活用し、過去1週間のクレジットカード関連動画ランキング（上位5件）を自動集計する |
| **出力先①** | **ダッシュボード** — GitHub Pages（Tailwind CSS、iframe で動画埋め込み） |
| **出力先②** | **自分用通知** — LINE Messaging API（Flex Message、毎日配信） |
| **自動化** | GitHub Actions で毎日1回実行 → HTML 自動生成・GitHub Pages 更新 |
| **データ保存** | DB 不使用。Jinja2 等で静的 `index.html` を生成してコミット・デプロイ |

---

## 2. 現在の開発フェーズと目標

**実装・本番運用は完了。** GitHub Actions（毎日 07:00 JST 相当）と LINE 通知が稼働中。運用の最新ステータスは [README.md](./README.md) を参照。

---

## 3. 技術スタック

| レイヤー | 技術 |
|---|---|
| 言語 | Python 3 |
| API | YouTube Data API v3、LINE Messaging API |
| フロントエンド | HTML / CSS（Tailwind CSS） |
| テンプレート | Jinja2（導入済み） |
| 自動化 | GitHub Actions |
| 依存 | `requests`, `Jinja2` |

---

## 4. システムの全体像

```
[GitHub Actions 毎日1回]
        │
        ▼
[Python] YouTube API でキーワード検索（過去7日）
        │  search.list → videos.list（2段階）
        │  日本語動画フィルタ
        │  閲覧数降順 → 上位5件
        ▼
   ┌────┴────┐
   ▼         ▼
[Jinja2]   [LINE API]
index.html  Flex Message
   │
   ▼
[GitHub Pages デプロイ]
```

---

## 5. 実装済み / 未着手

### 実装済み（Step 1 + 2）

- [x] `fetch_videos.py` — キーワード・過去7日・日本語動画フィルタ・閲覧数トップ5
- [x] 返却データ: タイトル / URL / サムネイル URL / 閲覧数 / 公開日時（`Video.to_dict()`）
- [x] 複数キーワード検索 + 除外ワード + `videoDuration=medium`（4〜20分）
- [x] チャンネルホワイトリストモード（`TRUSTED_CHANNEL_IDS` / `--channels`）
- [x] `.env` 読み込み + 環境変数 `YOUTUBE_API_KEY`
- [x] プレースホルダー API キーの検出と分かりやすいエラーメッセージ
- [x] `requirements.txt`（`requests`, `Jinja2`）
- [x] `.env.example`
- [x] Step 3: `generate_html.py` + `templates/index.html.j2` → `index.html`（Tailwind + iframe）
- [x] Step 5: `.github/workflows/update_dashboard.yml`（毎日 07:00 JST / 手動実行）
- [x] Step 4: `notify_line.py`（Flex Message カルーセル通知）

### 未着手（コード）

- なし（channels モードの `TRUSTED_CHANNEL_IDS` はプレースホルダのまま。本番は news モード）

### 運用確認

- [x] GitHub Secrets（YouTube / LINE）登録と Actions 経由の通知
- [x] 定時実行（毎朝 07:00 JST 相当）による日次更新
- 日常の確認手順・失敗時対応は [README.md](./README.md) の運用ランブックへ集約

---

## 6. リポジトリ構成（現状）

```
projects/youtube-dashboard/
├── README.md           # 運用クイックリファレンス
├── CONTEXT.md          # 開発コンテキスト・運用メモ（詳細）
├── config.py           # 設定値の一元管理（キーワード・件数・URL 等）
├── models.py           # Video データクラス・型定義
├── env_utils.py        # .env 読み込み・認証情報検証
├── youtube_client.py   # YouTube API 呼び出し
├── video_filters.py    # 日本語判定・ソート・トップ N 制限
├── fetch_videos.py     # 取得オーケストレーション + CLI
├── generate_html.py    # Jinja2 HTML / ranking.json 生成
├── line_flex.py        # LINE Flex Message 組み立て
├── notify_line.py      # LINE Push API 送信
├── format_utils.py     # 日時フォーマット
├── exceptions.py       # カスタム例外
├── templates/
│   └── index.html.j2
├── index.html          # 生成物（GitHub Pages）
├── requirements.txt
├── .env.example
└── .env
```

---

## 7. 環境変数・シークレット

| 変数名 | 用途 | ローカル | GitHub Actions |
|---|---|---|---|
| `YOUTUBE_API_KEY` | YouTube Data API v3 | `.env` | Repository Secret（必須） |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API | `.env` | Repository Secret（必須） |
| `LINE_USER_ID` | 通知先ユーザー ID | `.env` | Repository Secret（必須） |

**ルール:** API キー・トークンはコードに直書きしない。`os.environ` または `.env`（ローカルのみ）から読み込む。

---

## 8. YouTube 取得ロジック（実装メモ）

本番デフォルトは **news モード**（`config.py` の値に従う）。

- **検索:** `search.list`（複数クエリ、`publishedAfter`、`regionCode=JP`、`relevanceLanguage=ja`、`videoDuration=medium`）
- **詳細:** `videos.list`（`snippet`, `statistics`, `contentDetails`）で閲覧数等を取得
- **クエリ:** `SEARCH_QUERY_TEMPLATES`（複数本。単一の「クレジットカード」ではない）
- **プール:** クエリあたり `SEARCH_POOL_PER_QUERY`（現状 8）、全体上限 `SEARCH_POOL_MAX`（現状 50）
- **絞り込み:** 日本語・ノイズタイトル除外 → 閲覧数降順 → **`TOP_N`（現状 5）**
- **デフォルト期間:** 過去 `DEFAULT_DAYS` 日（現状 7）
- **channels モード:** `TRUSTED_CHANNEL_IDS` はプレースホルダ。本番 Actions では使わない

### ローカル実行

```bash
cd projects/youtube-dashboard
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 実際の API キーを記入
python fetch_videos.py
python generate_html.py

# ローカルプレビュー（iframe 確認用。file:// では YouTube エラー153 になる）
python -m http.server 8765
# → http://localhost:8765/index.html をブラウザで開く
```

---

## 9. Cursor への指示ルール

1. **GitHub Actions（サーバーレス）** で動く Python を前提にする（ファイルパスはリポジトリルート基準で明示）。
2. **認証情報は環境変数**から読み込む。直書き禁止。
3. **新ライブラリ導入時**（pandas、Jinja2 など）はメリットを説明し、確認を取ってから進める。
4. **段階的実装** — API 取得 → ランキング → HTML → LINE → Actions の順で小さく分割。
5. **DB は使わない** — 生成 HTML を静的ファイルとして保存・コミット。
6. **既存リポジトリ** — ルートは GitHub Pages 用ポートフォリオサイト。本プロジェクトは `projects/youtube-dashboard/` 配下で開発。

---

## 10. ライブラリ選定メモ（検討済み）

| ライブラリ | 判断 |
|---|---|
| `requests` | 採用済み。YouTube REST API 呼び出しに十分 |
| `google-api-python-client` | 不採用。`requests` で最小構成を維持 |
| `pandas` | 未採用。上位5件程度なら標準 `list` + `sort` で十分 |
| `Jinja2` | 採用済み。静的 HTML テンプレート生成 |
| `python-dotenv` | 未導入。`.env` は標準ライブラリのみで読み込み |

---

## 11. Cursor 用プロンプト（コピペ用）

以下を新しいチャットの冒頭に貼り付けて使えます。

```markdown
# 開発コンテキストの再確認
現在進めているプロジェクトの前提条件を共有します。以降の提案やコード生成は、必ずこのコンテキストを維持した状態で行ってください。

## 1. プロジェクト概要
- 目的: YouTube Data APIを活用し、過去1週間のクレジットカード関連の動画ランキング（上位5件）を自動集計するシステム。
- 出力先①: 【ダッシュボード】GitHub Pages（Tailwind CSSを使用したモダンな動画まとめUI、iframeでの動画埋め込み）。
- 出力先②: 【自分用通知】LINE Messaging APIを使用したリッチなカード形式（Flex Message）の毎日の配信。
- 自動化: GitHub Actionsを用いて毎日1回定期実行し、HTMLの自動生成・更新を行う（DBは不使用、静的ファイル運用）。

## 2. 現在の開発フェーズと目標
- 実装完了（Step 1〜5）。GitHub Actions による日次更新と LINE 通知は本番稼働中。運用手順の正本は `projects/youtube-dashboard/README.md`。設計・モジュール詳細は本 CONTEXT.md。

## 3. Cursorへの指示ルール
- 回答やコードを生成する際は、常に「GitHub Actionsの自動実行環境（サーバーレス環境）」で動くことを意識したPythonコードにしてください。
- 外部API（YouTube / LINE）の認証情報やシークレットキーは、直書きせず環境変数（os.environ）から読み込む設計にしてください。
- 処理の変更や新しいライブラリ（pandas、Jinja2など）を導入する際は、必ずメリットと合わせて確認を取ってから進めてください。
- 運用状態・手順は README.md、設計詳細は CONTEXT.md を参照してください。

---
上記の前提を踏まえた上で、次のタスク/質問に進みます。
```

---

## 12. 運用メモ（歴史・注意点）

> **日常運用の正本は [README.md](./README.md)。** 以下は開発初期の記録と、クォータ周りの注意の抜粋。

### 12.1 動作確認ステータス（現行）

| 項目 | 状態 |
|---|---|
| GitHub Actions 自動更新（Step 5） | **稼働中**（schedule + 手動） |
| LINE Flex Message 通知（Step 4） | **稼働中**（Actions 内で HTML 生成後に送信） |
| ローカル LINE 送信テスト | 成功実績あり（`notify_line.py`） |
| 日次ランキング HTML | main へ定期コミット（生成物） |

### 12.1.1 開発初期の記録（2026-06 頃・歴史）

初回 Actions 実行時に次のエラーが出た（開発中の API 消費が原因。設定不具合ではなかった）:

```
Quota exceeded for quota metric 'Search Queries' per day
Process completed with exit code 1
```

その後クォータ復旧・再実行を経て本番運用に入っている。現行手順は README を参照。

### 12.2 YouTube API クォータ（注意の抜粋）

| 項目 | 内容 |
|---|---|
| 無料枠 | 1日 10,000 ユニット（`search.list` は1回100ユニット等） |
| リセット時刻 | **日本時間 毎日 16:00 頃**（太平洋標準時 深夜 0:00） |
| 手動再実行の目安 | クォータ超過後は **16:00 JST 以降**が安全 |

**ローカル開発時の注意:** `generate_html.py` / `fetch_videos.py` を1日に何度も実行すると、Actions 実行前にクォータを消費しやすい。**本番は Actions 1日1回のみ**が基本。詳細は README。

### 12.3 定時自動実行（毎朝 07:00 JST）

`.github/workflows/update_dashboard.yml` の設定:

```yaml
on:
  schedule:
    - cron: "0 22 * * *"   # 22:00 UTC = 翌日 07:00 JST
  workflow_dispatch:      # 手動実行も可能
```

| 注意点 | 説明 |
|---|---|
| **① クォータと実行時刻の関係** | 前日にクォータを使い切った場合、**朝 07:00 はリセット（16:00）前**のため、クォータ切れで失敗しやすい。開発直後は **16:00 以降の手動実行**で確認してから定時運用に任せる。 |
| **② スケジュールの遅延** | GitHub Actions の `schedule` は、サーバー混雑により **10分〜数十分遅れて実行**されることがある（GitHub 公式仕様）。07:00 ちょうどではない場合がある。 |
| **③ 失敗時の影響** | `generate_html.py` が失敗すると後続の LINE 通知・コミットも実行されない。Actions タブで失敗ログを確認する。 |

### 12.4 日常運用チェックリスト

- [ ] GitHub Secrets 3件（`YOUTUBE_API_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_USER_ID`）が有効
- [ ] 週1回程度、Actions の実行履歴を確認（失敗が続いていないか）
- [ ] ローカルではクォータ節約のため、API 呼び出しは `--dry-run`（LINE）や最小回数に留める

---

## 13. 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-08-11 | 運用の正を README に寄せ、ステータス／検索ロジック記述を現行（news モード・複数クエリ）に同期 |
| 2026-06-22 | 保守性リファクタリング。config.py 分離・モジュール分割・logging 導入 |
| 2026-06-22 | 運用メモ追加。クォータ超過・再テスト手順・定時実行の注意点を記録 |
| 2026-06-21 | Step 4 完了。LINE Flex Message 通知を追加 |
| 2026-06-21 | Step 5 完了。GitHub Actions 毎日自動更新ワークフローを反映 |
| 2026-06-21 | Step 3 完了。Jinja2 + Tailwind ダッシュボード HTML 生成を反映 |
