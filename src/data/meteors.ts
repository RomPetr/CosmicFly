import { TextureKeys, type TextureKey } from '../config/assetKeys';

export const MeteorIds = {
  AshChunk: 'ash-chunk',
} as const;

export type MeteorId = (typeof MeteorIds)[keyof typeof MeteorIds];

export type MeteorDef = {
  readonly id: MeteorId;
  readonly textureKeys: readonly TextureKey[];
  readonly contactDamage: number;
  readonly maxHull: number;
  readonly speedMin: number;
  readonly speedMax: number;
  readonly spawnIntervalMs: number;
  readonly maxAlive: number;
  readonly spinMin: number;
  readonly spinMax: number;
  readonly colliderRadius: number;
  readonly scaleMin: number;
  readonly scaleMax: number;
  readonly tint: number;
  readonly spawnMarginPx: number;
  readonly recycleMarginPx: number;
  readonly safeRadius: number;
  readonly edgeInsetPx: number;
  readonly spawnAttempts: number;
};

export const ashChunkMeteor: MeteorDef = {
  id: MeteorIds.AshChunk,
  textureKeys: [TextureKeys.AshChunkA, TextureKeys.AshChunkB],
  contactDamage: 1,
  maxHull: 3,
  speedMin: 50,
  speedMax: 140,
  spawnIntervalMs: 1200,
  maxAlive: 7,
  spinMin: 25,
  spinMax: 90,
  colliderRadius: 78,
  scaleMin: 0.1,
  scaleMax: 0.16,
  tint: 0x8a7a68,
  spawnMarginPx: 48,
  recycleMarginPx: 64,
  safeRadius: 110,
  edgeInsetPx: 28,
  spawnAttempts: 16,
};

export const meteors: Record<MeteorId, MeteorDef> = {
  [MeteorIds.AshChunk]: ashChunkMeteor,
};
