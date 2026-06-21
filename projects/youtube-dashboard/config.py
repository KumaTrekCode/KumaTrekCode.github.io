"""
YouTube ダッシュボードの設定値を一元管理するモジュール。

変更頻度の高い値（キーワード、件数、URL 等）はここを編集する。
"""

from __future__ import annotations

from pathlib import Path

# --- パス ---
PROJECT_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = PROJECT_DIR / "templates"
DEFAULT_HTML_OUTPUT = PROJECT_DIR / "index.html"
DEFAULT_RANKING_JSON = PROJECT_DIR / "ranking.json"

# --- YouTube 検索 ---
DEFAULT_DAYS = 7
TOP_N = 5
SEARCH_POOL_PER_QUERY = 8
SEARCH_POOL_MAX = 50
VIDEO_DURATION = "medium"
REGION_CODE = "JP"
RELEVANCE_LANGUAGE = "ja"
PER_CHANNEL_MAX = 10

EXCLUDE_TERMS = "-ショート -shorts -ジュエリー -アクセサリー -statuscard -jewelry"

SEARCH_QUERY_TEMPLATES: list[str] = [
    "クレジットカード 改悪",
    "クレカ 新機能",
    "クレジットカード キャンペーン",
    "クレジットカード 還元率",
    "クレジットカード 新カード",
    "三井住友カード",
    "PayPayカード",
    "楽天カード",
]

TRUSTED_CHANNEL_IDS: list[str] = [
    "UCxxxxxxxxxxxxxxxxxxxxxxxxxx",  # TODO: 金融系チャンネル A
    "UCyyyyyyyyyyyyyyyyyyyyyyyyyy",  # TODO: 金融系チャンネル B
    "UCzzzzzzzzzzzzzzzzzzzzzzzzzz",  # TODO: 金融系チャンネル C
]

# --- YouTube API ---
YOUTUBE_SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos"
YOUTUBE_WATCH_URL = "https://www.youtube.com/watch?v={video_id}"
API_TIMEOUT_SECONDS = 30

# --- フィルタ ---
JAPANESE_TEXT_MIN_CHARS = 2
NOISE_TITLE_PATTERN = (
    r"(?i)(#shorts\b|#ショート|ジュエリー|アクセサリー|statuscard|jewelry|#food\b|#roblox\b)"
)

# --- HTML / 公開 ---
DASHBOARD_URL = "https://kumatrekcode.github.io/projects/youtube-dashboard/index.html"

MODE_LABELS: dict[str, str] = {
    "news": "ニュース検索（複数キーワード）",
    "channels": "チャンネルホワイトリスト",
    "single": "単一キーワード検索",
}

# --- LINE Messaging API ---
LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push"
LINE_TITLE_MAX_LEN = 55
LINE_RANK1_COLOR = "#F59E0B"
LINE_DEFAULT_RANK_COLOR = "#38BDF8"
LINE_PRIMARY_BUTTON_COLOR = "#0EA5E9"

# --- 認証情報プレースホルダー（誤設定検出用） ---
PLACEHOLDER_YOUTUBE_API_KEYS = frozenset({"your_api_key_here", "あなたのAPIキー"})
PLACEHOLDER_LINE_SECRETS = frozenset(
    {"your_line_channel_access_token", "your_line_user_id"}
)
