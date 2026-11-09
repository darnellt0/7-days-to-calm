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
NAME = "portal-loop-v2"

image = cv2.imread(str(SOURCE))
if image is None:
    raise RuntimeError("Hero artwork is missing")
image = cv2.resize(image, (WIDTH, HEIGHT), interpolation=cv2.INTER_AREA)
y, x = np.mgrid[:HEIGHT, :WIDTH].astype(np.float32)
depth = np.clip((y / HEIGHT - .655) / .345, 0, 1) ** .65
ellipse_x = (x / WIDTH - .49) / .266
ellipse_y = (y / HEIGHT - .438) / .334
radius = np.sqrt(ellipse_x ** 2 + ellipse_y ** 2)
ring = np.exp(-((radius - 1) / .09) ** 2)
ring *= np.clip((.68 - y / HEIGHT) / .035, 0, 1)
angle = np.arctan2(ellipse_y, ellipse_x)
# Protect the physical portal, including its feet, while its water reflection moves.
solid_portal = np.clip((radius - .73) / .08, 0, 1) * np.clip((1.22 - radius) / .08, 0, 1)
solid_portal *= np.clip((.81 - y / HEIGHT) / .035, 0, 1)
water = depth * (1 - solid_portal)

def frame(fraction):
    phase = 2 * math.pi * (fraction % 1)
    # Local surface displacement: portal geometry and the horizon stay anchored.
    horizontal = water * (28 * np.sin(y * .085 - phase * 4) + 12 * np.sin(y * .04 + phase * 3 + x * .012) + 5 * np.sin(x * .035 - y * .025 - phase * 2))
    vertical = water * (9 * np.sin(y * .065 - phase * 4 + x * .007) + 4 * np.sin(x * .022 + phase * 3))
    result = cv2.remap(image, x + horizontal, y + vertical, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101).astype(np.float32)
    # A glass glint and ripple highlights make this more than an encoded zoom.
    glint = ring * np.clip(np.cos(angle - phase * 2), 0, 1) ** 12
    reflection_center = .49 + .075 * depth * np.sin(phase * 2 + y * .014)
    reflection = np.exp(-((x / WIDTH - reflection_center) / (.11 + .12 * depth)) ** 2) * water
    shimmer = reflection * (.5 + .5 * np.sin(y * .16 - phase * 4 + x * .012)) ** 6
    sheen = reflection * (.5 + .5 * np.cos(y * .045 - phase * 2 + x * .004))
    result += glint[..., None] * np.array([45, 38, 56], dtype=np.float32)
    result += shimmer[..., None] * np.array([22, 42, 64], dtype=np.float32)
    result += sheen[..., None] * np.array([5, 10, 17], dtype=np.float32)
    return np.clip(result, 0, 255).astype(np.uint8)

OUTPUT.mkdir(parents=True, exist_ok=True)
temporary = OUTPUT / f"{NAME}.build.mp4"
encoder = subprocess.Popen([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{WIDTH}x{HEIGHT}",
    "-r", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264",
    "-preset", "medium", "-crf", "20", "-g", "50", "-pix_fmt", "yuv420p",
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
temporary.replace(OUTPUT / f"{NAME}.mp4")

subprocess.run([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(OUTPUT / f"{NAME}.mp4"),
    "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-row-mt", "1",
    str(OUTPUT / f"{NAME}.webm"),
], check=True)

probe = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,codec_type,width,height",
    "-of", "json", str(OUTPUT / f"{NAME}.mp4"),
], capture_output=True, text=True, check=True)
assert np.array_equal(frame(0), frame(1)), "Non-periodic source motion"
print(json.dumps({"media": json.loads(probe.stdout), "periodic_source_seam": "exact",
                  "files": [{"name": path.name, "bytes": path.stat().st_size} for path in OUTPUT.glob(f"{NAME}.*")]}))
