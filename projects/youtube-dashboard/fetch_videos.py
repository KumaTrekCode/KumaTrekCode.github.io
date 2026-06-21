#!/usr/bin/env python3
"""
YouTube Data API v3 で、過去 N 日間のクレカ関連動画から
日本語・ニュース性の高い動画を抽出し、閲覧数ベースのトップ N 件を返す。

取得項目: タイトル / URL / サムネイル URL / 閲覧数 / 公開日時
"""

from __future__ import annotations

import os
import re
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

import requests

SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search"
VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos"
PROJECT_DIR = Path(__file__).resolve().parent
DEFAULT_DAYS = 7
TOP_N = 5
SEARCH_POOL_PER_QUERY = 8
SEARCH_POOL_MAX = 50
VIDEO_DURATION = "medium"
EXCLUDE_TERMS = "-ショート -shorts -ジュエリー -アクセサリー -statuscard -jewelry"
SEARCH_QUERY_TEMPLATES = [
    "クレジットカード 改悪",
    "クレカ 新機能",
    "クレジットカード キャンペーン",
    "クレジットカード 還元率",
    "クレジットカード 新カード",
    "三井住友カード",
    "PayPayカード",
    "楽天カード",
]
TRUSTED_CHANNEL_IDS = [
    "UCxxxxxxxxxxxxxxxxxxxxxxxxxx",  # TODO: 金融系チャンネル A のチャンネル ID に差し替え
    "UCyyyyyyyyyyyyyyyyyyyyyyyyyy",  # TODO: 金融系チャンネル B のチャンネル ID に差し替え
    "UCzzzzzzzzzzzzzzzzzzzzzzzzzz",  # TODO: 金融系チャンネル C のチャンネル ID に差し替え
]
JAPANESE_CHAR_RE = re.compile(r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3400-\u4DBF]")
NOISE_TITLE_RE = re.compile(
    r"(?i)(#shorts\b|#ショート|ジュエリー|アクセサリー|statuscard|jewelry|#food\b|#roblox\b)"
)
PLACEHOLDER_API_KEYS = frozenset(
    {
        "your_api_key_here",
        "あなたのAPIキー",
    }
)
SearchMode = Literal["news", "channels", "single"]


@dataclass(frozen=True)
class Video:
    video_id: str
    title: str
    url: str
    thumbnail_url: str
    view_count: int
    published_at: str

    def to_dict(self) -> dict[str, str | int]:
        return asdict(self)


def _load_dotenv() -> None:
    """プロジェクト直下の .env を読み込む（シェル未設定、またはプレースホルダー時のみ上書き）。"""
    env_path = PROJECT_DIR / ".env"
    if not env_path.is_file():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if not key:
            continue

        current = os.environ.get(key, "").strip()
        if key not in os.environ or current in PLACEHOLDER_API_KEYS:
            os.environ[key] = value


def _require_api_key() -> str:
    api_key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "YOUTUBE_API_KEY が未設定です。"
            " .env.example をコピーして .env を作成し、"
            " Google Cloud Console で発行した実際の API キーを設定してください。"
        )
    if api_key in PLACEHOLDER_API_KEYS:
        raise RuntimeError(
            "YOUTUBE_API_KEY にプレースホルダー文字列が設定されています。"
            " projects/youtube-dashboard/.env に実際の API キー（例: AIzaSy...）を"
            " 書くか、ターミナルで export YOUTUBE_API_KEY='AIzaSy...' を実行してください。"
            " 以前の誤った export が残っている場合は unset YOUTUBE_API_KEY を先に実行してください。"
        )
    return api_key


def _raise_for_youtube_error(response: requests.Response) -> None:
    """HTTP エラー時に YouTube API の詳細メッセージを含めて例外を投げる。"""
    if response.ok:
        return

    message = f"{response.status_code} {response.reason}"
    try:
        error = response.json().get("error", {})
        if error.get("message"):
            message = error["message"]
            if error.get("errors"):
                reasons = ", ".join(
                    item.get("reason", "unknown")
                    for item in error["errors"]
                    if item.get("reason")
                )
                if reasons:
                    message = f"{message} ({reasons})"
    except ValueError:
        pass

    raise RuntimeError(f"YouTube API error: {message}")


def _build_search_query(base_query: str) -> str:
    """除外ワードを付与した検索クエリを組み立てる。"""
    return f"{base_query.strip()} {EXCLUDE_TERMS}".strip()


def _is_japanese_language_code(code: str | None) -> bool:
    """snippet の言語コードが日本語かどうか。"""
    return bool(code and code.lower().startswith("ja"))


def _has_japanese_text(text: str, *, min_chars: int = 2) -> bool:
    """ひらがな・カタカナ・漢字が一定数以上含まれるか。"""
    return len(JAPANESE_CHAR_RE.findall(text)) >= min_chars


def _is_noise_title(title: str) -> bool:
    """ショート動画や無関係ジャンルのタイトルを除外する。"""
    return bool(NOISE_TITLE_RE.search(title))


