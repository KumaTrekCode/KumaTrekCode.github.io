"""ドメインモデルと型定義。"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Literal

SearchMode = Literal["news", "channels", "single"]


@dataclass(frozen=True)
class Video:
    """YouTube 動画1件分のランキングデータ。"""

    video_id: str
    title: str
    url: str
    thumbnail_url: str
    view_count: int
    published_at: str

    def to_dict(self) -> dict[str, str | int]:
        """Jinja2 / LINE 連携用の辞書に変換する。"""
        return asdict(self)
