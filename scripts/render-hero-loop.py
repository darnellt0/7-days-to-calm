"""Render a seamless silent cinemagraph from the project's own generated artwork.

Asset-production helper only; the deployed app needs no Python dependencies.
Requires existing numpy, opencv-python, ffmpeg and ffprobe installations.
"""
import json
import math
import subprocess
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "em-frontend/public/images/calm-portal.png"
OUTPUT = ROOT / "em-frontend/public/video"
WIDTH, HEIGHT, FPS, SECONDS = 960, 640, 25, 10

image = cv2.imread(str(SOURCE))
if image is None:
    raise RuntimeError("Hero artwork is missing")
image = cv2.resize(image, (WIDTH, HEIGHT), interpolation=cv2.INTER_AREA)
y, x = np.mgrid[:HEIGHT, :WIDTH].astype(np.float32)
depth = np.clip((y / HEIGHT - .655) / .345, 0, 1) ** .9
ellipse_x = (x / WIDTH - .49) / .266
ellipse_y = (y / HEIGHT - .438) / .334
ring = np.exp(-((np.sqrt(ellipse_x ** 2 + ellipse_y ** 2) - 1) / .09) ** 2)
ring *= np.clip((.68 - y / HEIGHT) / .035, 0, 1)
angle = np.arctan2(ellipse_y, ellipse_x)
reflection = np.exp(-((x / WIDTH - .49) / .18) ** 2) * depth

def frame(fraction):
    phase = 2 * math.pi * (fraction % 1)
    # Local surface displacement: portal geometry and the horizon stay anchored.
    horizontal = depth * (10 * np.sin(y * .14 - phase * 3) + 5 * np.sin(y * .055 + phase * 2 + x * .008))
    vertical = depth * (4 * np.sin(y * .12 - phase * 3 + x * .006) + 2 * np.sin(x * .025 + phase * 2))
    result = cv2.remap(image, x + horizontal, y + vertical, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101).astype(np.float32)
    # A glass glint and ripple highlights make this more than an encoded zoom.
    glint = ring * np.clip(np.cos(angle - phase), 0, 1) ** 16
    shimmer = reflection * (.5 + .5 * np.sin(y * .2 - phase * 3 + x * .009)) ** 10
    result += glint[..., None] * np.array([24, 20, 28], dtype=np.float32)
    result += shimmer[..., None] * np.array([6, 12, 20], dtype=np.float32)
    return np.clip(result, 0, 255).astype(np.uint8)

OUTPUT.mkdir(parents=True, exist_ok=True)
temporary = OUTPUT / "portal-loop.build.mp4"
encoder = subprocess.Popen([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{WIDTH}x{HEIGHT}",
    "-r", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264",
    "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", str(temporary),
], stdin=subprocess.PIPE, stderr=subprocess.PIPE)
try:
    for index in range(FPS * SECONDS):
        encoder.stdin.write(frame(index / (FPS * SECONDS)).tobytes())
    encoder.stdin.close()
    error = encoder.stderr.read().decode()
    if encoder.wait() != 0:
        raise RuntimeError(error)
except BaseException:
    encoder.kill()
    raise
temporary.replace(OUTPUT / "portal-loop.mp4")

subprocess.run([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(OUTPUT / "portal-loop.mp4"),
    "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "34", "-row-mt", "1",
    str(OUTPUT / "portal-loop.webm"),
], check=True)

probe = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,codec_type,width,height",
    "-of", "json", str(OUTPUT / "portal-loop.mp4"),
], capture_output=True, text=True, check=True)
assert np.array_equal(frame(0), frame(1)), "Non-periodic source motion"
print(json.dumps({"media": json.loads(probe.stdout), "periodic_source_seam": "exact",
                  "files": [{"name": path.name, "bytes": path.stat().st_size} for path in OUTPUT.glob("portal-loop.*")]}))
