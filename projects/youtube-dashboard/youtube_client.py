"""YouTube Data API v3 クライアント。"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import requests

from config import (
    API_TIMEOUT_SECONDS,
    EXCLUDE_TERMS,
    RELEVANCE_LANGUAGE,
    REGION_CODE,
    SEARCH_POOL_MAX,
    VIDEO_DURATION,
    YOUTUBE_SEARCH_ENDPOINT,
    YOUTUBE_VIDEOS_ENDPOINT,
    YOUTUBE_WATCH_URL,
)
from exceptions import YouTubeAPIError
from models import Video
from video_filters import is_japanese_snippet, is_noise_title

logger = logging.getLogger(__name__)


def build_search_query(base_query: str) -> str:
    """除外ワードを付与した検索クエリを組み立てる。"""
    return f"{base_query.strip()} {EXCLUDE_TERMS}".strip()


def published_after(days: int) -> str:
    """過去 N 日間の開始時刻を RFC 3339 (UTC) で返す。"""
    start = datetime.now(timezone.utc) - timedelta(days=days)
    return start.replace(microsecond=0).isoformat().replace("+00:00", "Z")


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

    logger.error("YouTube API error: %s", message)
    raise YouTubeAPIError(message)


def _pick_thumbnail_url(snippet: dict) -> str:
    """利用可能な最大サイズのサムネイル URL を返す。"""
    thumbnails = snippet.get("thumbnails", {})
    for size in ("maxres", "high", "medium", "default"):
        url = thumbnails.get(size, {}).get("url")
        if url:
            return url
    return ""


def search_video_ids(
    api_key: str,
    *,
    days: int,
    max_results: int,
    query: str | None = None,
    channel_id: str | None = None,
    video_duration: str = VIDEO_DURATION,
    order: str = "date",
) -> list[str]:
    """
    search.list で動画 ID を取得する。

    Args:
        api_key: YouTube Data API キー。
        days: 過去 N 日間。
        max_results: 最大取得件数。
        query: 検索キーワード（channel_id 未指定時）。
        channel_id: チャンネル ID（指定時は query 不要）。
        video_duration: API の videoDuration パラメータ。
        order: ソート順。

    Returns:
        動画 ID のリスト。

    Raises:
        YouTubeAPIError: API 呼び出し失敗時。
        ValueError: query も channel_id も未指定の場合。
    """
    params: dict[str, str | int] = {
        "key": api_key,
        "part": "snippet",
        "type": "video",
        "order": order,
        "publishedAfter": published_after(days),
        "maxResults": min(max_results, SEARCH_POOL_MAX),
        "regionCode": REGION_CODE,
        "relevanceLanguage": RELEVANCE_LANGUAGE,
        "videoDuration": video_duration,
    }

    if channel_id:
        params["channelId"] = channel_id
    elif query:
        params["q"] = query
    else:
        raise ValueError("query または channel_id のいずれかを指定してください。")

    logger.info("YouTube search: query=%s channel=%s", query, channel_id)
    response = requests.get(
        YOUTUBE_SEARCH_ENDPOINT, params=params, timeout=API_TIMEOUT_SECONDS
    )
    _raise_for_youtube_error(response)
    payload = response.json()

    video_ids: list[str] = []
    for item in payload.get("items", []):
        video_id = item.get("id", {}).get("videoId")
        if video_id:
            video_ids.append(video_id)

    logger.info("YouTube search returned %d video id(s)", len(video_ids))
    return video_ids


def merge_unique_video_ids(*id_lists: list[str]) -> list[str]:
    """複数検索結果の動画 ID を重複なく結合する。"""
    merged: list[str] = []
    seen: set[str] = set()
    for video_ids in id_lists:
        for video_id in video_ids:
            if video_id not in seen:
                seen.add(video_id)
                merged.append(video_id)
    return merged


def fetch_video_details(
    api_key: str,
    video_ids: list[str],
    *,
    japanese_only: bool = False,
) -> list[Video]:
    """
    videos.list でタイトル・閲覧数などの詳細を取得する。

    Args:
        api_key: YouTube Data API キー。
        video_ids: 取得対象の動画 ID リスト。
        japanese_only: True のとき日本語動画のみ返す。

    Returns:
        Video オブジェクトのリスト。

    Raises:
        YouTubeAPIError: API 呼び出し失敗時。
    """
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

        response = requests.get(
            YOUTUBE_VIDEOS_ENDPOINT, params=params, timeout=API_TIMEOUT_SECONDS
        )
        _raise_for_youtube_error(response)
        payload = response.json()

        for item in payload.get("items", []):
            video_id = item["id"]
            snippet = item["snippet"]
            statistics = item.get("statistics", {})
            title = snippet["title"]

            if japanese_only and not is_japanese_snippet(snippet):
                continue
            if is_noise_title(title):
                continue

            videos.append(
                Video(
                    video_id=video_id,
                    title=title,
                    url=YOUTUBE_WATCH_URL.format(video_id=video_id),
                    thumbnail_url=_pick_thumbnail_url(snippet),
                    view_count=int(statistics.get("viewCount", 0)),
                    published_at=snippet.get("publishedAt", ""),
                )
            )

    logger.info("Fetched %d video detail(s)", len(videos))
    return videos
