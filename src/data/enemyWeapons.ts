import { SoundKeys, TextureKeys, type SoundKey, type TextureKey } from '../config/assetKeys';

export type EnemyWeaponDef = {
  readonly textureKey: TextureKey;
  readonly soundKey: SoundKey;
  readonly damage: number;
  readonly projectileSpeed: number;
  readonly lifetimeMs: number;
  readonly aimSpreadRadians: number;
  readonly poolSize: number;
  readonly scale: number;
};

export const stingDartBlaster: EnemyWeaponDef = {
  textureKey: TextureKeys.EnemyBolt,
  soundKey: SoundKeys.EnemyBlaster,
  damage: 1,
  projectileSpeed: 250,
  lifetimeMs: 3000,
  aimSpreadRadians: 0.08,
  poolSize: 24,
  scale: 1,
};
