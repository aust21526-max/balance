#!/usr/bin/env bash
# Weekly Wick one-line render.
#   ./render.sh 2026-10-31              # video 16:9: render.mp4, thumb.png, captions.srt
#   ./render.sh 2026-10-31 --vertical   # video 9:16
#   ./render.sh 2026-10-30 --image   # weekday still: image.png
# Reads/writes the shared Drive folder in $WICK_DIR (set it once in wick-studio/.env).
set -euo pipefail
cd "$(dirname "$0")"
if [ -f .env ]; then set -a; . ./.env; set +a; fi
if [ ! -d node_modules ] || [ ! -d .venv ]; then
  echo "first run: installing (./setup.sh)"; ./setup.sh
fi
exec node render.mjs "$@"
