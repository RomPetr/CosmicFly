import { WeaponIds } from './weapons';

export const starterShip = {
  id: 'starter-hull',
  acceleration: 500,
  maxSpeed: 280,
  drag: 250,
  colliderRadius: 14,
  weaponId: WeaponIds.PulseBeam,
} as const;
