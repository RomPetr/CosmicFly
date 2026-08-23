import { SoundKeys, TextureKeys, type SoundKey, type TextureKey } from '../config/assetKeys';

export const EnemyWeaponIds = {
  StingDartBlaster: 'sting-dart-blaster',
  MiddleEnemyBlaster: 'middle-enemy-blaster',
} as const;

export type EnemyWeaponId = (typeof EnemyWeaponIds)[keyof typeof EnemyWeaponIds];

export type MuzzleOffset = {
  readonly forward: number;
  readonly lateral: number;
};

export type EnemyWeaponDef = {
  readonly id: EnemyWeaponId;
  readonly textureKey: TextureKey;
  readonly soundKey: SoundKey;
  /** Player health percentage points removed per hit. */
  readonly damage: number;
  readonly projectileSpeed: number;
  readonly lifetimeMs: number;
  readonly aimSpreadRadians: number;
  readonly poolSize: number;
  readonly scale: number;
  readonly rotationJitterAmplitude: number;
  readonly muzzleOffsets: readonly MuzzleOffset[];
};

export const stingDartBlaster: EnemyWeaponDef = {
  id: EnemyWeaponIds.StingDartBlaster,
  textureKey: TextureKeys.EnemyBolt,
  soundKey: SoundKeys.EnemyBlaster,
  damage: 1,
  projectileSpeed: 250,
  lifetimeMs: 3000,
  aimSpreadRadians: 0.08,
  poolSize: 24,
  scale: 1,
  rotationJitterAmplitude: 0.07,
  muzzleOffsets: [{ forward: 0, lateral: 0 }],
};

export const middleEnemyBlaster: EnemyWeaponDef = {
  id: EnemyWeaponIds.MiddleEnemyBlaster,
  textureKey: TextureKeys.EnemyBolt,
  soundKey: SoundKeys.MiddleEnemyBlaster,
  damage: 3,
  projectileSpeed: 230,
  lifetimeMs: 3000,
  aimSpreadRadians: 0.06,
  poolSize: 8,
  scale: 1.65,
  rotationJitterAmplitude: 0.15,
  muzzleOffsets: [
    { forward: 20, lateral: -14 },
    { forward: 20, lateral: 14 },
  ],
};

export const enemyWeapons: Record<EnemyWeaponId, EnemyWeaponDef> = {
  [EnemyWeaponIds.StingDartBlaster]: stingDartBlaster,
  [EnemyWeaponIds.MiddleEnemyBlaster]: middleEnemyBlaster,
};
