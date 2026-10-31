"""WhatsApp monitor helpers — gateway client, prompts, inbound filters."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

from core.logging import get_logger
from services.whatsapp.recent_context import MAX_MESSAGES, record_message, render_recent

logger = get_logger("whatsapp")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SETTINGS_PATH = Path.home() / ".agent_settings.json"

WA_CLI = "python messaging/whatsapp/interface.py"

SYSTEM_PROMPT_TEMPLATE = (
    REPO_ROOT / "messaging" / "whatsapp" / "gateway" / "system-prompt.md"
)
SYSTEM_PROMPT_RENDERED = Path("/tmp/ninja-wa-system-prompt.md")


def _read_settings() -> dict[str, Any]:
    if not SETTINGS_PATH.exists():
        return {}
    try:
        return json.loads(SETTINGS_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return {}


def _write_whatsapp_settings(patch: dict[str, Any]) -> None:
    settings = _read_settings()
    existing = (
        settings.get("whatsapp") if isinstance(settings.get("whatsapp"), dict) else {}
    )
    merged = {**existing, **patch}
    settings["whatsapp"] = merged
    SETTINGS_PATH.write_text(json.dumps(settings, indent=2))


def _settings_whatsapp() -> dict[str, Any]:
    s = _read_settings().get("whatsapp")
    return s if isinstance(s, dict) else {}


def _gateway_url() -> str:
    from messaging.whatsapp._config import gateway_url

    return gateway_url()


def _gateway_token() -> Optional[str]:
    from messaging.whatsapp._config import gateway_token

    return gateway_token()


def _request(
    method: str,
    url: str,
    *,
    token: Optional[str] = None,
    body: Optional[dict[str, Any]] = None,
    timeout: float = 15.0,
) -> tuple[int, bytes]:
    data = None
    headers: dict[str, str] = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except urllib.error.URLError as e:
        return 0, f"connection failed: {e.reason}".encode("utf-8")


def _get_status(base: str, token: Optional[str]) -> Optional[dict[str, Any]]:
    status, raw = _request("GET", f"{base}/status", token=token)
    if status != 200:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def _get_messages(
    base: str, token: Optional[str], since: int, limit: int
) -> Optional[dict[str, Any]]:
    url = f"{base}/messages?since={since}&limit={limit}"
    status, raw = _request("GET", url, token=token)
    if status != 200:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


# ---------------------------------------------------------------------------
# Prompt helpers
# ---------------------------------------------------------------------------


def _derive_targets(bound_chat_jid: str) -> tuple[str, str]:
    """Build (reply_hint, upload_hint) for the bound chat.

    Both _build_prompt and _render_system_prompt call this; they MUST stay in
    sync — diverging hints would tell the agent the wrong destination flag.
    """
    if bound_chat_jid.endswith("@g.us"):
        reply_hint = (
            f'{WA_CLI} say "<your reply>" '
            f"--ninja-prefix --group-jid {bound_chat_jid}"
        )
        upload_target = f"--group-jid {bound_chat_jid}"
    else:
        digits = "".join(c for c in bound_chat_jid.split("@")[0] if c.isdigit())
        reply_hint = f'{WA_CLI} say "<your reply>" ' f"--ninja-prefix --to {digits}"
        upload_target = f"--to {digits}"
    upload_hint = (
        f"{WA_CLI} upload --kind image|document "
        f'--file <path> [--caption "<text>"] --ninja-prefix {upload_target}'
    )
    return reply_hint, upload_hint


def _render_system_prompt(bound_chat_jid: str) -> Optional[Path]:
    """Render the WhatsApp system prompt for this bound chat.

    Returns None on template/disk failure — dispatch then skips
    --append-system-prompt-file rather than failing the turn.
    """
    try:
        template = SYSTEM_PROMPT_TEMPLATE.read_text(encoding="utf-8")
    except (FileNotFoundError, OSError):
        return None
    _, upload_hint = _derive_targets(bound_chat_jid)
    rendered = template.replace("{BOUND_CHAT_JID}", bound_chat_jid).replace(
        "{UPLOAD_HINT}", upload_hint
    )
    try:
        SYSTEM_PROMPT_RENDERED.write_text(rendered, encoding="utf-8")
    except OSError:
        return None
    return SYSTEM_PROMPT_RENDERED


def _record_pending(pending: list[dict[str, Any]]) -> None:
    """Record inbound user lines into the shared recent_context buffer.

    Must be called ONCE in the main loop before fan-out — calling from workers
    would race on insertion order across the pool.
    """
    for msg in pending:
        record_message(
            "user",
            (msg.get("text") or "").replace("\n", " "),
            ts=msg.get("timestamp"),
        )


def _build_prompt(
    pending: list[dict[str, Any]],
    bound_chat_jid: str,
    *,
    current_tag: Optional[str] = None,
    same_session_continuation: bool = False,
) -> str:
    """Build a batched WhatsApp turn prompt. Pure — no side effects.

    current_tag filters recent_context to lines the calling session does NOT
    already have in its --resume history. same_session_continuation drops the
    persona-unification preamble; only safe when the worker that handled the
    last turn for this chat is handling this one too.
    """
    reply_hint, _ = _derive_targets(bound_chat_jid)

    # MUST run before _record_pending or pending msgs round-trip into their own context.
    history = render_recent(unified=True, exclude_tag=current_tag)

    lines: list[str] = []
    for i, msg in enumerate(pending, 1):
        text = (msg.get("text") or "").replace("\n", " ")
        # Sender fallback: pushName > participant > user_id.
        sender = (
            msg.get("sender_name")
            or msg.get("participant")
            or msg.get("user")
            or "unknown"
        )

        block = [
            f"--- Message {i} (whatsapp) ---",
            f"From: {sender}",
            f"Time: {msg.get('timestamp', '')}",
            f"Text: {text}" if text else "Text: (none)",
        ]

        # Gateway-truncated at 1000 chars + ellipsis.
        quoted_text = msg.get("quoted_text")
        if quoted_text:
            qsender = msg.get("quoted_sender") or "(unknown)"
            block.append(f"↪️ Replying to {qsender}: {quoted_text}")

        # Bytes fetched via `whatsapp_interface fetch-media` — auth resolved
        # from settings/env, never embed the literal token in the prompt.
        kind = msg.get("media_kind")
        media_id = msg.get("media_id")
        if kind and media_id:
            fetch_cmd = (
                f"{WA_CLI} fetch-media "
                f"--media-id {media_id} --out /tmp/wa_{media_id}"
            )
            mime = msg.get("media_mimetype") or "?"
            size = msg.get("media_bytes")
            size_kb = (
                f"{size // 1024} KB" if isinstance(size, (int, float)) and size else "?"
            )
            if kind == "voice":
                seconds = msg.get("media_seconds")
                dur = (
                    f"{seconds}s"
                    if isinstance(seconds, (int, float)) and seconds
                    else "?"
                )
                block.append(
                    f"🎤 Voice note ({dur}, {mime}).\n"
                    f"   Fetch: {fetch_cmd}\n"
                    f"   Transcribe: python messaging/whatsapp/transcribe.py /tmp/wa_{media_id}\n"
                    f"   Treat the transcript as the user's text."
                )
            elif kind == "image":
                block.append(
                    f"🖼 Image ({size_kb}, {mime}).\n"
                    f"   Fetch: {fetch_cmd}\n"
                    f"   Read it with the Read tool and respond about what you see."
                )
            elif kind == "pdf":
                fname = msg.get("media_filename") or f"{media_id}.pdf"
                block.append(
                    f"📄 PDF document: {fname} ({size_kb}, {mime}).\n"
                    f"   Fetch: {fetch_cmd}\n"
                    f"   Read the PDF with the Read tool and answer "
                    f"questions about its contents."
                )
            elif kind == "archive":
                fname = msg.get("media_filename") or f"{media_id}.zip"
                block.append(
                    f"🗜 Archive: {fname} ({size_kb}, {mime}).\n"
                    f"   Fetch: {fetch_cmd}\n"
                    f"   Then unzip into /tmp/wa_{media_id}_unpacked/ "
                    f"(`unzip -o /tmp/wa_{media_id} -d /tmp/wa_{media_id}_unpacked`) "
                    f"and inspect the extracted files before replying."
                )
            elif kind == "text":
                fname = msg.get("media_filename") or f"{media_id}.txt"
                block.append(
                    f"📝 Text file: {fname} ({size_kb}, {mime}).\n"
                    f"   Fetch: {fetch_cmd}\n"
                    f"   Read the file directly (it is text — `cat`, `head`, or "
                    f"open with the Read tool) and answer about its contents."
                )
            elif kind == "other":
                fname = msg.get("media_filename") or f"{media_id}.bin"
                block.append(
                    f"📎 File: {fname} ({size_kb}, {mime}).\n"
                    f"   Fetch: {fetch_cmd}\n"
                    f"   Inspect the file with an appropriate tool "
                    f"(Read, ffprobe, unzip, etc.) before replying."
                )
            else:
                fname = msg.get("media_filename") or f"{media_id}.bin"
                block.append(
                    f"📎 Unknown media kind '{kind}': {fname} ({size_kb}, {mime}).\n"
                    f"   Fetch: {fetch_cmd}\n"
                    f"   Inspect the downloaded bytes before replying."
                )

        block.append(f"Reply with: {reply_hint}")
        lines.append("\n".join(block))
    body = "\n\n".join(lines)
    recent_section = ""
    if history:
        if same_session_continuation:
            recent_section = f"{history}\n\n"
        else:
            recent_section = (
                f"This is YOUR ongoing conversation with the user (last "
                f"{MAX_MESSAGES} lines, oldest first, newest last). Every line "
                "marked 'Ninja:' is something YOU already said — even if a "
                "different internal worker produced it. Treat it ALL as your own "
                "memory and continue as ONE consistent assistant: never say 'the "
                "other session', never disown or contradict a prior Ninja reply, "
                "and don't re-ask what was already answered here. If a prior Ninja "
                "line committed to something, honour it.\n"
                f"{history}\n\n"
            )
    return (
        "You are 🥷 Ninja, the WhatsApp agent.\n\n"
        + recent_section
        + f"You have {len(pending)} message(s) to handle.\n\n"
        f"{body}\n"
    )


_NINJA_OUTBOUND_PREFIX = "🥷 Ninja"


def resolve_include_from_me(*, bound_via: Optional[str], cli_include: bool) -> bool:
    if cli_include:
        return True
    return bound_via in ("auto_group", "pairing_code")


def should_dispatch_inbound_item(
    item: dict[str, Any],
    *,
    include_from_me: bool,
    bound_via: Optional[str] = None,
) -> bool:
    from_me = bool(item.get("from_me"))
    if from_me and not include_from_me:
        return False
    text = (item.get("text") or "").strip()
    media_kind = item.get("media_kind")
    if not text and not media_kind:
        return False
    if from_me and text.startswith(_NINJA_OUTBOUND_PREFIX):
        if bound_via not in ("auto_group", "pairing_code"):
            return False
    return True


def inbound_item_to_pending(it: dict[str, Any]) -> dict[str, Any]:
    return {
        "user": it.get("user_id") or "unknown",
        "text": it.get("text") or "",
        "timestamp": it.get("ts"),
        "seq": it.get("seq"),
        "channel_id": it.get("channel_id"),
        "type": "whatsapp",
        "message_key": it.get("message_key"),
        "from_me": bool(it.get("from_me")),
        "participant": it.get("participant"),
        "sender_name": it.get("sender_name"),
        "media_kind": it.get("media_kind"),
        "media_id": it.get("media_id"),
        "media_mimetype": it.get("media_mimetype"),
        "media_seconds": it.get("media_seconds"),
        "media_bytes": it.get("media_bytes"),
        "media_filename": it.get("media_filename"),
        "quoted_message_key": it.get("quoted_message_key"),
        "quoted_text": it.get("quoted_text"),
        "quoted_sender": it.get("quoted_sender"),
    }
