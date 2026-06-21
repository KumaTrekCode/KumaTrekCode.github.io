# YouTube クレジットカード動画ランキング — 開発コンテキスト

> このファイルは Cursor へのプロンプト貼り付け用・プロジェクト共有用のコンテキストです。  
> 状況が変わったら **「2. 現在の開発フェーズ」** と **「4. 実装済み / 未着手」** を更新してください。

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

**GitHub Actions による毎日の自動更新・GitHub Pages デプロイが完成。LINE Flex Message 通知（`notify_line.py`）も実装済み。**

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

### 未着手

- なし（運用設定: LINE Secrets 登録・User ID 取得）

---

## 6. リポジトリ構成（現状）

```
projects/youtube-dashboard/
├── CONTEXT.md
├── fetch_videos.py
├── generate_html.py
├── index.html              # 生成物（GitHub Pages 公開用）
├── templates/
│   └── index.html.j2
├── requirements.txt
├── .env.example
└── .env
```

---

## 7. 環境変数・シークレット

| 変数名 | 用途 | ローカル | GitHub Actions |
|---|---|---|---|
| `YOUTUBE_API_KEY` | YouTube Data API v3 | `.env` | Repository Secret（必須） |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API（未実装） | `.env` | Repository Secret |
| `LINE_USER_ID` | 通知先ユーザー ID（未実装） | `.env` | Repository Secret |

**ルール:** API キー・トークンはコードに直書きしない。`os.environ` または `.env`（ローカルのみ）から読み込む。

---

## 8. YouTube 取得ロジック（実装メモ）

- **検索:** `search.list`（`q`, `publishedAfter`, `regionCode=JP`, `relevanceLanguage=ja`）
- **詳細:** `videos.list`（`snippet`, `statistics`）で閲覧数取得
- **日本語フィルタ時:** 検索プール最大50件 → フィルタ後 閲覧数降順 → 最大25件（ランキング用は上位5件に絞る予定）
- **デフォルトキーワード:** `クレジットカード`
- **デフォルト期間:** 過去7日

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
- YouTube APIからデータを取得するスクリプト（fetch_videos.py）が完成し、日本語動画フィルタまで実装済み。次は上位5件のランキング算出、またはJinja2によるHTMLテンプレート化。

## 3. Cursorへの指示ルール
- 回答やコードを生成する際は、常に「GitHub Actionsの自動実行環境（サーバーレス環境）」で動くことを意識したPythonコードにしてください。
- 外部API（YouTube / LINE）の認証情報やシークレットキーは、直書きせず環境変数（os.environ）から読み込む設計にしてください。
- 処理の変更や新しいライブラリ（pandas、Jinja2など）を導入する際は、必ずメリットと合わせて確認を取ってから進めてください。
- プロジェクト詳細は `projects/youtube-dashboard/CONTEXT.md` を参照してください。

---
上記の前提を踏まえた上で、次のタスク/質問に進みます。
```

---

## 12. 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-06-21 | Step 5 完了。GitHub Actions 毎日自動更新ワークフローを反映 |
| 2026-06-21 | Step 3 完了。Jinja2 + Tailwind ダッシュボード HTML 生成を反映 |
