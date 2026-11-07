"""Kokoro TTS for Weekly Wick (temporary voice, Apache-2.0 model).

Usage: python -I kokoro_tts.py <jobs.json>
jobs.json = {"model": ..., "voices": ..., "voice": "am_puck", "speed": 1.0,
             "items": [{"text": "...", "out": "path.wav"}, ...]}
Writes 16-bit mono WAV files at 24 kHz.
"""
import json
import sys

import soundfile as sf
from kokoro_onnx import Kokoro


def main(path):
    with open(path, encoding="utf-8") as f:
        job = json.load(f)
    tts = Kokoro(job["model"], job["voices"])
    for item in job["items"]:
        audio, sr = tts.create(item["text"], voice=job["voice"], speed=job.get("speed", 1.0), lang="en-us")
        sf.write(item["out"], audio, sr, subtype="PCM_16")
        print(f"{item['out']} {len(audio) / sr:.2f}s", flush=True)


if __name__ == "__main__":
    main(sys.argv[1])
