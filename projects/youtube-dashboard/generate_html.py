#!/usr/bin/env python3
"""トップ N 動画データを取得し、Jinja2 テンプレートから GitHub Pages 用 HTML を生成する。"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any

import requests
from jinja2 import Environment, FileSystemLoader, select_autoescape

from config import (
    DASHBOARD_URL,
    DEFAULT_DAYS,
    DEFAULT_HTML_OUTPUT,
    DEFAULT_RANKING_JSON,
    MODE_LABELS,
    TEMPLATE_DIR,
    TOP_N,
)
from exceptions import YouTubeAPIError
from fetch_videos import fetch_top_videos
from format_utils import format_generated_at, format_published_at
from logging_config import setup_logging
from models import SearchMode, Video

logger = logging.getLogger(__name__)


def video_to_template_dict(video: Video, rank: int) -> dict[str, str | int]:
    """Video を Jinja2 / ranking.json 用の辞書に変換する。"""
    return {
        "rank": rank,
        "video_id": video.video_id,
        "title": video.title,
        "url": video.url,
        "thumbnail_url": video.thumbnail_url,
        "view_count": video.view_count,
        "view_count_display": f"{video.view_count:,}",
        "published_at": video.published_at,
        "published_at_display": format_published_at(video.published_at),
    }


def build_ranking_payload(
    template_videos: list[dict[str, Any]],
    *,
    top_n: int,
    period_days: int,
    generated_at: str,
    mode: SearchMode,
) -> dict[str, Any]:
    """ranking.json 用のペイロードを組み立てる。"""
    return {
        "generated_at": generated_at,
        "period_days": period_days,
        "top_n": top_n,
        "mode_label": MODE_LABELS.get(mode, mode),
        "dashboard_url": DASHBOARD_URL,
        "videos": template_videos,
    }


def generate_html_from_template(
    template_videos: list[dict[str, Any]],
    *,
    top_n: int,
    period_days: int,
    generated_at: str,
    mode: SearchMode,
) -> str:
    """
    Jinja2 テンプレートから HTML 文字列を生成する。

    Args:
        template_videos: テンプレートに渡す動画 dict リスト。
        top_n: ランキング件数。
        period_days: 対象期間（日数）。
        generated_at: 更新日時表示文字列。
        mode: 取得モード。

    Returns:
        レンダリング済み HTML 文字列。
    """
    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("index.html.j2")
    return template.render(
        videos=template_videos,
        top_n=top_n,
        period_days=period_days,
        generated_at=generated_at,
        mode_label=MODE_LABELS.get(mode, mode),
    )


def write_dashboard_outputs(
    html: str,
    ranking_payload: dict[str, Any],
    *,
    output_path: Path,
    ranking_json_path: Path,
) -> Path:
    """
    index.html と ranking.json をファイルに書き出す。

    Args:
        html: 生成済み HTML。
        ranking_payload: ranking.json の内容。
        output_path: index.html の出力先。
        ranking_json_path: ranking.json の出力先。

    Returns:
        index.html の出力 Path。
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")
    ranking_json_path.write_text(
        json.dumps(ranking_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    logger.info("Wrote HTML: %s", output_path)
    logger.info("Wrote ranking JSON: %s", ranking_json_path)
    return output_path


def generate_dashboard_html(
    *,
    output_path: Path | None = None,
    ranking_json_path: Path | None = None,
    top_n: int = TOP_N,
    period_days: int = DEFAULT_DAYS,
    mode: SearchMode = "news",
    keyword: str | None = None,
) -> Path:
    """
    動画ランキングを取得し、静的 index.html と ranking.json を生成する。

    Args:
        output_path: HTML 出力先。
        ranking_json_path: ranking.json 出力先。
        top_n: ランキング件数。
        period_days: 対象期間（日数）。
        mode: 取得モード。
        keyword: 単一キーワード（mode='single' 時）。

    Returns:
        生成した index.html の Path。

    Raises:
        YouTubeAPIError: YouTube API 失敗時。
    """
    videos = fetch_top_videos(keyword=keyword, top_n=top_n, mode=mode)
    template_videos = [
        video_to_template_dict(video, rank)
        for rank, video in enumerate(videos, start=1)
    ]
    generated_at = format_generated_at()

    html = generate_html_from_template(
        template_videos,
        top_n=top_n,
        period_days=period_days,
        generated_at=generated_at,
        mode=mode,
    )
    ranking_payload = build_ranking_payload(
        template_videos,
        top_n=top_n,
        period_days=period_days,
        generated_at=generated_at,
        mode=mode,
    )

    return write_dashboard_outputs(
        html,
        ranking_payload,
        output_path=output_path or DEFAULT_HTML_OUTPUT,
        ranking_json_path=ranking_json_path or DEFAULT_RANKING_JSON,
    )


def main() -> int:
    """CLI エントリーポイント。"""
    setup_logging()
    mode: SearchMode = "news"
    keyword: str | None = None

    if len(sys.argv) > 1 and sys.argv[1] in ("--channels", "channels"):
        mode = "channels"
    elif len(sys.argv) > 2 and sys.argv[1] in ("--single", "single"):
        mode = "single"
        keyword = sys.argv[2]

    try:
        output = generate_dashboard_html(mode=mode, keyword=keyword)
    except YouTubeAPIError as exc:
        logger.error("YouTube API エラー（クォータ超過の可能性）: %s", exc)
        return 1
    except (requests.RequestException, OSError, ValueError) as exc:
        logger.error("HTML 生成エラー: %s", exc)
        return 1

    print(f"Generated: {output}")
    print(f"Ranking JSON: {DEFAULT_RANKING_JSON.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
