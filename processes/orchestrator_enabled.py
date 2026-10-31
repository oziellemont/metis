#!/usr/bin/env python3
"""ExecCondition for ninja.service: exit 0 when the orchestrator is enabled.

Dependency-free on purpose: this runs on every start, so an import error here
would wedge the orchestrator shut.
"""

import json
import sys
from pathlib import Path

CONFIG_PATH = Path("/root/.orchestrator_config.json")


def is_enabled() -> bool:
    """Default to enabled — a missing or unreadable config must not block work."""
    try:
        data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return True
    if not isinstance(data, dict):
        return True
    return bool(data.get("enabled", True))


if __name__ == "__main__":
    if is_enabled():
        sys.exit(0)
    print("orchestrator disabled by the user — not starting", flush=True)
    sys.exit(1)
