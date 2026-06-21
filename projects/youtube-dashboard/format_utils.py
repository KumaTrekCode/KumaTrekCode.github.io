"""日時などの表示用フォーマット。"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

JST = timezone(timedelta(hours=9))


def format_published_at(published_at: str) -> str:
    """
    ISO 8601 の公開日時を JST 表示用に整形する。

    Args:
        published_at: YouTube API の publishedAt 文字列。

    Returns:
        ``YYYY-MM-DD HH:MM`` 形式。解析不能時は入力をそのまま返す。
    """
    if not published_at:
        return "不明"
    try:
        dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        return dt.astimezone(JST).strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return published_at


def format_generated_at() -> str:
    """ダッシュボード更新日時（日本語表示）を返す。"""
    return datetime.now(JST).strftime("%Y年%m月%d日 %H:%M")
