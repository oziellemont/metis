"""
Outbound-send health — records whether the agent's replies actually land.

``check_messaging_health`` only reads, and reads and writes use different
provider scopes, so a channel with ``chat:write`` revoked still answers reads
fine while every reply 403s. Probing from the health check would spam the
customer's channel every 15 minutes, so the send path records its outcome here
and processes/health_service.py reads it.

State: {"ok", "at", "status", "consecutive_failures", "channel", "message"}.
Best-effort throughout: recording must never be why a reply fails.
"""

import json
import time
from pathlib import Path
from typing import Any, Dict, Optional

import requests

SEND_HEALTH_FILE = Path("/workspace/logs/ninja_send_health")

# Refused on permission grounds, not transiently: every later reply fails the
# same way until a human restores the scope, so one is enough to alarm.
AUTH_FAILURE_STATUSES = (401, 403)


def _read_state() -> Dict[str, Any]:
    """Return the recorded send state, or {} when absent/unreadable."""
    try:
        state = json.loads(SEND_HEALTH_FILE.read_text())
        return state if isinstance(state, dict) else {}
    except (OSError, ValueError):
        return {}


def _write_state(state: Dict[str, Any]) -> None:
    """Persist send state. Best-effort — never raises."""
    try:
        SEND_HEALTH_FILE.parent.mkdir(parents=True, exist_ok=True)
        SEND_HEALTH_FILE.write_text(json.dumps(state))
    except OSError:
        pass


def record_send_success(channel: Optional[str] = None) -> None:
    """Record a delivered message, clearing the consecutive-failure count."""
    _write_state(
        {
            "ok": True,
            "at": int(time.time()),
            "status": None,
            "consecutive_failures": 0,
            "channel": channel or "",
            "message": "",
        }
    )


def record_send_failure(
    status: Optional[int] = None,
    channel: Optional[str] = None,
    message: str = "",
) -> None:
    """Record a failed message.

    ``status`` is the HTTP status when available, else None for a transport
    error. Failures accumulate so the health check can tell a blip from a
    channel that persistently cannot reply.
    """
    previous = _read_state()
    consecutive = int(previous.get("consecutive_failures", 0) or 0) + 1
    _write_state(
        {
            "ok": False,
            "at": int(time.time()),
            "status": status,
            "consecutive_failures": consecutive,
            "channel": channel or previous.get("channel", ""),
            "message": (message or "")[:200],
        }
    )


def status_of(exc: BaseException) -> Optional[int]:
    """Return the HTTP status carried by an exception, or None.

    Mirrors ``processes.common.http_status_of``, duplicated because importing
    it here would close an import cycle via the orchestrator.
    """
    if isinstance(exc, requests.exceptions.HTTPError) and exc.response is not None:
        return exc.response.status_code
    return None


def record_send_exception(exc: BaseException, channel: Optional[str] = None) -> None:
    """Record a failed send straight from the raised exception."""
    record_send_failure(
        status=status_of(exc), channel=channel, message=f"{type(exc).__name__}: {exc}"
    )


def read_send_health() -> Dict[str, Any]:
    """Return the recorded send state, or {} when nothing has been sent yet."""
    return _read_state()
