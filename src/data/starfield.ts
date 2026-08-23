export const starPalette = [
  0xf2f6ff,
  0x9ad2ff,
  0x76e6d2,
  0xffe6a3,
  0xffc07a,
  0xe0a6ff,
] as const;

export type StarLayerConfig = {
  readonly textureSize: number;
  readonly starCount: number;
  readonly maxRadius: number;
  readonly minRadiusRatio: number;
  readonly maxAlpha: number;
  readonly minAlphaRatio: number;
};

export type TwinkleStarConfig = {
  readonly count: number;
  readonly textureSize: number;
  readonly depth: number;
  readonly glowRings: number;
  readonly glowCoreAlpha: number;
  readonly glowEdgeAlpha: number;
  readonly minParallax: number;
  readonly maxParallax: number;
  readonly minScale: number;
  readonly maxScale: number;
  readonly scaleAmplitude: number;
  readonly minAlpha: number;
  readonly maxAlpha: number;
  readonly minAlphaAmplitude: number;
  readonly maxAlphaAmplitude: number;
  readonly minSpeedRadPerSec: number;
  readonly maxSpeedRadPerSec: number;
  readonly wrapMarginPx: number;
};

export const starfieldConfig = {
  palette: starPalette,
  farLayer: {
    textureSize: 256,
    starCount: 52,
    maxRadius: 1.1,
    minRadiusRatio: 0.45,
    maxAlpha: 0.5,
    minAlphaRatio: 0.4,
  } satisfies StarLayerConfig,
  nearLayer: {
    textureSize: 256,
    starCount: 20,
    maxRadius: 1.7,
    minRadiusRatio: 0.55,
    maxAlpha: 0.92,
    minAlphaRatio: 0.5,
  } satisfies StarLayerConfig,
  twinkle: {
    count: 48,
    textureSize: 16,
    depth: -18,
    glowRings: 6,
    glowCoreAlpha: 0.9,
    glowEdgeAlpha: 0.12,
    minParallax: 0.7,
    maxParallax: 1.35,
    minScale: 0.35,
    maxScale: 0.85,
    scaleAmplitude: 0.18,
    minAlpha: 0.42,
    maxAlpha: 0.68,
    minAlphaAmplitude: 0.16,
    maxAlphaAmplitude: 0.3,
    minSpeedRadPerSec: 0.7,
    maxSpeedRadPerSec: 2.6,
    wrapMarginPx: 12,
  } satisfies TwinkleStarConfig,
} as const;
