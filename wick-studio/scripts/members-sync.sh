#!/usr/bin/env bash
# After each auto-render, publish new packets and member notes to the members app.
# Set MEMBERS_DIR in wick-studio/.env to the weekly-wick-members clone; without it this does nothing.
# Optional, same file: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID turn on the members Telegram updates.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env ]; then set -a; . ./.env; set +a; fi
if [ -z "${MEMBERS_DIR:-}" ]; then exit 0; fi
if [ ! -x "$MEMBERS_DIR/scripts/publish-data.sh" ]; then
  echo "members: no publish-data.sh in MEMBERS_DIR=$MEMBERS_DIR"
  exit 1
fi
export WICK_DIR
"$MEMBERS_DIR/scripts/publish-data.sh"
