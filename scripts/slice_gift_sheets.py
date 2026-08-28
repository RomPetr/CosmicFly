"""Slice gift bonus strips into transparent 32x160 sprite sheets.

Source frames are 22x22 RGB on a white background. White is keyed out
(r/g/b >= 248) so mint (222,245,234) and ice-blue (230,239,249) fill stay.
Each frame is centered on a 32x32 canvas; five frames stack into one sheet.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FREE_ASSETS = ROOT / "free_assets"
OUT_DIR = ROOT / "public" / "assets" / "pickups"

CANVAS = 32
ICON = 22
FRAME_COUNT = 5
CHROMA_MIN = 248

HP_ORIGINS = ((2, 2), (2, 34), (2, 66), (2, 98), (2, 130))
SHIELD_ORIGINS = ((2, 3), (2, 35), (2, 67), (2, 99), (2, 131))

JOBS = (
    ("hp_bonus.png", HP_ORIGINS, "hp_bonus_sheet.png"),
    ("shield_bonus.png", SHIELD_ORIGINS, "shield_bonus_sheet.png"),
)


def find_shoot_dir() -> Path:
    if not FREE_ASSETS.is_dir():
        raise FileNotFoundError(f"Missing {FREE_ASSETS}")

    for child in FREE_ASSETS.iterdir():
        if child.is_dir() and child.name.startswith("Shoot"):
            return child

    raise FileNotFoundError(f"No Shoot* directory under {FREE_ASSETS}")


def key_white(icon: Image.Image) -> Image.Image:
    rgba = icon.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            red, green, blue, _alpha = pixels[x, y]
            if red >= CHROMA_MIN and green >= CHROMA_MIN and blue >= CHROMA_MIN:
                pixels[x, y] = (red, green, blue, 0)
    return rgba


def slice_frame(source: Image.Image, origin_x: int, origin_y: int) -> Image.Image:
    crop = source.crop((origin_x, origin_y, origin_x + ICON, origin_y + ICON))
    keyed = key_white(crop)
    frame = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    pad = (CANVAS - ICON) // 2
    frame.paste(keyed, (pad, pad), keyed)
    return frame


def build_sheet(source: Image.Image, origins: tuple[tuple[int, int], ...]) -> Image.Image:
    sheet = Image.new("RGBA", (CANVAS, CANVAS * FRAME_COUNT), (0, 0, 0, 0))
    for index, (origin_x, origin_y) in enumerate(origins):
        frame = slice_frame(source, origin_x, origin_y)
        sheet.paste(frame, (0, index * CANVAS), frame)
    return sheet


def verify_sheet(sheet: Image.Image, name: str) -> None:
    if sheet.size != (CANVAS, CANVAS * FRAME_COUNT):
        raise RuntimeError(f"{name} size {sheet.size}, expected {(CANVAS, CANVAS * FRAME_COUNT)}")
    if sheet.mode != "RGBA":
        raise RuntimeError(f"{name} mode {sheet.mode}, expected RGBA")

    pixels = sheet.load()
    for index in range(FRAME_COUNT):
        top = index * CANVAS
        opaque = 0
        for y in range(top, top + CANVAS):
            for x in range(CANVAS):
                if pixels[x, y][3] > 0:
                    opaque += 1
        if opaque == 0:
            raise RuntimeError(f"{name} frame {index} has no opaque pixels")

        corners = (
            (0, top),
            (CANVAS - 1, top),
            (0, top + CANVAS - 1),
            (CANVAS - 1, top + CANVAS - 1),
        )
        for corner_x, corner_y in corners:
            if pixels[corner_x, corner_y][3] != 0:
                raise RuntimeError(
                    f"{name} frame {index} corner ({corner_x},{corner_y}) is not transparent"
                )

    print(f"OK {name}: {sheet.size} {sheet.mode}")


def main() -> None:
    shoot_dir = find_shoot_dir()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for source_name, origins, out_name in JOBS:
        source_path = shoot_dir / source_name
        if not source_path.is_file():
            raise FileNotFoundError(source_path)

        source = Image.open(source_path)
        sheet = build_sheet(source, origins)
        verify_sheet(sheet, out_name)
        out_path = OUT_DIR / out_name
        sheet.save(out_path, "PNG")
        print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
