import { TextureKeys, type TextureKey } from '../config/assetKeys';

export const MeteorIds = {
  AshChunk: 'ash-chunk',
} as const;

export type MeteorId = (typeof MeteorIds)[keyof typeof MeteorIds];

export type MeteorDef = {
  readonly id: MeteorId;
  readonly textureKeys: readonly TextureKey[];
  /** Player health percentage points removed on contact. */
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
  /** Dark silhouette drawn behind the meteor sprite. */
  readonly outlineTint: number;
  /** Outline sprite scale relative to the meteor scale. */
  readonly outlineScaleFactor: number;
  readonly outlineAlpha: number;
  readonly spawnMarginPx: number;
  readonly recycleMarginPx: number;
  readonly safeRadius: number;
  readonly edgeInsetPx: number;
  readonly spawnAttempts: number;
};

export const ashChunkMeteor: MeteorDef = {
  id: MeteorIds.AshChunk,
  textureKeys: [TextureKeys.AshChunkA, TextureKeys.AshChunkB],
  contactDamage: 5,
  maxHull: 3,
  speedMin: 50,
  speedMax: 140,
  spawnIntervalMs: 1200,
  maxAlive: 7,
  spinMin: 25,
  spinMax: 90,
  colliderRadius: 78,
  scaleMin: 0.14,
  scaleMax: 0.22,
  tint: 0x9c8b76,
  outlineTint: 0x1a1512,
  outlineScaleFactor: 1.08,
  outlineAlpha: 0.9,
  spawnMarginPx: 48,
  recycleMarginPx: 64,
  safeRadius: 110,
  edgeInsetPx: 28,
  spawnAttempts: 16,
};

export const meteors: Record<MeteorId, MeteorDef> = {
  [MeteorIds.AshChunk]: ashChunkMeteor,
};
