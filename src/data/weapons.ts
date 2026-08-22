import { SoundKeys, TextureKeys, type SoundKey, type TextureKey } from '../config/assetKeys';

export const WeaponIds = {
  PulseBeam: 'pulse-beam',
  FlareMissiles: 'flare-missiles',
} as const;

export type WeaponId = (typeof WeaponIds)[keyof typeof WeaponIds];

export type PlayerProjectileDamage = {
  readonly sourceId: WeaponId;
  readonly baseDamage: number;
};

export type WeaponDef = {
  readonly id: WeaponId;
  readonly textureKey: TextureKey;
  readonly soundKey: SoundKey;
  readonly intervalMs: number;
  readonly projectileSpeed: number;
  readonly damage: PlayerProjectileDamage;
  readonly lifetimeMs: number;
  readonly projectileCount: number;
  readonly scale: number;
  readonly angleOffset: number;
};

export const pulseBeamWeapon: WeaponDef = {
  id: WeaponIds.PulseBeam,
  textureKey: TextureKeys.PulseBolt,
  soundKey: SoundKeys.BlasterShoot,
  intervalMs: 140,
  projectileSpeed: 560,
  damage: {
    sourceId: WeaponIds.PulseBeam,
    baseDamage: 1,
  },
  lifetimeMs: 900,
  projectileCount: 1,
  scale: 1,
  angleOffset: 0,
};

export const flareMissilesWeapon: WeaponDef = {
  id: WeaponIds.FlareMissiles,
  textureKey: TextureKeys.FlareMissile,
  soundKey: SoundKeys.RocketLaunch,
  intervalMs: 450,
  projectileSpeed: 380,
  damage: {
    sourceId: WeaponIds.FlareMissiles,
    baseDamage: 3,
  },
  lifetimeMs: 1400,
  projectileCount: 1,
  scale: 0.95,
  angleOffset: Math.PI / 2,
};

export const weapons: Record<WeaponId, WeaponDef> = {
  [WeaponIds.PulseBeam]: pulseBeamWeapon,
  [WeaponIds.FlareMissiles]: flareMissilesWeapon,
};
