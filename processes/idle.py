"""
Idle predicate for the monitor poll loop — measurement, and a gated idle-stop.

Five signals; **any one true means the box is awake**. All five false means
idle:

1. pending (unread) messages
2. a turn ran, or the box is cost-blocked
3. the orchestrator unit is running
4. open (actionable) GitHub issues
5. any scheduled work: an *enabled* cron job, or a systemd **user** timer
   installed by a skill or tool

``/idle-stop`` is sent per tick once idle for ``IDLE_THRESHOLD_SECONDS``

Import direction is one-way: ``processes/common.py`` imports this module, never
the reverse. ``read_work_state()`` deliberately lives in ``common.py`` so the
``gh``/``systemctl`` calls stay patchable at ``processes.common.*``.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from clients.posthog_client import is_feature_enabled
from constants import IDLE_STOP_FEATURE_FLAG, MONITOR_SERVICE_NAME
from core.logging import get_logger
from services.cron_service import load_crons

logger = get_logger(MONITOR_SERVICE_NAME)

# /workspace/logs survives the VM cycle; /tmp does not.
IDLE_SINCE_FILE = Path("/workspace/logs/idle_since")
# Seconds of continuous idle before /idle-stop is sent.
IDLE_THRESHOLD_SECONDS = int(os.environ.get("IDLE_THRESHOLD_SECONDS", "3600"))


@dataclass(frozen=True)
class WorkState:
    """One tick's reading of the orchestrator work queue.

    Read once and shared: ``count_open_issues()`` shells out to ``gh issue
    list``, so computing it separately for the launch decision and the idle
    verdict would double a GitHub API call every 60s on every box.

    ``open_issues`` is 0 when ``gh`` fails, so a broken token reads as an empty
    queue — idle-eligible. Accepted: the launch decision already treats it so.
    """

    orchestrator_enabled: bool
    orchestrator_running: bool
    open_issues: int


@dataclass(frozen=True)
class IdleVerdict:
    idle: bool
    has_pending_messages: bool
    cost_blocked: bool
    # None, not False, when the cost-blocked tick never read the work state.
    orchestrator_running: Optional[bool]
    open_issues: Optional[int]
    has_enabled_cron: bool
    has_enabled_timer: bool


# ---------------------------------------------------------------------------
# Signals
# ---------------------------------------------------------------------------


def has_enabled_cron() -> bool:
    """True if any cron job is enabled.

    Any enabled job means never idle, however distant its next run — hence
    ``load_crons()`` rather than ``get_due_cron_messages()``.
    """
    return any(job.get("enabled", True) for job in load_crons())


def has_enabled_timer() -> bool:
    """True if this box has any systemd **user** timer — cron type 2.

    Skills install these directly and phantom does not track them. ``--user``
    excludes phantom's own system timers, which would pin the fleet awake;
    ``--all`` keeps timers whose next elapse reads ``n/a``.
    """
    if not shutil.which("systemctl"):
        return False
    try:
        result = subprocess.run(
            [
                "systemctl",
                "--user",
                "list-timers",
                "--all",
                "--no-legend",
                "--no-pager",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (OSError, subprocess.SubprocessError):
        return False
    if result.returncode != 0:
        return False
    return bool(result.stdout.strip())


# ---------------------------------------------------------------------------
# Predicate
# ---------------------------------------------------------------------------


def evaluate_idle(
    *,
    has_pending: bool,
    cost_blocked: bool,
    work: Optional[WorkState],
    enabled_cron: bool,
    enabled_timer: bool,
) -> IdleVerdict:
    """Decide whether this tick is idle.

    ``work`` is None on a cost-blocked tick, which the poll loop never reads.
    That absence adds no wakefulness — a cost-limited box cannot work — and
    stays None rather than flattening into "not running / no issues".
    """
    awake = has_pending or enabled_cron or enabled_timer
    if work is not None:
        awake = awake or work.orchestrator_running or work.open_issues > 0

    return IdleVerdict(
        idle=not awake,
        has_pending_messages=has_pending,
        cost_blocked=cost_blocked,
        orchestrator_running=None if work is None else work.orchestrator_running,
        open_issues=None if work is None else work.open_issues,
        has_enabled_cron=enabled_cron,
        has_enabled_timer=enabled_timer,
    )


# ---------------------------------------------------------------------------
# Action path (kill-switched, default off)
# ---------------------------------------------------------------------------


def is_idle_stop_enabled() -> bool:
    """True if the idle-stop action is switched on for this box.

    A PostHog flag, not sandbox metadata: the off path has to be immediate and
    fleet-wide. Fails closed on a missing key, unresolvable identity or a
    transport failure.
    """
    return is_feature_enabled(IDLE_STOP_FEATURE_FLAG, default=False)


def idle_seconds(idle: bool, now: int) -> int:
    """Seconds of continuous idle; 0 on any failure (errs toward not stopping)."""
    try:
        if not idle:
            IDLE_SINCE_FILE.unlink(missing_ok=True)
            return 0
        try:
            return now - int(IDLE_SINCE_FILE.read_text().strip())
        except (FileNotFoundError, ValueError):
            IDLE_SINCE_FILE.parent.mkdir(parents=True, exist_ok=True)
            IDLE_SINCE_FILE.write_text(str(now))
            return 0
    except OSError:
        logger.warning("idle_since update failed", exc_info=True)
        return 0


def idle_stop(
    channel_id: Optional[str],
    workspace_id: Optional[str],
    thread_id: Optional[str],
) -> None:
    """Ask ASC to stop this box."""
    from clients.agent_event_cache_client import AgentEventCacheClient

    missing = [
        name
        for name, value in (
            ("channel_id", channel_id),
            ("workspace_id", workspace_id),
            ("thread_id", thread_id),
        )
        if not value
    ]
    if missing:
        # ASC rejects nulls, and this runs at tick rate: skip, don't 422 in a loop.
        logger.warning(
            f"Skipping idle report: missing {', '.join(missing)}. Idle-stop "
            "stays disabled on this box until they are set."
        )
        return

    try:
        AgentEventCacheClient().idle_stop(channel_id, workspace_id, thread_id)
        logger.info("Sent idle-stop")
    except Exception:
        logger.warning("idle-stop request failed", exc_info=True)


def run_idle_check(
    *,
    has_pending: bool,
    cost_blocked: bool,
    work: Optional[WorkState],
    channel_id: Optional[str],
    workspace_id: Optional[str],
    thread_id: Optional[str],
) -> IdleVerdict:
    """Evaluate idle; send idle-stop once past the threshold."""
    verdict = evaluate_idle(
        has_pending=has_pending,
        cost_blocked=cost_blocked,
        work=work,
        enabled_cron=has_enabled_cron(),
        enabled_timer=has_enabled_timer(),
    )
    if (
        idle_seconds(verdict.idle, int(time.time())) >= IDLE_THRESHOLD_SECONDS
        and is_idle_stop_enabled()
    ):
        idle_stop(channel_id, workspace_id, thread_id)
    return verdict
