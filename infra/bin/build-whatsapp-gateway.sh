#!/usr/bin/env bash
# build-whatsapp-gateway.sh — npm ci + tsc for messaging/whatsapp/gateway.
# Used by install/whatsapp.sh and ninja-upgrade.sh. Exits 0 if no package.json.

set -euo pipefail

GATEWAY_DIR="${GATEWAY_DIR:-${NINJA_HOME:-/workspace/ninja}/messaging/whatsapp/gateway}"

if [[ ! -f "$GATEWAY_DIR/package.json" ]]; then
    exit 0
fi

cd "$GATEWAY_DIR"
npm ci --silent || npm install --silent
npm run build --silent
