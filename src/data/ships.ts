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
  reverseFlame: {
    textureKey: TextureKeys.EngineFlame,
    offsetPx: 18,
    spreadPx: 10,
    scale: 0.32,
    splayRad: 0.46,
    depth: -1,
  },
  blink: {
    lengthMultiplier: 5,
    cooldownMs: 480,
    iFramesMs: 160,
    minTravelPx: 8,
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
