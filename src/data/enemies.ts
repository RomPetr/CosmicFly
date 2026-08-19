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
};

export const enemies: Record<EnemyId, EnemyDef> = {
  [EnemyIds.StingDart]: stingDartEnemy,
};
