"""
PipedreamClient — Pipedream Connect Integration Client
======================================================

HTTP client for the integrations gateway, which routes requests to
Pipedream Connect. Accessed via LiteLLM.

The gateway acts as a proxy between Phantom and Pipedream Connect —
all tool calls and direct API requests go through it, which then
forwards them to Pipedream's infrastructure for credential resolution
and upstream API execution.

Entry points:

    get_connection_link()
        GET the Pipedream Connect OAuth connection link for the user.
        No LLM involved. Returns a short-lived OAuth connection URL.

    check_health()
        GET /ninja/integrations-gateway/health — no auth required.
        Returns the parsed JSON response from the gateway health endpoint.

    list_accounts()
        GET /ninja/integrations-gateway/accounts — list connected apps for the user.

    list_apps(q, limit)
        GET /ninja/integrations-gateway/apps — browse the Pipedream app catalog.

    list_actions(app_slug, limit)
        GET /ninja/integrations-gateway/actions — list available actions for an app.

    describe_action(action_key)
        GET /ninja/integrations-gateway/actions/describe — show action props schema.

    run_action(action_key, props)
        POST /ninja/integrations-gateway/actions/run — execute a Pipedream action.

    create_connect_token(app_slug)
        GET /ninja/integrations-gateway/connect-token — mint a short-lived Connect token.

    http_request(app_slug, method, url, ...)
        POST /ninja/integrations-gateway/http-proxy — raw authenticated request
        upstream. ``body_bytes`` + ``content_type`` send binary bodies as
        ``body_base64``.

    upload_file(app_slug, method, url, file_path, ...)
        Send a local file to any app's upload endpoint via http_request, as a
        raw body or a multipart/form-data part.

Configuration is read automatically:
    - ~/.agent_settings.json default_team_id + default_channel_id
      → x-ninja-integration-channel-id header
    - /root/.claude/settings.json (or local settings.json)
      → api_key and base_url (via clients.litellm_client.get_config)
    - /dev/shm/sandbox_metadata.json thread_id
      → x-ninja-conversation-id header (auto-populated, no override)

Usage::

    from utils.pipedream import PipedreamClient

    pdx = PipedreamClient()

    link = pdx.get_connection_link()
    print(link)

    accounts = pdx.list_accounts()
    print(accounts)
"""

from __future__ import annotations

import base64
import json
import mimetypes
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path
from typing import Any

from clients.litellm_client import get_config
from constants import (
    HEADER_NINJA_CONVERSATION_ID,
    HEADER_NINJA_EVENT_ID,
    HEADER_NINJA_SANDBOX_ID,
)
from core.metadata import load_ph_metadata, load_sandbox_metadata
from messaging import get_messaging_interface
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_CONNECTION_LINK_PATH = "/ninja/integrations-gateway/get-integ-connection-ui-link"
_HEALTH_PATH = "/ninja/integrations-gateway/health"
_HTTP_PROXY_PATH = "/ninja/integrations-gateway/http-proxy"
_ACCOUNTS_PATH = "/ninja/integrations-gateway/accounts"
_APPS_PATH = "/ninja/integrations-gateway/apps"
_RUN_ACTION_PATH = "/ninja/integrations-gateway/actions/run"
_LIST_ACTIONS_PATH = "/ninja/integrations-gateway/actions"
_DESCRIBE_ACTION_PATH = "/ninja/integrations-gateway/actions/describe"

# Largest body one proxied call carries — the gateway's proxy_max_body_bytes
# (decoded). After base64 (+33%) the router must accept ~14 MB per request.
# Bigger files go through the app's own chunked/resumable upload API.
MAX_SINGLE_UPLOAD_BYTES = 10 * 1024 * 1024


# ---------------------------------------------------------------------------
# Retry helpers
# ---------------------------------------------------------------------------

_RETRIABLE_5XX = frozenset({500, 502, 503, 504})


def _is_retriable(exc: BaseException) -> bool:
    """Retry only on transient 5xx PipedreamErrors; fail fast on 4xx."""
    return isinstance(exc, PipedreamError) and exc.status_code in _RETRIABLE_5XX


