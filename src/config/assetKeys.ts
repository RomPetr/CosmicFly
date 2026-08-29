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
  EnemyBolt: 'enemy-bolt',
  StingDart: 'sting-dart',
  MiddleEnemy: 'middle-enemy',
  FlareMissile: 'flare-missile',
  StarfieldFar: 'starfield-far',
  StarfieldNear: 'starfield-near',
  TwinkleStar: 'twinkle-star',
  AshChunkA: 'ash-chunk-a',
  AshChunkB: 'ash-chunk-b',
  EngineFlame: 'engine-flame',
  Explosion: 'explosion',
  CrystalGem: 'crystal-gem',
  SpaceStation: 'space-station',
  GiftHealth: 'gift-health',
  GiftShield: 'gift-shield',
  ShieldAura: 'shield-aura',
} as const;

export type TextureKey = (typeof TextureKeys)[keyof typeof TextureKeys];

export const ExplosionSheet = {
  frameWidth: 64,
  frameHeight: 64,
  frameCount: 16,
  frameRate: 24,
} as const;

export const GiftSheet = {
  frameWidth: 32,
  frameHeight: 32,
  frameCount: 5,
  frameRate: 8,
} as const;

export const AnimationKeys = {
  Explosion: 'explosion-anim',
  GiftHealth: 'gift-health-anim',
  GiftShield: 'gift-shield-anim',
} as const;

export type AnimationKey = (typeof AnimationKeys)[keyof typeof AnimationKeys];

export const TexturePaths = {
  [TextureKeys.PlayerShip]: '/assets/ships/player/spaceShips_001.png',
  [TextureKeys.StingDart]: '/assets/enemies/sting-dart/spaceShips_008.png',
  [TextureKeys.MiddleEnemy]: '/assets/enemies/middle-enemy/spaceShips_007_1.png',
  [TextureKeys.FlareMissile]: '/assets/projectiles/missiles/spaceMissiles_006.png',
  [TextureKeys.AshChunkA]: '/assets/meteors/ash-chunk/spaceMeteors_001.png',
  [TextureKeys.AshChunkB]: '/assets/meteors/ash-chunk/spaceMeteors_003.png',
  [TextureKeys.EngineFlame]: '/assets/effects/engine/engine_flame.png',
  [TextureKeys.Explosion]: '/assets/effects/explosion/explosion_sheet.png',
  [TextureKeys.SpaceStation]: '/assets/stations/space_station.png',
  [TextureKeys.GiftHealth]: '/assets/pickups/hp_bonus_sheet.png',
  [TextureKeys.GiftShield]: '/assets/pickups/shield_bonus_sheet.png',
} as const;

export const SoundKeys = {
  BlasterShoot: 'blaster-shoot',
  RocketLaunch: 'rocket-launch',
  EnemyBlaster: 'enemy-blaster',
  MiddleEnemyBlaster: 'middle-enemy-blaster',
  EnemyMissile: 'enemy-missile',
  PlayerHit: 'player-hit',
  PlayerExplosion: 'player-explosion',
  ShipLaunch: 'ship-launch',
  ShipBlink: 'ship-blink',
  GiftPickup: 'gift-pickup',
  ShipRam: 'ship-ram',
  EngineLow: 'engine-low',
  EngineLarge: 'engine-large',
} as const;

export type SoundKey = (typeof SoundKeys)[keyof typeof SoundKeys];

export const SoundPaths = {
  [SoundKeys.BlasterShoot]: '/assets/audio/player/blaster_shoot.ogg',
  [SoundKeys.RocketLaunch]: '/assets/audio/player/rocket_launch.ogg',
  [SoundKeys.EnemyBlaster]: '/assets/audio/enemy/enemy_blaster.ogg',
  [SoundKeys.MiddleEnemyBlaster]: '/assets/audio/enemy/middle_enemy_blaster.ogg',
  [SoundKeys.EnemyMissile]: '/assets/audio/enemy/enemy_missile.ogg',
  [SoundKeys.PlayerHit]: '/assets/audio/player/player_hit.ogg',
  [SoundKeys.PlayerExplosion]: '/assets/audio/player/player_explosion.ogg',
  [SoundKeys.ShipLaunch]: '/assets/audio/player/ship_launch.ogg',
  [SoundKeys.ShipBlink]: '/assets/audio/player/ship_blink.ogg',
  [SoundKeys.GiftPickup]: '/assets/audio/player/gift_pickup.wav',
  [SoundKeys.ShipRam]: '/assets/audio/player/ship_ram.wav',
  [SoundKeys.EngineLow]: '/assets/audio/engine/engine_low.ogg',
  [SoundKeys.EngineLarge]: '/assets/audio/engine/engine_large.ogg',
} as const;

export const SkinIds = {
  Ember: 'skin-ember',
} as const;

export type SkinId = (typeof SkinIds)[keyof typeof SkinIds];

export const SkinTints: Record<SkinId, number> = {
  [SkinIds.Ember]: 0xffb04a,
};
