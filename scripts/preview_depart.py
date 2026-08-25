"""Renders a filmstrip of the depart phase to check station/ship separation."""

import math
import os

from PIL import Image

W, H = 960, 540

STATION_DRIFT_Y = 0.444 * H
STATION_DEPARTED_Y = 1.52 * H
STATION_DRIFT_SCALE = 0.58
STATION_DEPARTED_SCALE = 0.10

SHIP_CLEARED_Y = 0.935 * H
SHIP_SETTLED_Y = 0.5 * H
SHIP_SCALE = 0.42
LAUNCH_SCALE = SHIP_SCALE / 5

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATION_PNG = os.path.join(ROOT, "public/assets/stations/space_station.png")
SHIP_PNG = os.path.join(ROOT, "public/assets/ships/player/spaceShips_001.png")
OUT_DIR = os.path.join(ROOT, "scripts/out")

STEPS = (0.0, 0.2, 0.4, 0.6, 1.0)


def lerp(a, b, t):
    return a + (b - a) * t


def ease_quad_out(t):
    return t * (2 - t)


def ease_cubic_in(t):
    return t * t * t


def ease_sine_in_out(t):
    return 0.5 * (1 - math.cos(math.pi * t))


def paste_centered(canvas, sprite, cx, cy, scale, rotate180=False):
    w = max(1, int(round(sprite.width * scale)))
    h = max(1, int(round(sprite.height * scale)))
    img = sprite.resize((w, h), Image.LANCZOS)
    if rotate180:
        img = img.rotate(180)
    canvas.alpha_composite(img, (int(round(cx - w / 2)), int(round(cy - h / 2))))


def main():
    station = Image.open(STATION_PNG).convert("RGBA")
    ship = Image.open(SHIP_PNG).convert("RGBA")
    columns = len(STEPS)
    strip = Image.new("RGBA", (W * columns, H), (26, 39, 68, 255))

    for index, t in enumerate(STEPS):
        frame = Image.new("RGBA", (W, H), (26, 39, 68, 255))
        recede = ease_quad_out(t)
        climb = ease_cubic_in(t)
        grow = ease_sine_in_out(t)

        paste_centered(
            frame,
            station,
            W / 2,
            lerp(STATION_DRIFT_Y, STATION_DEPARTED_Y, recede),
            lerp(STATION_DRIFT_SCALE, STATION_DEPARTED_SCALE, recede),
        )
        paste_centered(
            frame,
            ship,
            W / 2,
            lerp(SHIP_CLEARED_Y, SHIP_SETTLED_Y, climb),
            lerp(LAUNCH_SCALE, SHIP_SCALE, grow),
            rotate180=True,
        )
        strip.alpha_composite(frame, (index * W, 0))

    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, "depart_strip.png")
    strip.convert("RGB").resize((W * columns // 3, H // 3), Image.LANCZOS).save(path)
    print("wrote", path)


if __name__ == "__main__":
    main()
