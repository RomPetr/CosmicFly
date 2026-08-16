export const SceneKeys = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Menu: 'MenuScene',
  Game: 'GameScene',
  GameOver: 'GameOverScene',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];

export const SkinIds = {
  Ember: 'skin-ember',
} as const;

export type SkinId = (typeof SkinIds)[keyof typeof SkinIds];
