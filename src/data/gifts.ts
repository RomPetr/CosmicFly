import {
  AnimationKeys,
  TextureKeys,
  type AnimationKey,
  type TextureKey,
} from '../config/assetKeys';
import { EnemyIds } from './enemies';

export const GiftIds = {
  Health: 'gift-health',
  Shield: 'gift-shield',
} as const;

export type GiftId = (typeof GiftIds)[keyof typeof GiftIds];

export type GiftKindDef = {
  readonly id: GiftId;
  readonly textureKey: TextureKey;
  readonly animationKey: AnimationKey;
};

export const giftDrop = {
  sourceEnemyId: EnemyIds.StingDart,
  killThresholdMin: 15,
  killThresholdMax: 20,
  poolSize: 4,
} as const;

export const giftHealth = {
  id: GiftIds.Health,
  textureKey: TextureKeys.GiftHealth,
  animationKey: AnimationKeys.GiftHealth,
  healPercent: 0.1,
} as const satisfies GiftKindDef & { readonly healPercent: number };

export const giftShield = {
  id: GiftIds.Shield,
  textureKey: TextureKeys.GiftShield,
  animationKey: AnimationKeys.GiftShield,
  durationMs: 15000,
} as const satisfies GiftKindDef & { readonly durationMs: number };

export const giftPickup = {
  scale: 1.45,
  colliderRadius: 14,
  depth: 4,
  lifetimeMs: 12000,
  warnMs: 2200,
  bobAmplitudePx: 4.5,
  bobPeriodSec: 1.2,
} as const;

export const shieldAuraConfig = {
  textureSize: 96,
  visualRadiusMultiplier: 1.85,
  pulseMin: 1,
  pulseMax: 1.07,
  pulsePeriodSec: 1.6,
  rotateRadPerSec: 0.65,
  palette: [0xe8f7ff, 0x7fd4ff, 0xb8fff0, 0xa8b4ff, 0x7fd4ff],
  warnMs: 2500,
  hitFlashMs: 120,
  depth: 3,
  baseAlpha: 0.88,
} as const;

export function giftHealAmount(maxHealth: number): number {
  return Math.round(maxHealth * giftHealth.healPercent);
}
