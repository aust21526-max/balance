#!/usr/bin/env bash
# Weekly Wick one-line render.
#   ./render.sh 2026-10-31                # Saturday video 9:16: render.mp4, thumb.png, captions.srt
#   ./render.sh 2026-10-31 --wide         # same video 16:9
#   ./render.sh 2026-10-31 --card         # image card from card.json: card.png (1080x1350)
#   ./render.sh 2026-10-31 --card --wide  # card at 1600x900
# Reads/writes the shared Drive folder in $WICK_DIR (set it once in wick-studio/.env).
set -euo pipefail
cd "$(dirname "$0")"
if [ -f .env ]; then set -a; . ./.env; set +a; fi
if [ ! -d node_modules ] || [ ! -d .venv ]; then
  echo "first run: installing (./setup.sh)"; ./setup.sh
fi
exec node render.mjs "$@"
