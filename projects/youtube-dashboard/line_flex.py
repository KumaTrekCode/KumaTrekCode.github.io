"""LINE Flex Message（カルーセル）の組み立て。"""

from __future__ import annotations

from typing import Any

from config import (
    DASHBOARD_URL,
    LINE_DEFAULT_RANK_COLOR,
    LINE_PRIMARY_BUTTON_COLOR,
    LINE_RANK1_COLOR,
    LINE_TITLE_MAX_LEN,
)


def truncate_title(title: str, *, max_len: int = LINE_TITLE_MAX_LEN) -> str:
    """Flex Message 用にタイトルを短縮する。"""
    if len(title) <= max_len:
        return title
    return title[: max_len - 1] + "…"


def rank_color(rank: int) -> str:
    """ランキング順位に応じたアクセントカラーを返す。"""
    return LINE_RANK1_COLOR if rank == 1 else LINE_DEFAULT_RANK_COLOR


def build_intro_bubble(
    *,
    generated_at: str,
    period_days: int,
    top_n: int,
    dashboard_url: str = DASHBOARD_URL,
) -> dict[str, Any]:
    """ランキング概要の先頭バブル。"""
    return {
        "type": "bubble",
        "size": "mega",
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "contents": [
                {
                    "type": "text",
                    "text": "CREDIT CARD VIDEO RANKING",
                    "size": "xs",
                    "color": LINE_DEFAULT_RANK_COLOR,
                    "weight": "bold",
                },
                {
                    "type": "text",
                    "text": f"今週のクレカ動画 TOP{top_n}",
                    "weight": "bold",
                    "size": "xl",
                    "wrap": True,
                },
                {
                    "type": "text",
                    "text": f"更新: {generated_at}",
                    "size": "sm",
                    "color": "#94A3B8",
                    "wrap": True,
                },
                {
                    "type": "text",
                    "text": f"過去 {period_days} 日間 / 閲覧数順",
                    "size": "sm",
                    "color": "#94A3B8",
                    "wrap": True,
                },
            ],
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "button",
                    "style": "primary",
                    "color": LINE_PRIMARY_BUTTON_COLOR,
                    "action": {
                        "type": "uri",
                        "label": "ダッシュボードを見る",
                        "uri": dashboard_url,
                    },
                }
            ],
        },
    }


def build_video_bubble(video: dict[str, Any]) -> dict[str, Any]:
    """動画1件分のカルーセルバブル。"""
    rank = int(video["rank"])
    bubble: dict[str, Any] = {
        "type": "bubble",
        "size": "mega",
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": f"#{rank}",
                    "weight": "bold",
                    "color": rank_color(rank),
                    "size": "sm",
                },
                {
                    "type": "text",
                    "text": truncate_title(str(video["title"])),
                    "weight": "bold",
                    "size": "md",
                    "wrap": True,
                },
                {
                    "type": "text",
                    "text": f"閲覧数 {video['view_count_display']}",
                    "size": "sm",
                    "color": "#94A3B8",
                },
                {
                    "type": "text",
                    "text": str(video.get("published_at_display", "")),
                    "size": "xs",
                    "color": "#64748B",
                },
            ],
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "button",
                    "style": "link",
                    "action": {
                        "type": "uri",
                        "label": "YouTube で見る",
                        "uri": str(video["url"]),
                    },
                }
            ],
        },
    }

    thumbnail_url = str(video.get("thumbnail_url", "")).strip()
    if thumbnail_url:
        bubble["hero"] = {
            "type": "image",
            "url": thumbnail_url,
            "size": "full",
            "aspectRatio": "16:9",
            "aspectMode": "cover",
        }

    return bubble


def build_flex_message(ranking: dict[str, Any]) -> dict[str, Any]:
    """
    ranking.json の内容から Flex Message（カルーセル）を組み立てる。

    Args:
        ranking: generate_html.py が出力したランキング辞書。

    Returns:
        LINE Push API に渡す flex メッセージ dict。
    """
    videos = ranking.get("videos", [])
    top_n = int(ranking.get("top_n", len(videos)))
    period_days = int(ranking.get("period_days", 7))
    generated_at = str(ranking.get("generated_at", ""))

    bubbles = [
        build_intro_bubble(
            generated_at=generated_at,
            period_days=period_days,
            top_n=top_n,
            dashboard_url=str(ranking.get("dashboard_url", DASHBOARD_URL)),
        )
    ]
    bubbles.extend(build_video_bubble(video) for video in videos)

    return {
        "type": "flex",
        "altText": f"今週のクレカ動画ランキング TOP{top_n}（{generated_at}）",
        "contents": {
            "type": "carousel",
            "contents": bubbles,
        },
    }