_retry = retry(
    retry=retry_if_exception(_is_retriable),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, max=4),
    reraise=True,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_unique_channel() -> str:
    """
    Derive x-ninja-integration-channel-id via the active messaging adapter.

    Delegates to the adapter's ``get_unique_channel()`` method so each
    channel type can derive a stable workspace-scoped identifier from
    its own identity fields.

    Raises ValueError if the adapter cannot resolve the identifier.
    """
    return get_messaging_interface().get_unique_channel()


def _unwrap_envelope(response: dict) -> Any:
    """Unwrap the gateway's MCP-style envelope.

    The integrations gateway wraps payloads in an MCP-style envelope::

        {"content": [{"type": "text", "text": "<json>"}], ...}

    where the inner ``text`` value is a JSON string containing the real data.
    Per MCP spec, ``content`` may contain multiple items; this helper
    concatenates all ``type: "text"`` entries before parsing.
    Flat dict responses (no ``content`` list) pass through unchanged, so this
    helper is safe to call unconditionally.
    """
    if not isinstance(response, dict):
        return response
    content = response.get("content")
    if not isinstance(content, list) or not content:
        return response
    # Collect all text blocks from the MCP content array.
    text_parts = [
        item["text"]
        for item in content
        if isinstance(item, dict) and item.get("type") == "text" and "text" in item
    ]
    if not text_parts:
        return response
    combined = "".join(text_parts)
    try:
        return json.loads(combined)
    except (TypeError, ValueError):
        return combined


def _extract_list(data: Any, key: str) -> list:
    """Return a list from *data*, which may be a bare list or a dict with *key*.

    After MCP envelope unwrapping the payload is either a list directly
    (e.g. ``[{...}, ...]``) or a dict containing the list under *key*
    (e.g. ``{"apps": [...]}``) for flat gateway responses.
    """
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get(key, [])
    return []


def _new_boundary(data: bytes) -> str:
    """A multipart boundary that does not occur anywhere in *data*."""
    while True:
        boundary = uuid.uuid4().hex
        if boundary.encode() not in data:
            return boundary


def _quote(value: str) -> str:
    """Escape a value for a Content-Disposition quoted-string."""
    return (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\r", " ")
        .replace("\n", " ")
    )


def encode_multipart_form(
    fields: dict[str, Any],
    file_field: str,
    filename: str,
    data: bytes,
    file_content_type: str = "application/octet-stream",
) -> tuple[bytes, str]:
    """
    Encode a multipart/form-data body: *fields* in order, then the file.

    Field values that are not str/bytes (dicts, lists, numbers) are sent as
    JSON. Returns ``(body, content_type)`` with the boundary in the
    content type, ready for ``http_request(body_bytes=..., content_type=...)``.
    """
    encoded: list[tuple[str, bytes]] = []
    for name, value in fields.items():
        if isinstance(value, bytes):
            payload = value
        elif isinstance(value, str):
            payload = value.encode()
        else:
            payload = json.dumps(value).encode()
        encoded.append((f'form-data; name="{_quote(name)}"', payload))
    boundary = _new_boundary(data + b"".join(p for _, p in encoded))

    out = b""
    for disposition, payload in encoded:
        out += f"--{boundary}\r\nContent-Disposition: {disposition}\r\n\r\n".encode()
        out += payload + b"\r\n"
    out += (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{_quote(file_field)}"; '
        f'filename="{_quote(filename)}"\r\n'
        f"Content-Type: {file_content_type}\r\n\r\n"
    ).encode()
    out += data + f"\r\n--{boundary}--\r\n".encode()
    return out, f"multipart/form-data; boundary={boundary}"


def _http_post(url: str, headers: dict, body: dict) -> dict:
    """
    POST JSON body to url with headers.

    Returns the parsed and unwrapped JSON response dict.
    Raises PipedreamError for HTTP 4xx/5xx responses.
    """
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return _unwrap_envelope(json.loads(resp.read()))
    except urllib.error.HTTPError as exc:
        body_text = exc.read().decode(errors="replace")
        raise PipedreamError(exc.code, body_text) from exc


