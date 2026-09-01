export const missileSparkPalette = {
  whiteHeat: 0xfff6e0,
  gold: 0xffd24a,
  ember: 0xffb04a,
  flame: 0xff7a2a,
  scarlet: 0xff3b2a,
} as const;

export const missileSparkColors: readonly number[] = [
  missileSparkPalette.whiteHeat,
  missileSparkPalette.gold,
  missileSparkPalette.ember,
  missileSparkPalette.flame,
  missileSparkPalette.scarlet,
];

export const missileSparks = {
  depth: 4,
  nozzleOffsetRatio: 0.48,
  burst: {
    countMin: 14,
    countMax: 20,
    speedMin: 140,
    speedMax: 340,
    lifeMinMs: 380,
    lifeMaxMs: 820,
    radiusMin: 3,
    radiusMax: 7,
  },
  stream: {
    intervalMs: 18,
    countMin: 2,
    countMax: 4,
    spreadRad: (70 * Math.PI) / 180,
    speedMin: 110,
    speedMax: 260,
    lifeMinMs: 420,
    lifeMaxMs: 780,
    radiusMin: 2.5,
    radiusMax: 5.5,
  },
  ember: {
    intervalMs: 32,
    countMin: 1,
    countMax: 2,
    speedMin: 60,
    speedMax: 160,
    lifeMinMs: 520,
    lifeMaxMs: 980,
    radiusMin: 4,
    radiusMax: 8,
  },
} as const;
