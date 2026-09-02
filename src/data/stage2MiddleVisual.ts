export const stage2MiddlePalette = {
  hull: 0x2ec4b6,
  shade: 0x145a62,
  white: 0xeef7ff,
  outline: 0x0a2a30,
  whiteLuminance: 0.82,
  shadeLuminance: 0.16,
} as const;

export function luminance01(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function remapStage2Pixel(
  r: number,
  g: number,
  b: number,
  a: number,
): readonly [number, number, number, number] {
  if (a === 0) {
    return [0, 0, 0, 0];
  }

  const luma = luminance01(r, g, b);
  if (luma >= stage2MiddlePalette.whiteLuminance) {
    return unpackRgb(stage2MiddlePalette.white, a);
  }

  if (luma <= stage2MiddlePalette.shadeLuminance) {
    return unpackRgb(stage2MiddlePalette.shade, a);
  }

  const span = stage2MiddlePalette.whiteLuminance - stage2MiddlePalette.shadeLuminance;
  const t = (luma - stage2MiddlePalette.shadeLuminance) / span;
  return [
    lerpByte(channel(stage2MiddlePalette.shade, 16), channel(stage2MiddlePalette.hull, 16), t),
    lerpByte(channel(stage2MiddlePalette.shade, 8), channel(stage2MiddlePalette.hull, 8), t),
    lerpByte(channel(stage2MiddlePalette.shade, 0), channel(stage2MiddlePalette.hull, 0), t),
    a,
  ];
}

function unpackRgb(color: number, a: number): readonly [number, number, number, number] {
  return [channel(color, 16), channel(color, 8), channel(color, 0), a];
}

function channel(color: number, shift: number): number {
  return (color >> shift) & 0xff;
}

function lerpByte(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t);
}
