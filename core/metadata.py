"""
core/metadata.py — Cached readers for SaaS and launch-time deployment metadata.

SaaS owns sandbox/ph metadata; launchers own runtime metadata. Results are
cached via ``config_cached`` and invalidated with ``refresh_config()``.

Usage::

    from core.metadata import load_sandbox_metadata, load_ph_metadata

    thread_id = load_sandbox_metadata().get("thread_id")
    sandbox_id = load_ph_metadata().get("sandbox_id")
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import os
import re
import sys
import tempfile
from datetime import datetime, timezone
from ipaddress import ip_address
from pathlib import Path
from urllib.parse import parse_qsl, unquote, urlsplit

from constants import (
    DEFAULT_MODEL,
    NINJA_IN_A_BOX_PROVIDER,
    PH_METADATA_DURABLE_PATH,
    PH_METADATA_PATH,
    RUNTIME_METADATA_DURABLE_PATH,
    RUNTIME_METADATA_PATH,
    SANDBOX_METADATA_DURABLE_PATH,
    SANDBOX_METADATA_PATH,
)
from core.config import config_cached, refresh_config

_logger = logging.getLogger(__name__)


def _load_with_durable_fallback(tmpfs: Path, durable: Path) -> dict:
    """Read the tmpfs copy, falling back to the durable one a restart did not wipe.

    Restores tmpfs on the fallback path: readers that open the literal path
    (dashboard, set_timezone.py) never come through here.
    """
    for path in (tmpfs, durable):
        try:
            metadata = json.loads(path.read_text())
        except (FileNotFoundError, json.JSONDecodeError, OSError):
            continue
        if path is durable:
            try:
                tmpfs.write_text(path.read_text())
            except OSError:
                pass
        return metadata
    return {}


@config_cached("sandbox_metadata")
def load_sandbox_metadata() -> dict:
    """
    Load and cache ``/dev/shm/sandbox_metadata.json``, falling back to the
    durable copy suna writes alongside it.

    Returns the full parsed dict, or ``{}`` when neither path is readable.

    Common keys: ``thread_id``, ``environment``, ``use_agent_event_cache``,
    ``litellm_selected_model``.
    """
    return _load_with_durable_fallback(
        SANDBOX_METADATA_PATH, SANDBOX_METADATA_DURABLE_PATH
    )


# A backend running locally has no service deployment of its own, so the
# "local" environment has no hostname to build from: ninja-suna-manus points a
# local backend at beta (`backend/.env.example` ships
# AGENT_EVENT_CACHE_SERVICE_URL=https://agent-event-cache.beta.myninja.ai). A
# sandbox it deploys therefore carries environment="local" and has to talk to
# the same beta services its backend does. ninja-install.sh already resolves
# the package CDN this way.
_SERVICE_ENVIRONMENT_ALIASES = {"local": "beta"}


def service_environment() -> str:
    """Environment name for building service URLs, with local backends aliased.

    Returns ``""`` when the metadata file carries no environment, so callers keep
    their own "cannot determine the URL" handling rather than guessing a stage.
    """
    environment = load_sandbox_metadata().get("environment", "").strip()
    return _SERVICE_ENVIRONMENT_ALIASES.get(environment, environment)


def is_ninja_in_a_box() -> bool:
    """Whether this phantom was deployed by ninja-in-a-box rather than SuperNinja."""
    meta = load_sandbox_metadata() or load_runtime_metadata()
    return meta.get("sandbox_provider") == NINJA_IN_A_BOX_PROVIDER


def get_selected_model() -> str:
    """Keep the existing sandbox model; use runtime metadata when sandbox context is absent."""
    meta = load_sandbox_metadata() or load_runtime_metadata()
    if not meta:
        return DEFAULT_MODEL

    model = meta.get("litellm_selected_model", "").strip()
    if model:
        return model
    return DEFAULT_MODEL


@config_cached("ph_metadata")
def load_ph_metadata() -> dict:
    """
    Load and cache ``/dev/shm/ph_metadata.json``, falling back to the durable
    copy suna writes alongside it.

    Returns the full parsed dict, or ``{}`` when neither path is readable.

    Common keys: ``posthog_host``, ``posthog_key``, ``sandbox_id``.
    """
    return _load_with_durable_fallback(PH_METADATA_PATH, PH_METADATA_DURABLE_PATH)


def _validate_runtime_metadata(document: object) -> dict:
    """Validate a complete v1 snapshot and remove secret-like top-level fields."""
    if not isinstance(document, dict) or any(not isinstance(k, str) for k in document):
        raise ValueError("runtime metadata must be a JSON object with string keys")
    result = {}
    for key, value in document.items():
        if re.search(r"(?:_token|_key|_secret)$|password", key, re.I):
            _logger.warning("Dropping secret-like runtime metadata field %r", key)
            continue
        if not isinstance(value, (str, int, float, bool, type(None))) or (
            isinstance(value, float) and not math.isfinite(value)
        ):
            raise ValueError(
                f"runtime metadata field {key!r} must be a finite JSON scalar"
            )
        result[key] = value
    if type(result.get("version")) is not int or result["version"] != 1:
        raise ValueError("runtime metadata version must be integer 1")
    written_at = result.get("written_at")
    if not isinstance(written_at, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})",
        written_at,
    ):
        raise ValueError(
            "runtime metadata written_at must be ISO8601 date-time with timezone"
        )
    try:
        datetime.fromisoformat(written_at.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(
            "runtime metadata written_at must be ISO8601 date-time with timezone"
        ) from exc
    for key in (
        "admin_owner_id",
        "sandbox_provider",
        "litellm_selected_model",
        "user_timezone",
        "workspace_id",
    ):
        if key in result and (
            not isinstance(result[key], str) or not result[key].strip()
        ):
            raise ValueError(f"runtime metadata {key} must be a nonempty string")
    if "admin_ui_url" in result:
        url = result["admin_ui_url"]
        try:
            if not isinstance(url, str) or any(
                c.isspace() or c in '<>\\"`' for c in url
            ):
                raise ValueError("invalid URL characters")
            parsed = urlsplit(url)
            if (
                parsed.scheme != "https"
                or not parsed.hostname
                or parsed.username is not None
                or parsed.password is not None
                or any(ord(c) < 32 or ord(c) == 127 for c in unquote(url))
            ):
                raise ValueError("invalid HTTPS URL")
            parsed.port
            hostname = parsed.hostname.encode("idna").decode("ascii")
            if ":" in hostname:
                ip_address(hostname)
            elif not all(
                re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?", label)
                for label in hostname.rstrip(".").split(".")
            ):
                raise ValueError("invalid HTTPS hostname")
            if any(
                re.search(
                    r"token|password|secret|credential|signature|authorization|api.?key|^(code|sig|auth|key)$",
                    key,
                    re.I,
                )
                for part in (parsed.query, parsed.fragment)
                for key, _ in parse_qsl(part, keep_blank_values=True)
            ):
                raise ValueError("credential-bearing URL")
        except (ValueError, UnicodeError) as exc:
            raise ValueError(
                "runtime metadata admin_ui_url must be a credential-free HTTPS URL"
            ) from exc
    return result


def _write_runtime_file(path: Path, text: str) -> None:
    """Atomically replace one copy; never leave a partial file or temporary file."""
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            delete=False,
        ) as stream:
            temporary = Path(stream.name)
            os.fchmod(stream.fileno(), 0o644)
            stream.write(text)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


class _RuntimeMetadataFile:
    """Validated view so the unchanged SaaS fallback helper rejects invalid v1 copies."""

    def __init__(self, path: Path):
        self.path = path

    def read_text(self) -> str:
        try:
            return json.dumps(
                _validate_runtime_metadata(json.loads(self.path.read_text()))
            )
        except (ValueError, UnicodeError) as exc:
            _logger.warning(
                "Ignoring invalid runtime metadata at %s: %s", self.path, exc
            )
            raise OSError("invalid runtime metadata") from exc

    def write_text(self, text: str) -> None:
        _write_runtime_file(self.path, text)


@config_cached("runtime_metadata")
def load_runtime_metadata() -> dict:
    """Read a validated launch snapshot, restoring durable state after tmpfs loss.

    Missing/invalid copies return {}; no environment or SaaS admin fallback.
    """
    return _load_with_durable_fallback(
        _RuntimeMetadataFile(RUNTIME_METADATA_PATH),
        _RuntimeMetadataFile(RUNTIME_METADATA_DURABLE_PATH),
    )


def write_runtime_metadata(doc: dict) -> None:
    """Replace both launch snapshots after validation, then invalidate this process's cache.

    Each rename is atomic independently, not a transaction across filesystems.
    """
    if not isinstance(doc, dict):
        raise ValueError("runtime metadata must be a JSON object")
    document = dict(doc)
    document.setdefault("version", 1)
    document.setdefault(
        "written_at", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    )
    text = json.dumps(_validate_runtime_metadata(document), allow_nan=False) + "\n"
    try:
        for path in (RUNTIME_METADATA_PATH, RUNTIME_METADATA_DURABLE_PATH):
            _write_runtime_file(path, text)
    finally:
        refresh_config("runtime_metadata")


def get_admin_ui_url() -> str:
    return load_runtime_metadata().get("admin_ui_url", "")


def get_admin_owner_id() -> str:
    return load_runtime_metadata().get("admin_owner_id", "")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Read metadata or write a launch-time runtime snapshot"
    )
    commands = parser.add_subparsers(dest="command", required=True)
    get = commands.add_parser("get")
    get.add_argument("file", choices=("runtime", "sandbox", "ph"))
    get.add_argument("key")
    commands.add_parser("write-runtime")
    args = parser.parse_args()
    try:
        if args.command == "write-runtime":
            write_runtime_metadata(json.load(sys.stdin))
        else:
            value = {
                "runtime": load_runtime_metadata,
                "sandbox": load_sandbox_metadata,
                "ph": load_ph_metadata,
            }[args.file]().get(args.key, "")
            print(value if isinstance(value, str) else json.dumps(value))
    except (ValueError, OSError) as exc:
        parser.error(str(exc))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
