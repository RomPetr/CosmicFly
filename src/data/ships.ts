import { TextureKeys } from '../config/assetKeys';
import { WeaponIds } from './weapons';

export const starterShip = {
  id: 'starter-hull',
  textureKey: TextureKeys.PlayerShip,
  scale: 0.42,
  angleOffset: -Math.PI / 2,
  engineFlame: {
    textureKey: TextureKeys.EngineFlame,
    offsetPx: 24,
    scale: 0.6,
    depth: -1,
  },
  muzzleOffsetPx: 22,
  acceleration: 500,
  maxSpeed: 280,
  drag: 250,
  colliderRadius: 16,
  maxHealth: 100,
  hitIFramesMs: 450,
  pulseWeaponId: WeaponIds.PulseBeam,
  missileWeaponId: WeaponIds.FlareMissiles,
} as const;
