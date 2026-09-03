export const stage2Beam = {
  textureWidth: 96,
  textureHeight: 10,
  /** Beam texture origin: fire from the nose, extend forward only. */
  originX: 0,
  originY: 0.5,
  muzzleForwardPx: 30,
  bodyColor: 0x3ecfbf,
  coreColor: 0xe8fff8,
  trailColor: 0xcf3e62,
  trailIntervalMs: 16,
  trailCountMin: 1,
  trailCountMax: 1,
  trailLifeMinMs: 80,
  trailLifeMaxMs: 140,
  trailRadiusMin: 3,
  trailRadiusMax: 6.5,
  trailSpeedMin: 18,
  trailSpeedMax: 48,
  /** Tight cone behind the beam axis so sparks do not read as wing guns. */
  trailSpreadRad: 0.12,
  /** Spawn trail slightly aft of the muzzle along the beam. */
  trailSpawnBackRatio: 0.2,
  depth: 3,
} as const;
