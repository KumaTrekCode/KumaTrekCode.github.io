# クレカ動画ランキング ダッシュボード

YouTube Data API で過去1週間のクレジットカード関連動画を集計し、閲覧数 TOP5 を GitHub Pages に公開。同時に LINE Flex Message で毎日通知する。

**詳細仕様・開発コンテキスト:** [CONTEXT.md](./CONTEXT.md)

---

## 公開 URL

https://kumatrekcode.github.io/projects/youtube-dashboard/index.html

---

## 運用ステータス（2026-06-22）

| 項目 | 状態 |
|---|---|
| コード実装（Step 1〜5） | 完了 |
| GitHub Actions 設定 | 完了 |
| LINE 通知（ローカル） | 成功 |
| Actions 本番テスト | クォータ超過で一度失敗 → **16:00 JST 以降に再実行予定** |

初回 Actions 実行時は `Quota exceeded for quota metric 'Search Queries'` が出たが、**プログラム・LINE 設定の不具合ではない**（開発中の API 消費が原因）。

---

## 本番テスト（手動実行）

**実施タイミング:** 日本時間 **16:00 以降**（YouTube API クォータリセット後）

1. GitHub → **Actions** → **Update YouTube Dashboard**
2. **Run workflow**
3. Success を確認し、LINE とダッシュボード URL をチェック

---

## 定時自動実行

- **毎朝 07:00 JST**（cron: `0 22 * * *` UTC）
- **注意①:** 前日クォータ使い切り時は朝7時はまだリセット前のため失敗しうる
- **注意②:** GitHub の schedule は **10分〜数十分遅延** することがある

---

## ローカル開発

```bash
cd projects/youtube-dashboard
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # キー・トークンを記入

python generate_html.py          # HTML + ranking.json 生成（API 消費あり）
python notify_line.py --dry-run  # LINE JSON 確認（API 消費なし）
python notify_line.py            # LINE 送信

python -m http.server 8765       # http://localhost:8765/index.html
```

**クォータ節約:** ローカルで `generate_html.py` を連続実行しない。1日1回の Actions 運用を基本とする。

---

## GitHub Secrets（Actions 用）

| Secret | 用途 |
|---|---|
| `YOUTUBE_API_KEY` | YouTube Data API v3 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Push API |
| `LINE_USER_ID` | 通知先（`U...`） |

Settings → Secrets and variables → Actions

---

## ファイル構成

```
config.py           # 設定変更はここ
fetch_videos.py     # YouTube 取得 CLI
generate_html.py    # HTML 生成 CLI
notify_line.py      # LINE 通知 CLI
```

詳細: [CONTEXT.md](./CONTEXT.md)
