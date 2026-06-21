#!/usr/bin/env python3
"""
トップ N 動画データを取得し、Jinja2 テンプレートから GitHub Pages 用 index.html を生成する。
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from fetch_videos import (
    DEFAULT_DAYS,
    TOP_N,
    SearchMode,
    Video,
    fetch_top_videos,
)

PROJECT_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = PROJECT_DIR / "templates"
DEFAULT_OUTPUT = PROJECT_DIR / "index.html"
JST = timezone(timedelta(hours=9))
MODE_LABELS = {
    "news": "ニュース検索（複数キーワード）",
    "channels": "チャンネルホワイトリスト",
    "single": "単一キーワード検索",
}


def _format_published_at(published_at: str) -> str:
    if not published_at:
        return "不明"
    try:
        dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        return dt.astimezone(JST).strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return published_at


def _video_to_template_dict(video: Video, rank: int) -> dict[str, str | int]:
    return {
        "rank": rank,
        "video_id": video.video_id,
        "title": video.title,
        "url": video.url,
        "thumbnail_url": video.thumbnail_url,
        "view_count": video.view_count,
        "view_count_display": f"{video.view_count:,}",
        "published_at": video.published_at,
        "published_at_display": _format_published_at(video.published_at),
    }


def generate_dashboard_html(
    *,
    output_path: Path | None = None,
    top_n: int = TOP_N,
    period_days: int = DEFAULT_DAYS,
    mode: SearchMode = "news",
    keyword: str | None = None,
) -> Path:
    """動画ランキングを取得し、静的 index.html を生成する。"""
    videos = fetch_top_videos(keyword=keyword, top_n=top_n, mode=mode)
    template_videos = [_video_to_template_dict(video, rank) for rank, video in enumerate(videos, start=1)]

    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("index.html.j2")
    html = template.render(
        videos=template_videos,
        top_n=top_n,
        period_days=period_days,
        generated_at=datetime.now(JST).strftime("%Y年%m月%d日 %H:%M"),
        mode_label=MODE_LABELS.get(mode, mode),
    )

    destination = output_path or DEFAULT_OUTPUT
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(html, encoding="utf-8")
    return destination


def main() -> int:
    mode: SearchMode = "news"
    keyword: str | None = None

    if len(sys.argv) > 1 and sys.argv[1] in ("--channels", "channels"):
        mode = "channels"
    elif len(sys.argv) > 2 and sys.argv[1] in ("--single", "single"):
        mode = "single"
        keyword = sys.argv[2]

    try:
        output = generate_dashboard_html(mode=mode, keyword=keyword)
    except Exception as exc:  # noqa: BLE001 - CLI entrypoint
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(f"Generated: {output}")
    print(f"Open locally: file://{output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
