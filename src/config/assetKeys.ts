export const SceneKeys = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Menu: 'MenuScene',
  Game: 'GameScene',
  GameOver: 'GameOverScene',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];

export const TextureKeys = {
  PlayerShip: 'player-ship',
} as const;

export type TextureKey = (typeof TextureKeys)[keyof typeof TextureKeys];

export const SkinIds = {
  Ember: 'skin-ember',
} as const;

export type SkinId = (typeof SkinIds)[keyof typeof SkinIds];

export const SkinTints: Record<SkinId, number> = {
  [SkinIds.Ember]: 0xffb04a,
};
