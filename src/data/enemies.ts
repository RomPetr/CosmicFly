import { TextureKeys, type TextureKey } from '../config/assetKeys';
import { EnemyWeaponIds, type EnemyWeaponId } from './enemyWeapons';
import { WeaponIds, type WeaponId } from './weapons';

export const EnemyIds = {
  StingDart: 'sting-dart',
  MiddleEnemy: 'middle-enemy',
} as const;

export type EnemyId = (typeof EnemyIds)[keyof typeof EnemyIds];

export type EnemyDef = {
  readonly id: EnemyId;
  readonly textureKey: TextureKey;
  readonly weaponId: EnemyWeaponId;
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
  readonly incomingDamageMultipliers: Readonly<Record<WeaponId, number>>;
  readonly spawn: {
    readonly maxAlive: number;
    readonly respawnDelayMs: number;
    readonly minDistanceKm: number;
  };
};

export const stingDartEnemy: EnemyDef = {
  id: EnemyIds.StingDart,
  textureKey: TextureKeys.StingDart,
  weaponId: EnemyWeaponIds.StingDartBlaster,
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
  incomingDamageMultipliers: {
    [WeaponIds.PulseBeam]: 1,
    [WeaponIds.FlareMissiles]: 1,
  },
  spawn: {
    maxAlive: 3,
    respawnDelayMs: 1500,
    minDistanceKm: 0,
  },
};

export const middleEnemy: EnemyDef = {
  id: EnemyIds.MiddleEnemy,
  textureKey: TextureKeys.MiddleEnemy,
  weaponId: EnemyWeaponIds.MiddleEnemyBlaster,
  scale: 0.42,
  angleOffset: -Math.PI / 2,
  maxHull: 3,
  speed: 120,
  colliderRadius: 16,
  tint: 0x754a8f,
  preferredDistance: 220,
  retreatDistance: 130,
  approachDistance: 300,
  orbitStrength: 0.45,
  weaveStrength: 0.18,
  weaveFrequencyMin: 0.55,
  weaveFrequencyMax: 1.1,
  steeringLerpPerSec: 2.5,
  fireIntervalMinMs: 2000,
  fireIntervalMaxMs: 10000,
  incomingDamageMultipliers: {
    [WeaponIds.PulseBeam]: 1,
    [WeaponIds.FlareMissiles]: 0.5,
  },
  spawn: {
    maxAlive: 1,
    respawnDelayMs: 20000,
    minDistanceKm: 25,
  },
};

export const enemies: Record<EnemyId, EnemyDef> = {
  [EnemyIds.StingDart]: stingDartEnemy,
  [EnemyIds.MiddleEnemy]: middleEnemy,
};