def _is_japanese_video(snippet: dict) -> bool:
    """
    日本語動画かどうかを判定する。

    1. defaultAudioLanguage / defaultLanguage が明示的に日本語以外 → 除外
    2. いずれかが ja → 採用
    3. 言語メタデータ未設定 → タイトルに日本語文字があれば採用
    """
    audio_lang = snippet.get("defaultAudioLanguage")
    default_lang = snippet.get("defaultLanguage")

    for code in (audio_lang, default_lang):
        if code and not _is_japanese_language_code(code):
            return False

    if _is_japanese_language_code(audio_lang) or _is_japanese_language_code(default_lang):
        return True

    return _has_japanese_text(snippet.get("title", ""))


def _pick_thumbnail_url(snippet: dict) -> str:
    """利用可能な最大サイズのサムネイル URL を返す。"""
    thumbnails = snippet.get("thumbnails", {})
    for size in ("maxres", "high", "medium", "default"):
        url = thumbnails.get(size, {}).get("url")
        if url:
            return url
    return ""


def _published_after(days: int) -> str:
    """過去 N 日間の開始時刻を RFC 3339 (UTC) で返す。"""
    start = datetime.now(timezone.utc) - timedelta(days=days)
    return start.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _search_video_ids(
    api_key: str,
    *,
    days: int,
    max_results: int,
    query: str | None = None,
    channel_id: str | None = None,
    video_duration: str = VIDEO_DURATION,
    order: str = "date",
) -> list[str]:
    """search.list で動画 ID を取得する。"""
    params: dict[str, str | int] = {
        "key": api_key,
        "part": "snippet",
        "type": "video",
        "order": order,
        "publishedAfter": _published_after(days),
        "maxResults": min(max_results, SEARCH_POOL_MAX),
        "regionCode": "JP",
        "relevanceLanguage": "ja",
        "videoDuration": video_duration,
    }

    if channel_id:
        params["channelId"] = channel_id
    elif query:
        params["q"] = query
    else:
        raise ValueError("query または channel_id のいずれかを指定してください。")

    response = requests.get(SEARCH_ENDPOINT, params=params, timeout=30)
    _raise_for_youtube_error(response)
    payload = response.json()

    video_ids: list[str] = []
    for item in payload.get("items", []):
        video_id = item.get("id", {}).get("videoId")
        if video_id:
            video_ids.append(video_id)

    return video_ids


def _merge_unique_video_ids(*id_lists: list[str]) -> list[str]:
    """複数検索結果の動画 ID を重複なく結合する。"""
    merged: list[str] = []
    seen: set[str] = set()
    for video_ids in id_lists:
        for video_id in video_ids:
            if video_id not in seen:
                seen.add(video_id)
                merged.append(video_id)
    return merged


def _fetch_video_details(
    api_key: str,
    video_ids: list[str],
    *,
    japanese_only: bool = False,
) -> list[Video]:
    """videos.list でタイトル・閲覧数などの詳細を取得する。"""
    if not video_ids:
        return []

    videos: list[Video] = []
    for start in range(0, len(video_ids), SEARCH_POOL_MAX):
        chunk = video_ids[start : start + SEARCH_POOL_MAX]
        params = {
            "key": api_key,
            "part": "snippet,statistics,contentDetails",
            "id": ",".join(chunk),
            "maxResults": len(chunk),
        }

        response = requests.get(VIDEOS_ENDPOINT, params=params, timeout=30)
        _raise_for_youtube_error(response)
        payload = response.json()

        for item in payload.get("items", []):
            video_id = item["id"]
            snippet = item["snippet"]
            statistics = item.get("statistics", {})
            title = snippet["title"]

            if japanese_only and not _is_japanese_video(snippet):
                continue
            if _is_noise_title(title):
                continue

            videos.append(
                Video(
                    video_id=video_id,
                    title=title,
                    url=f"https://www.youtube.com/watch?v={video_id}",
                    thumbnail_url=_pick_thumbnail_url(snippet),
                    view_count=int(statistics.get("viewCount", 0)),
                    published_at=snippet.get("publishedAt", ""),
                )
            )

    return videos


def _rank_top_videos(
    api_key: str,
    video_ids: list[str],
    *,
    top_n: int,
    japanese_only: bool,
) -> list[Video]:
    """動画詳細を取得し、閲覧数降順でトップ N 件を返す。"""
    videos = _fetch_video_details(api_key, video_ids, japanese_only=japanese_only)
    videos.sort(key=lambda video: video.view_count, reverse=True)
    return videos[:top_n]


def fetch_top_videos_news(
    *,
    days: int = DEFAULT_DAYS,
    top_n: int = TOP_N,
    queries: list[str] | None = None,
    per_query_max: int = SEARCH_POOL_PER_QUERY,
    japanese_only: bool = True,
) -> list[Video]:
    """
    ニュース性の高い複数キーワードで検索し、日本語動画のトップ N 件を返す。

    - 各クエリに除外ワードを付与
    - videoDuration=medium（4〜20分）でショート動画を除外
    """
    _load_dotenv()
    api_key = _require_api_key()
    query_templates = queries or SEARCH_QUERY_TEMPLATES

    id_lists = [
        _search_video_ids(
            api_key,
            query=_build_search_query(template),
            days=days,
            max_results=per_query_max,
        )
        for template in query_templates
    ]
    video_ids = _merge_unique_video_ids(*id_lists)
    return _rank_top_videos(
        api_key,
        video_ids,
        top_n=top_n,
        japanese_only=japanese_only,
    )


