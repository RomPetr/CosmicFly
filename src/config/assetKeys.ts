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
  PulseBolt: 'pulse-bolt',
  StingDart: 'sting-dart',
  FlareMissile: 'flare-missile',
} as const;

export type TextureKey = (typeof TextureKeys)[keyof typeof TextureKeys];

export const TexturePaths = {
  [TextureKeys.PlayerShip]: '/assets/ships/player/spaceShips_001.png',
  [TextureKeys.StingDart]: '/assets/enemies/sting-dart/spaceShips_008.png',
  [TextureKeys.FlareMissile]: '/assets/projectiles/missiles/spaceMissiles_006.png',
} as const;

export const SkinIds = {
  Ember: 'skin-ember',
} as const;

export type SkinId = (typeof SkinIds)[keyof typeof SkinIds];

export const SkinTints: Record<SkinId, number> = {
  [SkinIds.Ember]: 0xffb04a,
};
