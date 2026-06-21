#!/usr/bin/env python3
"""
YouTube 動画ランキング取得のオーケストレーションと CLI。

API 取得: youtube_client
フィルタ・ソート: video_filters
設定: config
"""

from __future__ import annotations

import logging
import sys
from typing import Any

import requests

from config import (
    DEFAULT_DAYS,
    EXCLUDE_TERMS,
    PER_CHANNEL_MAX,
    SEARCH_POOL_MAX,
    SEARCH_POOL_PER_QUERY,
    SEARCH_QUERY_TEMPLATES,
    TOP_N,
    TRUSTED_CHANNEL_IDS,
    VIDEO_DURATION,
)
from env_utils import load_dotenv, require_youtube_api_key
from exceptions import YouTubeAPIError
from format_utils import format_published_at
from logging_config import setup_logging
from models import SearchMode, Video
from video_filters import filter_and_sort_videos
from youtube_client import (
    build_search_query,
    fetch_video_details,
    merge_unique_video_ids,
    search_video_ids,
)

# 後方互換: 他モジュールから import される定数・シンボル
from config import PROJECT_DIR  # noqa: F401

logger = logging.getLogger(__name__)

# 旧 import 互換
_load_dotenv = load_dotenv


def get_youtube_video_ids_for_news(
    api_key: str,
    *,
    days: int,
    queries: list[str],
    per_query_max: int,
) -> list[str]:
    """
    複数キーワードで search.list を実行し、動画 ID を統合する。

    Args:
        api_key: YouTube API キー。
        days: 過去 N 日間。
        queries: 検索キーワードテンプレートリスト。
        per_query_max: クエリあたりの最大件数。

    Returns:
        重複除去済みの動画 ID リスト。
    """
    id_lists = [
        search_video_ids(
            api_key,
            query=build_search_query(template),
            days=days,
            max_results=per_query_max,
        )
        for template in queries
    ]
    return merge_unique_video_ids(*id_lists)


def get_youtube_video_ids_for_channels(
    api_key: str,
    *,
    days: int,
    channel_ids: list[str],
    per_channel_max: int,
) -> list[str]:
    """ホワイトリストチャンネルから動画 ID を取得する。"""
    id_lists = [
        search_video_ids(
            api_key,
            channel_id=channel_id,
            days=days,
            max_results=per_channel_max,
        )
        for channel_id in channel_ids
    ]
    return merge_unique_video_ids(*id_lists)


def get_youtube_videos(
    api_key: str,
    video_ids: list[str],
    *,
    japanese_only: bool,
) -> list[Video]:
    """動画 ID リストから Video 詳細を取得する。"""
    return fetch_video_details(api_key, video_ids, japanese_only=japanese_only)


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

    Args:
        days: 過去 N 日間。
        top_n: 返却件数。
        queries: 検索キーワード（None なら config のテンプレート）。
        per_query_max: クエリあたりの検索件数。
        japanese_only: 日本語動画のみに絞るか。

    Returns:
        閲覧数降順の Video リスト。
    """
    load_dotenv()
    api_key = require_youtube_api_key()
    query_templates = queries or SEARCH_QUERY_TEMPLATES

    video_ids = get_youtube_video_ids_for_news(
        api_key,
        days=days,
        queries=query_templates,
        per_query_max=per_query_max,
    )
    videos = get_youtube_videos(api_key, video_ids, japanese_only=japanese_only)
    return filter_and_sort_videos(videos, top_n=top_n, japanese_only=japanese_only)


def fetch_top_videos_from_channels(
    channel_ids: list[str] | None = None,
    *,
    days: int = DEFAULT_DAYS,
    top_n: int = TOP_N,
    per_channel_max: int = PER_CHANNEL_MAX,
    japanese_only: bool = True,
) -> list[Video]:
    """信頼チャンネル（ホワイトリスト）からトップ N 件を返す。"""
    load_dotenv()
    api_key = require_youtube_api_key()
    channels = channel_ids or TRUSTED_CHANNEL_IDS

    video_ids = get_youtube_video_ids_for_channels(
        api_key,
        days=days,
        channel_ids=channels,
        per_channel_max=per_channel_max,
    )
    videos = get_youtube_videos(api_key, video_ids, japanese_only=japanese_only)
    return filter_and_sort_videos(videos, top_n=top_n, japanese_only=japanese_only)


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

    Args:
        keyword: 単一キーワード（mode='single' 時必須）。
        days: 過去 N 日間。
        top_n: 返却件数。
        japanese_only: 日本語フィルタ。
        mode: ``news`` / ``channels`` / ``single``。
        channel_ids: ホワイトリストチャンネル ID。

    Returns:
        閲覧数降順の Video リスト。
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
        load_dotenv()
        api_key = require_youtube_api_key()
        video_ids = search_video_ids(
            api_key,
            query=build_search_query(keyword),
            days=days,
            max_results=SEARCH_POOL_MAX,
        )
        videos = get_youtube_videos(api_key, video_ids, japanese_only=japanese_only)
        return filter_and_sort_videos(videos, top_n=top_n, japanese_only=japanese_only)

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
) -> list[dict[str, Any]]:
    """fetch_top_videos の結果を辞書リストで返す。"""
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


def _print_top_videos(videos: list[Video], *, label: str, days: int, top_n: int) -> None:
    print(f"取得モード: {label} / 過去 {days} 日間 / 日本語のみ / トップ {top_n} 件")
    print(f"動画長さ: {VIDEO_DURATION}（4〜20分） / 除外: {EXCLUDE_TERMS}")
    print("=" * 60)

    for index, video in enumerate(videos, start=1):
        print(f"#{index}  {video.title}")
        print(f"    URL       : {video.url}")
        print(f"    サムネイル: {video.thumbnail_url}")
        print(f"    閲覧数    : {video.view_count:,}")
        print(f"    公開日時  : {format_published_at(video.published_at)}")
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
    """CLI エントリーポイント。"""
    setup_logging()
    mode, keyword = _parse_cli_mode(sys.argv[1:])

    labels = {
        "news": "ニュース検索（複数キーワード）",
        "channels": "チャンネルホワイトリスト",
        "single": f'単一キーワード "{keyword}"',
    }

    try:
        videos = fetch_top_videos(keyword=keyword, top_n=TOP_N, mode=mode)
    except YouTubeAPIError as exc:
        logger.error("YouTube API エラー: %s", exc)
        return 1
    except (requests.RequestException, OSError, ValueError) as exc:
        logger.error("エラー: %s", exc)
        return 1

    if not videos:
        logger.warning(
            "%s: 過去 %d 日間に該当する日本語動画が見つかりませんでした。",
            labels[mode],
            DEFAULT_DAYS,
        )
        return 0

    _print_top_videos(videos, label=labels[mode], days=DEFAULT_DAYS, top_n=TOP_N)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