@_retry
def _http_get(url: str) -> dict:
    """
    GET url with no auth headers.

    Returns the parsed and unwrapped JSON response dict.
    Raises PipedreamError for HTTP 4xx/5xx responses.

    Transient 5xx responses (500, 502, 503, 504) are retried up to 3 times
    with exponential backoff before re-raising.
    """
    try:
        with urllib.request.urlopen(url) as resp:
            return _unwrap_envelope(json.loads(resp.read()))
    except urllib.error.HTTPError as exc:
        body_text = exc.read().decode(errors="replace")
        raise PipedreamError(exc.code, body_text) from exc


@_retry
def _http_get_authed(url: str, headers: dict) -> dict:
    """
    GET url with auth headers.

    Returns the parsed and unwrapped JSON response dict.
    Raises PipedreamError for HTTP 4xx/5xx responses.

    Transient 5xx responses (500, 502, 503, 504) are retried up to 3 times
    with exponential backoff before re-raising.
    """
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return _unwrap_envelope(json.loads(resp.read()))
    except urllib.error.HTTPError as exc:
        body_text = exc.read().decode(errors="replace")
        raise PipedreamError(exc.code, body_text) from exc


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class PipedreamError(Exception):
    """Raised when the gateway returns an error response."""

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(f"HTTP {status_code}: {message}")


# ---------------------------------------------------------------------------
# PipedreamClient
# ---------------------------------------------------------------------------


