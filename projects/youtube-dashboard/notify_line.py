#!/usr/bin/env python3
"""
ranking.json を読み込み、LINE Messaging API で Flex Message（カルーセル）を送信する。
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

import requests

from fetch_videos import PROJECT_DIR, _load_dotenv

LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push"
DEFAULT_RANKING_JSON = PROJECT_DIR / "ranking.json"
DASHBOARD_URL = "https://kumatrekcode.github.io/projects/youtube-dashboard/index.html"
TITLE_MAX_LEN = 55
PLACEHOLDER_SECRETS = frozenset(
    {
        "your_line_channel_access_token",
        "your_line_user_id",
    }
)


def _require_line_credentials() -> tuple[str, str]:
    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    user_id = os.environ.get("LINE_USER_ID", "").strip()

    if not token or not user_id:
        raise RuntimeError(
            "LINE_CHANNEL_ACCESS_TOKEN と LINE_USER_ID が未設定です。"
            " .env または GitHub Secrets に登録してください。"
        )
    if token in PLACEHOLDER_SECRETS or user_id in PLACEHOLDER_SECRETS:
        raise RuntimeError(
            "LINE の認証情報にプレースホルダー文字列が設定されています。"
            " 実際の Channel Access Token と User ID を設定してください。"
        )
    return token, user_id


def _truncate_title(title: str, *, max_len: int = TITLE_MAX_LEN) -> str:
    if len(title) <= max_len:
        return title
    return title[: max_len - 1] + "…"


def _rank_label(rank: int) -> str:
    return f"#{rank}"


def _rank_color(rank: int) -> str:
    return "#F59E0B" if rank == 1 else "#38BDF8"


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
                    "color": "#38BDF8",
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
                    "color": "#0EA5E9",
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
                    "text": _rank_label(rank),
                    "weight": "bold",
                    "color": _rank_color(rank),
                    "size": "sm",
                },
                {
                    "type": "text",
                    "text": _truncate_title(str(video["title"])),
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
    """Flex Message（カルーセル）を組み立てる。"""
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


def load_ranking(path: Path | None = None) -> dict[str, Any]:
    ranking_path = path or DEFAULT_RANKING_JSON
    if not ranking_path.is_file():
        raise RuntimeError(
            f"ランキングデータが見つかりません: {ranking_path}"
            " 先に generate_html.py を実行してください。"
        )
    return json.loads(ranking_path.read_text(encoding="utf-8"))


def send_line_flex_message(
    token: str,
    user_id: str,
    flex_message: dict[str, Any],
) -> None:
    """LINE Push API で Flex Message を送信する。"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "to": user_id,
        "messages": [flex_message],
    }

    response = requests.post(LINE_PUSH_ENDPOINT, headers=headers, json=payload, timeout=30)
    if response.ok:
        return

    try:
        error = response.json()
        message = error.get("message", response.text)
    except ValueError:
        message = response.text

    raise RuntimeError(f"LINE API error ({response.status_code}): {message}")


def notify_line_from_ranking(
    ranking_path: Path | None = None,
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    """ranking.json から Flex Message を送信する。"""
    _load_dotenv()
    ranking = load_ranking(ranking_path)
    flex_message = build_flex_message(ranking)

    if dry_run:
        return flex_message

    token, user_id = _require_line_credentials()
    send_line_flex_message(token, user_id, flex_message)
    return flex_message


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    try:
        flex_message = notify_line_from_ranking(dry_run=dry_run)
    except (RuntimeError, requests.RequestException, OSError, json.JSONDecodeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    if dry_run:
        print(json.dumps(flex_message, ensure_ascii=False, indent=2))
        print("Dry run: LINE には送信しませんでした。", file=sys.stderr)
    else:
        print("LINE Flex Message を送信しました。")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
