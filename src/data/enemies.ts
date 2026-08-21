import { TextureKeys, type TextureKey } from '../config/assetKeys';

export const EnemyIds = {
  StingDart: 'sting-dart',
} as const;

export type EnemyId = (typeof EnemyIds)[keyof typeof EnemyIds];

export type EnemyDef = {
  readonly id: EnemyId;
  readonly textureKey: TextureKey;
  readonly scale: number;
  readonly angleOffset: number;
  readonly maxHull: number;
  readonly speed: number;
  readonly colliderRadius: number;
  readonly tint: number;
  readonly preferredDistance: number;
  readonly retreatDistance: number;
  readonly approachDistance: number;
  readonly orbitStrength: number;
  readonly weaveStrength: number;
  readonly weaveFrequencyMin: number;
  readonly weaveFrequencyMax: number;
  readonly steeringLerpPerSec: number;
  readonly fireIntervalMinMs: number;
  readonly fireIntervalMaxMs: number;
};

export const stingDartEnemy: EnemyDef = {
  id: EnemyIds.StingDart,
  textureKey: TextureKeys.StingDart,
  scale: 0.34,
  angleOffset: -Math.PI / 2,
  maxHull: 3,
  speed: 160,
  colliderRadius: 12,
  tint: 0x145c38,
  preferredDistance: 180,
  retreatDistance: 100,
  approachDistance: 260,
  orbitStrength: 0.65,
  weaveStrength: 0.3,
  weaveFrequencyMin: 0.8,
  weaveFrequencyMax: 1.8,
  steeringLerpPerSec: 4,
  fireIntervalMinMs: 2000,
  fireIntervalMaxMs: 10000,
};

export const enemies: Record<EnemyId, EnemyDef> = {
  [EnemyIds.StingDart]: stingDartEnemy,
};
