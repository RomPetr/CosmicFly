"""Offline preview of the launch cutscene framing.

Renders key frames of the intro at canvas resolution so the staging (station
close-up, ship hidden in the airlock, ship clearing the silhouette) can be
checked without booting the game.
"""

import math
import os

from PIL import Image

W, H = 960, 540

HOLD_MS = 3000
LAUNCH_MS = 1000
DEPART_MS = 2600

STATION_DOCKED_Y = 0.352 * H
STATION_DEPARTED_Y = 1.52 * H
STATION_DOCKED_SCALE = 0.62
STATION_DEPARTED_SCALE = 0.10

SHIP_DOCKED_Y = 0.696 * H
SHIP_CLEARED_Y = 0.935 * H
SHIP_SETTLED_Y = 0.5 * H
SHIP_SCALE = 0.42
LAUNCH_SCALE = SHIP_SCALE / 5

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATION_PNG = os.path.join(ROOT, "public/assets/stations/space_station.png")
SHIP_PNG = os.path.join(ROOT, "public/assets/ships/player/spaceShips_001.png")
OUT_DIR = os.path.join(ROOT, "scripts/out")


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


def render(name, station_y, station_scale, ship_y, ship_scale, station_in_front, station_visible=True):
    canvas = Image.new("RGBA", (W, H), (26, 39, 68, 255))
    station = Image.open(STATION_PNG).convert("RGBA")
    ship = Image.open(SHIP_PNG).convert("RGBA")

    def draw_station():
        if station_visible:
            paste_centered(canvas, station, W / 2, station_y, station_scale)

    def draw_ship():
        # Sprite art points down; the cutscene keeps the nose up.
        paste_centered(canvas, ship, W / 2, ship_y, ship_scale, rotate180=True)

    if station_in_front:
        draw_ship()
        draw_station()
    else:
        draw_station()
        draw_ship()

    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name)
    canvas.convert("RGB").save(path)
    print("wrote", path)


def main():
    render(
        "intro_1_hold.png",
        STATION_DOCKED_Y,
        STATION_DOCKED_SCALE,
        SHIP_DOCKED_Y,
        LAUNCH_SCALE,
        station_in_front=True,
    )

    t = ease_quad_out(0.6)
    render(
        "intro_2_launch.png",
        STATION_DOCKED_Y,
        STATION_DOCKED_SCALE,
        lerp(SHIP_DOCKED_Y, SHIP_CLEARED_Y, t),
        LAUNCH_SCALE,
        station_in_front=True,
    )

    t = 0.45
    render(
        "intro_3_depart.png",
        lerp(STATION_DOCKED_Y, STATION_DEPARTED_Y, ease_cubic_in(t)),
        lerp(STATION_DOCKED_SCALE, STATION_DEPARTED_SCALE, ease_sine_in_out(t)),
        lerp(SHIP_CLEARED_Y, SHIP_SETTLED_Y, ease_sine_in_out(t)),
        lerp(LAUNCH_SCALE, SHIP_SCALE, ease_sine_in_out(t)),
        station_in_front=False,
    )

    render(
        "intro_4_ready.png",
        STATION_DEPARTED_Y,
        STATION_DEPARTED_SCALE,
        SHIP_SETTLED_Y,
        SHIP_SCALE,
        station_in_front=False,
        station_visible=False,
    )


if __name__ == "__main__":
    main()
