#!/usr/bin/env bash
# One-time setup: Node deps, Python venv for Kokoro TTS, voice model files.
# Needs: Node 18+, Python 3.10+, ffmpeg on PATH.
set -euo pipefail
cd "$(dirname "$0")"
for bin in node ffmpeg; do command -v "$bin" >/dev/null || { echo "missing: $bin"; exit 1; }; done
PY=$(command -v python3 || command -v python)
npm install --no-audit --no-fund
if [ ! -d .venv ]; then "$PY" -m venv .venv; fi
if [ -x .venv/bin/python ]; then VPY=.venv/bin/python; else VPY=.venv/Scripts/python.exe; fi
"$VPY" -m pip install --quiet kokoro-onnx soundfile
mkdir -p .cache/tts
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.int8.onnx voices-v1.0.bin; do
  [ -f ".cache/tts/$f" ] || curl -L --fail -o ".cache/tts/$f" "$BASE/$f"
done
[ -f .env ] || printf '# Path to the Google Drive "wick" folder\nWICK_DIR="G:/My Drive/wick"\n' > .env
echo "setup done. Edit wick-studio/.env so WICK_DIR points at your Drive wick folder."
