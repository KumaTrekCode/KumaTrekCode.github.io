"""環境変数の読み込みと認証情報の検証。"""

from __future__ import annotations

import logging
import os

from config import PLACEHOLDER_LINE_SECRETS, PLACEHOLDER_YOUTUBE_API_KEYS, PROJECT_DIR

logger = logging.getLogger(__name__)


def load_dotenv() -> None:
    """
    プロジェクト直下の .env を読み込む。

    シェル未設定、またはプレースホルダー値のときのみ上書きする。
    """
    env_path = PROJECT_DIR / ".env"
    if not env_path.is_file():
        logger.debug(".env が見つかりません: %s", env_path)
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if not key:
            continue

        current = os.environ.get(key, "").strip()
        placeholders = PLACEHOLDER_YOUTUBE_API_KEYS | PLACEHOLDER_LINE_SECRETS
        if key not in os.environ or current in placeholders:
            os.environ[key] = value

    logger.debug(".env を読み込みました: %s", env_path)


def require_youtube_api_key() -> str:
    """
    YouTube API キーを環境変数から取得する。

    Returns:
        有効な API キー文字列。

    Raises:
        RuntimeError: 未設定またはプレースホルダーの場合。
    """
    api_key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "YOUTUBE_API_KEY が未設定です。"
            " .env.example をコピーして .env を作成するか、"
            " GitHub Secrets に登録してください。"
        )
    if api_key in PLACEHOLDER_YOUTUBE_API_KEYS:
        raise RuntimeError(
            "YOUTUBE_API_KEY にプレースホルダー文字列が設定されています。"
            " 実際の API キー（例: AIzaSy...）を設定してください。"
        )
    return api_key


def require_line_credentials() -> tuple[str, str]:
    """
    LINE Push API 用の認証情報を環境変数から取得する。

    Returns:
        (channel_access_token, user_id) のタプル。

    Raises:
        RuntimeError: 未設定またはプレースホルダーの場合。
    """
    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    user_id = os.environ.get("LINE_USER_ID", "").strip()

    if not token or not user_id:
        raise RuntimeError(
            "LINE_CHANNEL_ACCESS_TOKEN と LINE_USER_ID が未設定です。"
            " .env または GitHub Secrets に登録してください。"
        )
    if token in PLACEHOLDER_LINE_SECRETS or user_id in PLACEHOLDER_LINE_SECRETS:
        raise RuntimeError(
            "LINE の認証情報にプレースホルダー文字列が設定されています。"
        )
    return token, user_id
