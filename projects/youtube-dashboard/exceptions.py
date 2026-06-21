"""プロジェクト共通の例外クラス。"""

from __future__ import annotations


class YouTubeAPIError(RuntimeError):
    """YouTube Data API 呼び出しに失敗した場合。"""


class LineAPIError(RuntimeError):
    """LINE Messaging API 呼び出しに失敗した場合。"""


class RankingNotFoundError(RuntimeError):
    """ranking.json が存在しない場合。"""
