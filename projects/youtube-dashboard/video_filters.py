"""動画の日本語判定・ノイズ除外・ソート。"""

from __future__ import annotations

import re

from config import JAPANESE_TEXT_MIN_CHARS, NOISE_TITLE_PATTERN
from models import Video

JAPANESE_CHAR_RE = re.compile(r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3400-\u4DBF]")
NOISE_TITLE_RE = re.compile(NOISE_TITLE_PATTERN)


def is_japanese_language_code(code: str | None) -> bool:
    """言語コードが日本語（ja）かどうか。"""
    return bool(code and code.lower().startswith("ja"))


def has_japanese_text(text: str, *, min_chars: int = JAPANESE_TEXT_MIN_CHARS) -> bool:
    """ひらがな・カタカナ・漢字が一定数以上含まれるか。"""
    return len(JAPANESE_CHAR_RE.findall(text)) >= min_chars


def is_japanese_snippet(snippet: dict) -> bool:
    """
    snippet が日本語動画かどうかを判定する。

    1. 言語メタデータが非 ja → 除外
    2. いずれかが ja → 採用
    3. 未設定 → タイトルに日本語文字があれば採用
    """
    audio_lang = snippet.get("defaultAudioLanguage")
    default_lang = snippet.get("defaultLanguage")

    for code in (audio_lang, default_lang):
        if code and not is_japanese_language_code(code):
            return False

    if is_japanese_language_code(audio_lang) or is_japanese_language_code(default_lang):
        return True

    return has_japanese_text(snippet.get("title", ""))


def is_noise_title(title: str) -> bool:
    """ショート動画や無関係ジャンルのタイトルか。"""
    return bool(NOISE_TITLE_RE.search(title))


def filter_videos(
    videos: list[Video],
    *,
    japanese_only: bool = True,
) -> list[Video]:
    """
    ノイズタイトルを除外する。japanese_only は API 取得側で snippet 判定済みのため
    ここではタイトルノイズのみ追加除外する。

    Args:
        videos: フィルタ対象の動画リスト。
        japanese_only: 互換用（取得時に日本語フィルタ済み）。

    Returns:
        フィルタ後の動画リスト。
    """
    del japanese_only  # 取得段階で適用済み
    return [video for video in videos if not is_noise_title(video.title)]


def filter_and_sort_videos(
    videos: list[Video],
    *,
    top_n: int,
    japanese_only: bool = True,
) -> list[Video]:
    """
    動画をフィルタし、閲覧数降順で上位 N 件を返す。

    Args:
        videos: 対象動画リスト。
        top_n: 返却件数の上限。
        japanese_only: 日本語フィルタを有効にするか（互換用）。

    Returns:
        閲覧数降順の上位 N 件。
    """
    filtered = filter_videos(videos, japanese_only=japanese_only)
    filtered.sort(key=lambda video: video.view_count, reverse=True)
    return filtered[:top_n]