class PipedreamClient:
    """
    Client for the Pipedream Connect integrations gateway via LiteLLM.
    """

    def __init__(self) -> None:
        cfg = get_config()
        self._api_key = cfg["api_key"]
        self._base_url = cfg["base_url"].rstrip("/")

    # -- internal ------------------------------------------------------------

    def _base_headers(
        self,
        *,
        event_id: str | None = None,
    ) -> dict[str, str]:
        """Build the required + optional request headers."""
        headers: dict[str, str] = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "x-ninja-integration-channel-id": _get_unique_channel(),
            "x-ninja-feature": "phantom",
        }
        thread_id = load_sandbox_metadata().get("thread_id")
        if thread_id:
            headers[HEADER_NINJA_CONVERSATION_ID] = thread_id
        sandbox_id = load_ph_metadata().get("sandbox_id")
        if sandbox_id:
            headers[HEADER_NINJA_SANDBOX_ID] = sandbox_id
        if event_id:
            headers[HEADER_NINJA_EVENT_ID] = event_id
        return headers

    # -- public API ----------------------------------------------------------

    def get_connection_link(
        self,
        *,
        event_id: str | None = None,
    ) -> str:
        """
        Get a short-lived Pipedream Connect OAuth connection link for the user.

        No LLM involved. User identity comes from the verified headers.
        The link expires after 30 minutes. Post it to the user in chat.

        Returns
        -------
        str
            The connection URL, e.g.
            "https://integrations-gateway.beta.myninja.ai/connections?..."

        Raises
        ------
        PipedreamError
            On HTTP 400 (missing x-ninja-integration-channel-id),
            403 (bad API key), or 502 (gateway down).
        ValueError
            If unique_channel cannot be resolved.
        """
        url = f"{self._base_url}{_CONNECTION_LINK_PATH}"
        headers = self._base_headers(event_id=event_id)
        response = _http_post(url, headers, body={})
        try:
            return response["link"]
        except KeyError as exc:
            raise PipedreamError(
                0,
                f"Unexpected get_connection_link response — no 'link' key: {response!r}",
            ) from exc

    def http_request(
        self,
        app_slug: str,
        method: str,
        url: str,
        *,
        json_body: dict | None = None,
        raw_body: str | None = None,
        body_bytes: bytes | None = None,
        content_type: str | None = None,
        extra_headers: dict[str, str] | None = None,
        query: dict[str, str] | None = None,
        event_id: str | None = None,
    ) -> dict:
        """
        Make a raw authenticated HTTP request through the Pipedream Connect proxy.

        The gateway uses x-ninja-integration-channel-id to resolve
        the user's Pipedream credentials for app_slug and proxies the request upstream.

        Parameters
        ----------
        app_slug:
            The integration app slug (e.g. ``"github"``, ``"gmail"``).
        method:
            HTTP method (``"GET"``, ``"POST"``, ``"PUT"``, ``"PATCH"``, ``"DELETE"``).
        url:
            Upstream URL (e.g. ``"https://api.github.com/user"``).
        json_body:
            Optional JSON-serialisable dict to send as the request body.
            Mutually exclusive with ``raw_body``.
        raw_body:
            Optional raw string body. Mutually exclusive with ``json_body``.
        body_bytes:
            Optional binary body (file uploads), sent base64-encoded as
            ``body_base64`` so the gateway forwards the exact bytes. Mutually
            exclusive with ``json_body`` / ``raw_body``; requires
            ``content_type``; at most MAX_SINGLE_UPLOAD_BYTES.
        content_type:
            Upstream Content-Type for ``body_bytes`` — the only source of it:
            a ``Content-Type`` in ``extra_headers`` is dropped. A
            ``multipart/*`` type must carry its ``boundary=``.
        extra_headers:
            Optional dict of additional headers to forward upstream.
        query:
            Optional dict of query-string parameters to append to the URL.
        event_id:
            Optional traceability header logged by the gateway.
            x-ninja-conversation-id and x-ninja-sandbox-id are auto-populated
            from sandbox metadata.

        Returns
        -------
        dict
            The full response dict from the gateway
            (expected keys: ``status``, ``headers``, ``body``).

        Raises
        ------
        PipedreamError
            On HTTP 400 (missing headers), 403 (bad API key), 502 (gateway down).
        ValueError
            If unique_channel cannot be resolved, or the body arguments are
            inconsistent (several bodies, ``body_bytes`` without
            ``content_type``, multipart without a boundary, ``body_bytes``
            over MAX_SINGLE_UPLOAD_BYTES).
        """
        if body_bytes is not None:
            if json_body is not None or raw_body is not None:
                raise ValueError(
                    "body_bytes cannot be combined with json_body or raw_body"
                )
            if len(body_bytes) > MAX_SINGLE_UPLOAD_BYTES:
                raise ValueError(
                    f"body_bytes is {len(body_bytes)} bytes; one proxied call carries "
                    f"at most {MAX_SINGLE_UPLOAD_BYTES}. Use the app's chunked/resumable "
                    "upload API and send one chunk per call."
                )
            if not content_type:
                raise ValueError("body_bytes requires content_type")
            if content_type.lower().startswith("multipart/") and (
                "boundary=" not in content_type.lower()
            ):
                raise ValueError(
                    f"multipart content_type needs a boundary: {content_type!r}"
                )
            if extra_headers:
                extra_headers = {
                    k: v
                    for k, v in extra_headers.items()
                    if k.lower() != "content-type"
                }
        endpoint = f"{self._base_url}{_HTTP_PROXY_PATH}"
        headers = self._base_headers(event_id=event_id)
        body: dict[str, Any] = {
            "app_slug": app_slug,
            "method": method.upper(),
            "url": url,
        }
        if body_bytes is not None:
            body["body_base64"] = base64.b64encode(body_bytes).decode("ascii")
            body["content_type"] = content_type
        elif json_body is not None:
            body["json"] = json_body
        elif raw_body is not None:
            body["data"] = raw_body
        if extra_headers:
            body["headers"] = extra_headers
        if query:
            body["query"] = query

        return _http_post(endpoint, headers, body)

    def upload_file(
        self,
        app_slug: str,
        method: str,
        url: str,
        file_path: str | Path,
        /,
        *,
        content_type: str | None = None,
        form_field: str | None = None,
        form_fields: dict[str, Any] | None = None,
        extra_headers: dict[str, str] | None = None,
        query: dict[str, str] | None = None,
        event_id: str | None = None,
    ) -> dict:
        """
        Send a local file to any connected app's upload endpoint.

        Provider-agnostic: the caller picks the endpoint, method, headers and
        query from the app's API docs, exactly as for ``http_request``. This
        only reads the file and shapes the body:

        - ``form_field=None`` (default): the file's bytes are the whole body
          (Dropbox ``files/upload``, Drive ``uploadType=media``, S3 presigned
          PUTs, chunks of resumable sessions, ...).
        - ``form_field="file"``: a multipart/form-data body with
          ``form_fields`` first, then the file under ``form_field``
          (Box, Slack, most "multipart upload" APIs).

        ``content_type`` is the file's MIME type (guessed from its name when
        omitted). Files over MAX_SINGLE_UPLOAD_BYTES must go through the app's
        own chunked/resumable API: one ``http_request(body_bytes=...)`` per
        chunk.

        Example::

            pdx.upload_file(
                "dropbox", "POST", "https://content.dropboxapi.com/2/files/upload",
                "report.pdf",
                extra_headers={"Dropbox-API-Arg": json.dumps({"path": "/report.pdf"})},
            )
            pdx.upload_file(
                "box", "POST", "https://upload.box.com/api/2.0/files/content",
                "report.pdf",
                form_field="file",
                form_fields={"attributes": {"name": "report.pdf", "parent": {"id": "0"}}},
            )

        Returns the gateway response dict, as for ``http_request``.

        Raises
        ------
        OSError
            The file cannot be read.
        ValueError
            As for ``http_request`` (including bodies over the size limit).
        PipedreamError
            As for ``http_request``.
        """
        local = Path(file_path).expanduser()
        data = local.read_bytes()
        mime_type = (
            content_type
            or mimetypes.guess_type(local.name)[0]
            or "application/octet-stream"
        )
        if form_field:
            body, body_type = encode_multipart_form(
                form_fields or {}, form_field, local.name, data, mime_type
            )
        else:
            body, body_type = data, mime_type
        return self.http_request(
            app_slug,
            method,
            url,
            body_bytes=body,
            content_type=body_type,
            extra_headers=extra_headers,
            query=query,
            event_id=event_id,
        )

    def list_accounts(self) -> list[dict[str, Any]]:
        """
        List connected Pipedream accounts for the user.

        Returns all integrations the user has onboarded, grouped by app slug
        on the gateway side.

        Returns
        -------
        list[dict]
            List of account dicts with keys: ``id``, ``app_slug``, ``app_name``,
            ``healthy``, ``created_at``, ``updated_at``.

        Raises
        ------
        PipedreamError
            On HTTP 4xx/5xx from the gateway.
        ValueError
            If unique_channel cannot be resolved.
        """
        url = f"{self._base_url}{_ACCOUNTS_PATH}"
        headers = self._base_headers()
        return _extract_list(_http_get_authed(url, headers), "accounts")

    def list_apps(
        self,
        *,
        q: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """
        Browse the Pipedream app catalog.

        Parameters
        ----------
        q:
            Optional search query (e.g. ``"github"``, ``"google sheets"``).
        limit:
            Maximum number of results to return (default 50).

        Returns
        -------
        list[dict]
            List of app dicts with keys: ``name_slug``, ``name``, ``description``,
            ``auth_type``, ``categories``.

        Raises
        ------
        PipedreamError
            On HTTP 4xx/5xx from the gateway.
        ValueError
            If unique_channel cannot be resolved.
        """
        params: dict[str, str] = {"limit": str(limit)}
        if q:
            params["q"] = q
        query_string = urllib.parse.urlencode(params)
        url = f"{self._base_url}{_APPS_PATH}?{query_string}"
        headers = self._base_headers()
        return _extract_list(_http_get_authed(url, headers), "apps")

    def list_actions(
        self,
        app_slug: str,
        *,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """
        List available Pipedream actions for an app.

        Fetches action metadata from the gateway, which reads the public
        PipedreamHQ/pipedream GitHub component registry.

        Parameters
        ----------
        app_slug:
            Pipedream app slug (e.g. ``"github"``, ``"gmail"``).
        limit:
            Maximum number of actions to return (default 20, max 50).

        Returns
        -------
        list[dict]
            List of action dicts with keys: ``key``, ``name``,
            ``description``, ``version``.

        Raises
        ------
        PipedreamError
            On HTTP 4xx/5xx from the gateway.
        ValueError
            If unique_channel cannot be resolved.
        """
        params: dict[str, str] = {
            "app_slug": app_slug,
            "limit": str(limit),
        }
        query_string = urllib.parse.urlencode(params)
        url = f"{self._base_url}{_LIST_ACTIONS_PATH}?{query_string}"
        headers = self._base_headers()
        return _extract_list(_http_get_authed(url, headers), "actions")

    def describe_action(
        self,
        action_key: str,
    ) -> dict[str, Any]:
        """
        Return the full schema for a specific Pipedream action.

        Fetches and parses the action's component source from the gateway,
        which reads the public PipedreamHQ/pipedream GitHub repository.

        Parameters
        ----------
        action_key:
            Pipedream component key (e.g. ``"github-create-issue"``).

        Returns
        -------
        dict
            Schema with keys: ``key``, ``name``, ``description``,
            ``version``, ``props``.

        Raises
        ------
        PipedreamError
            On HTTP 4xx/5xx from the gateway.
        ValueError
            If unique_channel cannot be resolved.
        """
        params: dict[str, str] = {"action_key": action_key}
        query_string = urllib.parse.urlencode(params)
        url = f"{self._base_url}{_DESCRIBE_ACTION_PATH}?{query_string}"
        headers = self._base_headers()
        return _http_get_authed(url, headers)

    def run_action(
        self,
        action_key: str,
        *,
        props: dict[str, Any] | None = None,
        event_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Execute a Pipedream action on behalf of the user.

        Parameters
        ----------
        action_key:
            The component key, e.g. ``"github-create-issue"``.
        props:
            Dict of prop name → value to pass to the action.
        event_id:
            Optional traceability header logged by the gateway.

        Returns
        -------
        dict
            The action run result from the gateway (key: ``result``).

        Raises
        ------
        PipedreamError
            On HTTP 4xx/5xx from the gateway.
        ValueError
            If unique_channel cannot be resolved.
        """
        url = f"{self._base_url}{_RUN_ACTION_PATH}"
        headers = self._base_headers(event_id=event_id)
        body: dict[str, Any] = {"action_key": action_key, "props": props or {}}
        return _http_post(url, headers, body)

    def check_health(self) -> dict:
        """
        GET /ninja/integrations-gateway/health — no auth required.

        Returns the parsed JSON response from the Pipedream Connect
        gateway health endpoint.
        """
        url = f"{self._base_url}{_HEALTH_PATH}"
        return _http_get(url)


# ---------------------------------------------------------------------------
# OpenAI tool-schema helpers
# ---------------------------------------------------------------------------


def _props_to_json_schema(props: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """Convert a Pipedream action props dict to a JSON Schema ``parameters`` block."""
    properties: dict[str, Any] = {}
    required: list[str] = []
    for name, p in props.items():
        entry: dict[str, Any] = {"type": p.get("type", "string")}
        if p.get("description"):
            entry["description"] = p["description"]
        elif p.get("label"):
            entry["description"] = p["label"]
        if "default" in p:
            entry["default"] = p["default"]
        if p.get("type") == "array":
            entry["items"] = {"type": "string"}
        properties[name] = entry
        if p.get("required"):
            required.append(name)
    schema: dict[str, Any] = {"type": "object", "properties": properties}
    if required:
        schema["required"] = required
    return schema


def action_to_openai_tool(schema: dict[str, Any]) -> dict[str, Any]:
    """
    Convert an action schema dict to an OpenAI function-calling tool entry.

    Parameters
    ----------
    schema:
        Full action schema as returned by ``PipedreamClient.describe_action()``.

    Returns
    -------
    dict
        OpenAI-style ``{"type": "function", "function": {...}}`` entry suitable
        for passing directly to ``tools=[...]`` in an LLM API call.
    """
    fn_name = schema["key"].replace(".", "_")[:64]
    desc = schema.get("description") or schema.get("name") or schema["key"]
    return {
        "type": "function",
        "function": {
            "name": fn_name,
            "description": desc[:1000],
            "parameters": _props_to_json_schema(schema.get("props", {})),
        },
    }
