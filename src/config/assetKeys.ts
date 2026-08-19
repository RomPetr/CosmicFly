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

export const SoundKeys = {
  BlasterShoot: 'blaster-shoot',
  RocketLaunch: 'rocket-launch',
  EnemyBlaster: 'enemy-blaster',
  EnemyMissile: 'enemy-missile',
  EngineIdle: 'engine-idle',
  EngineThrust: 'engine-thrust',
} as const;

export type SoundKey = (typeof SoundKeys)[keyof typeof SoundKeys];

export const SoundPaths = {
  [SoundKeys.BlasterShoot]: '/assets/audio/player/blaster_shoot.ogg',
  [SoundKeys.RocketLaunch]: '/assets/audio/player/rocket_launch.ogg',
  [SoundKeys.EnemyBlaster]: '/assets/audio/enemy/enemy_blaster.ogg',
  [SoundKeys.EnemyMissile]: '/assets/audio/enemy/enemy_missile.ogg',
  [SoundKeys.EngineIdle]: '/assets/audio/engine/engine_idle.ogg',
  [SoundKeys.EngineThrust]: '/assets/audio/engine/engine_thrust.ogg',
} as const;

export const SkinIds = {
  Ember: 'skin-ember',
} as const;

export type SkinId = (typeof SkinIds)[keyof typeof SkinIds];

export const SkinTints: Record<SkinId, number> = {
  [SkinIds.Ember]: 0xffb04a,
};