def fetch_top_videos_from_channels(
    channel_ids: list[str] | None = None,
    *,
    days: int = DEFAULT_DAYS,
    top_n: int = TOP_N,
    per_channel_max: int = 10,
    japanese_only: bool = True,
) -> list[Video]:
    """
    信頼できるチャンネル（ホワイトリスト）の過去 N 日間の投稿から
    閲覧数トップ N 件を返す。
    """
    _load_dotenv()
    api_key = _require_api_key()
    channels = channel_ids or TRUSTED_CHANNEL_IDS

    id_lists = [
        _search_video_ids(
            api_key,
            channel_id=channel_id,
            days=days,
            max_results=per_channel_max,
        )
        for channel_id in channels
    ]
    video_ids = _merge_unique_video_ids(*id_lists)
    return _rank_top_videos(
        api_key,
        video_ids,
        top_n=top_n,
        japanese_only=japanese_only,
    )


def fetch_top_videos(
    keyword: str | None = None,
    *,
    days: int = DEFAULT_DAYS,
    top_n: int = TOP_N,
    japanese_only: bool = True,
    mode: SearchMode = "news",
    channel_ids: list[str] | None = None,
) -> list[Video]:
    """
    動画ランキング取得の統合エントリーポイント。

    mode:
      - "news": 複数キーワード検索（デフォルト）
      - "channels": ホワイトリストチャンネルから取得
      - "single": 単一キーワード検索（keyword 必須）
    """
    if mode == "channels":
        return fetch_top_videos_from_channels(
            channel_ids,
            days=days,
            top_n=top_n,
            japanese_only=japanese_only,
        )

    if mode == "single":
        if not keyword:
            raise ValueError("mode='single' のときは keyword を指定してください。")
        _load_dotenv()
        api_key = _require_api_key()
        video_ids = _search_video_ids(
            api_key,
            query=_build_search_query(keyword),
            days=days,
            max_results=SEARCH_POOL_MAX,
        )
        return _rank_top_videos(
            api_key,
            video_ids,
            top_n=top_n,
            japanese_only=japanese_only,
        )

    return fetch_top_videos_news(
        days=days,
        top_n=top_n,
        japanese_only=japanese_only,
    )


def fetch_top_videos_as_dicts(
    keyword: str | None = None,
    *,
    days: int = DEFAULT_DAYS,
    top_n: int = TOP_N,
    japanese_only: bool = True,
    mode: SearchMode = "news",
    channel_ids: list[str] | None = None,
) -> list[dict[str, str | int]]:
    """fetch_top_videos の結果を辞書のリストで返す（Jinja2 / LINE 連携用）。"""
    return [
        video.to_dict()
        for video in fetch_top_videos(
            keyword,
            days=days,
            top_n=top_n,
            japanese_only=japanese_only,
            mode=mode,
            channel_ids=channel_ids,
        )
    ]


def _format_published_at(published_at: str) -> str:
    """ISO 8601 の公開日時を表示用に整形する。"""
    if not published_at:
        return "不明"
    try:
        dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        return dt.astimezone(timezone(timedelta(hours=9))).strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return published_at


def _print_top_videos(videos: list[Video], *, label: str, days: int, top_n: int) -> None:
    print(f"取得モード: {label} / 過去 {days} 日間 / 日本語のみ / トップ {top_n} 件")
    print(f"動画長さ: {VIDEO_DURATION}（4〜20分） / 除外: {EXCLUDE_TERMS}")
    print("=" * 60)

    for index, video in enumerate(videos, start=1):
        print(f"#{index}  {video.title}")
        print(f"    URL       : {video.url}")
        print(f"    サムネイル: {video.thumbnail_url}")
        print(f"    閲覧数    : {video.view_count:,}")
        print(f"    公開日時  : {_format_published_at(video.published_at)}")
        print()


def _parse_cli_mode(argv: list[str]) -> tuple[SearchMode, str | None]:
    if not argv:
        return "news", None
    if argv[0] in ("--channels", "channels"):
        return "channels", None
    if argv[0] in ("--single", "single") and len(argv) > 1:
        return "single", argv[1]
    return "single", argv[0]


def main() -> int:
    mode, keyword = _parse_cli_mode(sys.argv[1:])

    try:
        videos = fetch_top_videos(keyword=keyword, top_n=TOP_N, mode=mode)
    except (RuntimeError, requests.RequestException, OSError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    labels = {
        "news": "ニュース検索（複数キーワード）",
        "channels": "チャンネルホワイトリスト",
        "single": f'単一キーワード "{keyword}"',
    }

    if not videos:
        print(f"{labels[mode]}: 過去 {DEFAULT_DAYS} 日間に該当する日本語動画が見つかりませんでした。")
        return 0

    _print_top_videos(videos, label=labels[mode], days=DEFAULT_DAYS, top_n=TOP_N)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
