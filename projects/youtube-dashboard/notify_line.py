#!/usr/bin/env python3
"""ranking.json を読み込み、LINE Messaging API で Flex Message を送信する。"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any

import requests

from config import API_TIMEOUT_SECONDS, DEFAULT_RANKING_JSON, LINE_PUSH_ENDPOINT
from env_utils import load_dotenv, require_line_credentials
from exceptions import LineAPIError, RankingNotFoundError
from line_flex import build_flex_message
from logging_config import setup_logging

logger = logging.getLogger(__name__)


def load_ranking(path: Path | None = None) -> dict[str, Any]:
    """
    ranking.json を読み込む。

    Args:
        path: JSON ファイルパス（None なら config のデフォルト）。

    Returns:
        ランキング辞書。

    Raises:
        RankingNotFoundError: ファイルが存在しない場合。
        json.JSONDecodeError: JSON 解析失敗時。
    """
    ranking_path = path or DEFAULT_RANKING_JSON
    if not ranking_path.is_file():
        raise RankingNotFoundError(
            f"ランキングデータが見つかりません: {ranking_path}"
            " 先に generate_html.py を実行してください。"
        )
    return json.loads(ranking_path.read_text(encoding="utf-8"))


def send_line_notification(
    token: str,
    user_id: str,
    flex_message: dict[str, Any],
) -> None:
    """
    LINE Push API で Flex Message を送信する。

    Args:
        token: Channel Access Token。
        user_id: 通知先 User ID。
        flex_message: build_flex_message の戻り値。

    Raises:
        LineAPIError: API 呼び出し失敗時。
        requests.RequestException: ネットワークエラー時。
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {"to": user_id, "messages": [flex_message]}

    logger.info("Sending LINE Flex Message to user %s...", user_id[:8])
    response = requests.post(
        LINE_PUSH_ENDPOINT,
        headers=headers,
        json=payload,
        timeout=API_TIMEOUT_SECONDS,
    )

    if response.ok:
        logger.info("LINE notification sent successfully.")
        return

    try:
        error_body = response.json()
        message = error_body.get("message", response.text)
    except ValueError:
        message = response.text

    logger.error("LINE API error (%s): %s", response.status_code, message)
    raise LineAPIError(f"LINE API error ({response.status_code}): {message}")


def notify_line_from_ranking(
    ranking_path: Path | None = None,
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    """
    ranking.json から Flex Message を構築し、必要なら LINE に送信する。

    Args:
        ranking_path: ranking.json のパス。
        dry_run: True のとき送信せず Flex JSON のみ返す。

    Returns:
        送信（または dry-run）した flex メッセージ dict。
    """
    load_dotenv()
    ranking = load_ranking(ranking_path)
    flex_message = build_flex_message(ranking)

    if dry_run:
        logger.info("Dry run: LINE には送信しません。")
        return flex_message

    token, user_id = require_line_credentials()
    send_line_notification(token, user_id, flex_message)
    return flex_message


def main() -> int:
    """CLI エントリーポイント。"""
    setup_logging()
    dry_run = "--dry-run" in sys.argv

    try:
        flex_message = notify_line_from_ranking(dry_run=dry_run)
    except RankingNotFoundError as exc:
        logger.error("%s", exc)
        return 1
    except LineAPIError as exc:
        logger.error("LINE 送信失敗: %s", exc)
        return 1
    except (requests.RequestException, OSError, json.JSONDecodeError) as exc:
        logger.error("エラー: %s", exc)
        return 1

    if dry_run:
        print(json.dumps(flex_message, ensure_ascii=False, indent=2))
    else:
        print("LINE Flex Message を送信しました。")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
