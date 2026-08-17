export const WeaponIds = {
  PulseBeam: 'pulse-beam',
} as const;

export type WeaponId = (typeof WeaponIds)[keyof typeof WeaponIds];

export type WeaponDef = {
  readonly id: WeaponId;
  readonly intervalMs: number;
  readonly projectileSpeed: number;
  readonly damage: number;
  readonly lifetimeMs: number;
  readonly projectileCount: number;
};

export const pulseBeamWeapon: WeaponDef = {
  id: WeaponIds.PulseBeam,
  intervalMs: 140,
  projectileSpeed: 560,
  damage: 1,
  lifetimeMs: 900,
  projectileCount: 1,
};

export const weapons: Record<WeaponId, WeaponDef> = {
  [WeaponIds.PulseBeam]: pulseBeamWeapon,
};
