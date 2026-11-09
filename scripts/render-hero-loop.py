"""Render a seamless silent cinemagraph from the project's own generated artwork.

Asset-production helper only; the deployed app needs no Python dependencies.
Requires existing numpy, opencv-python, ffmpeg and ffprobe installations.
"""
import json
import math
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "em-frontend/public/images/calm-portal.png"
OUTPUT = ROOT / "em-frontend/public/video"
WIDTH, HEIGHT, FPS, SECONDS = 960, 640, 25, 10
NAME = "portal-loop-v3"

image = cv2.imread(str(SOURCE))
if image is None:
    raise RuntimeError("Hero artwork is missing")
image = cv2.resize(image, (WIDTH, HEIGHT), interpolation=cv2.INTER_AREA)
y, x = np.mgrid[:HEIGHT, :WIDTH].astype(np.float32)
distance = np.clip((y / HEIGHT - .655) / .345, 0, 1)

def smoothstep(low, high, value):
    t = np.clip((value - low) / (high - low), 0, 1)
    return t * t * (3 - 2 * t)

depth = distance ** .65 * smoothstep(0, .10, distance)
# Trace only the two physical feet below the water boundary. A narrow feather
# protects their bright edges without holding an island of adjacent water still.
foot_mask = np.zeros((HEIGHT, WIDTH), np.uint8)
left_foot = np.array([[223,400],[235,420],[246,440],[259,460],[273,480],[282,493],[386,493],[370,480],[347,460],[328,440],[314,420],[303,400]], np.int32)
right_foot = np.array([[638,400],[626,420],[612,440],[595,460],[572,480],[557,493],[656,493],[668,480],[683,460],[694,440],[706,420],[715,400]], np.int32)
cv2.fillPoly(foot_mask, [left_foot, right_foot], 255)
foot_mask = cv2.dilate(foot_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
solid_portal = cv2.GaussianBlur(foot_mask.astype(np.float32) / 255, (5, 5), 1)
water = depth * (1 - solid_portal)

# Perspective water plane: wavelengths compress in the distance. All components
# travel; unequal directions, weights and loop harmonics avoid a shared beat.
denominator = distance + .28
world_x = (x / WIDTH - .49) / denominator
world_z = (1 - distance) / denominator
WAVES = [
    (75, 22, 5, 1.0, .35),
    (124, 40, 7, .55, 1.7),
    (-338, 84, 11, .22, 2.65),
    (590, 150, 13, .08, 4.3),
]
components = []
normal_x_scale = normal_z_scale = 0.0
for kx, kz, harmonic, weight, offset in WAVES:
    length = math.hypot(kx, kz)
    gradient_x = kx / (WIDTH * denominator)
    gradient_y = (-kx * (x / WIDTH - .49) - 1.28 * kz) / (denominator ** 2 * (.345 * HEIGHT))
    wavelength = 2 * math.pi / np.maximum(np.hypot(gradient_x, gradient_y), 1e-6)
    antialias = smoothstep(2.5, 5, wavelength)
    components.append((kx * world_x + kz * world_z + offset, harmonic, weight * kx / length * antialias, weight * kz / length * antialias))
    normal_x_scale += weight * abs(kx) / length
    normal_z_scale += weight * abs(kz) / length

def frame(fraction):
    phase = 2 * math.pi * (fraction % 1)
    # Derivatives of one height field drive both refraction and illumination.
    slope_x = np.zeros_like(x)
    slope_z = np.zeros_like(y)
    for spatial_phase, harmonic, normal_x, normal_z in components:
        cosine = np.cos(spatial_phase + phase * harmonic)
        slope_x += normal_x * cosine
        slope_z += normal_z * cosine
    slope_x /= normal_x_scale
    slope_z /= normal_z_scale
    horizontal = water * 24 * slope_x
    vertical = water * 4.5 * slope_z
    result = cv2.remap(image, x + horizontal, y + vertical, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101).astype(np.float32)
    # Fixed sun envelope; moving surface normals break its interior into facets.
    # No independent light curtain, lateral envelope sway, or orbiting glass glint.
    reflection = np.exp(-((x / WIDTH - .49) / (.035 + .16 * distance)) ** 2) * water
    facing = np.clip(.5 + .5 * slope_z - .16 * np.abs(slope_x), 0, 1)
    facets = smoothstep(.50, .86, facing) ** 1.6
    result *= (1 + water * (.10 * slope_z - .035 * np.abs(slope_x)))[..., None]
    result += (reflection * facets)[..., None] * np.array([14, 26, 42], dtype=np.float32)
    # Keep the physical glass and sky completely anchored, including their light.
    result = result * (1 - solid_portal[..., None]) + image * solid_portal[..., None]
    return np.clip(result, 0, 255).astype(np.uint8)

OUTPUT.mkdir(parents=True, exist_ok=True)
# Encode three source cycles, then keep the middle cycle. This gives the first
# and last delivered frames normal encoder context instead of start/end ramps.
# Both formats receive identical raw frames; WebM is not transcoded from MP4.
with tempfile.TemporaryDirectory(prefix="calm-water-encode-") as scratch:
    scratch = Path(scratch)
    processes = []
    common = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "pipe:0", "-an"]
    codecs = {
        "mp4": ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-g", "50", "-keyint_min", "50", "-sc_threshold", "0", "-bf", "0", "-pix_fmt", "yuv420p"],
        "webm": ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "26", "-g", "50", "-row-mt", "1", "-cpu-used", "2"],
    }
    try:
        for extension, codec in codecs.items():
            processes.append(subprocess.Popen(common + codec + [str(scratch / f"cycles.{extension}")], stdin=subprocess.PIPE, stderr=subprocess.PIPE))
        count = FPS * SECONDS
        for index in range(count * 3):
            data = frame((index % count) / count).tobytes()
            for process in processes:
                process.stdin.write(data)
            if (index + 1) % count == 0:
                print(f"Rendered source cycle {(index + 1) // count}/3", flush=True)
        for process in processes:
            process.stdin.close()
        for process in processes:
            error = process.stderr.read().decode()
            if process.wait() != 0: raise RuntimeError(error)
    except BaseException:
        for process in processes:
            if process.poll() is None: process.kill()
        raise
    for extension in codecs:
        temporary = OUTPUT / f"{NAME}.build.{extension}"
        command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(SECONDS), "-i", str(scratch / f"cycles.{extension}"), "-t", str(SECONDS), "-c", "copy", "-avoid_negative_ts", "make_zero"]
        if extension == "mp4": command += ["-movflags", "+faststart"]
        subprocess.run(command + [str(temporary)], check=True)
        temporary.replace(OUTPUT / f"{NAME}.{extension}")

probe = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,codec_type,width,height",
    "-of", "json", str(OUTPUT / f"{NAME}.mp4"),
], capture_output=True, text=True, check=True)
assert np.array_equal(frame(0), frame(1)), "Non-periodic source motion"
print(json.dumps({"media": json.loads(probe.stdout), "periodic_source_seam": "exact",
                  "files": [{"name": path.name, "bytes": path.stat().st_size} for path in OUTPUT.glob(f"{NAME}.*")]}))
