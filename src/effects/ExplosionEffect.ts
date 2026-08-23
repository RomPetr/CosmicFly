import Phaser from 'phaser';
import { AnimationKeys, TextureKeys } from '../config/assetKeys';

const DEPTH = 12;
const CORE_SCALE = 2.4;
const SATELLITE_MIN = 5;
const SATELLITE_MAX = 8;
const SATELLITE_RADIUS_MIN = 10;
const SATELLITE_RADIUS_MAX = 38;
const SATELLITE_SCALE_MIN = 0.7;
const SATELLITE_SCALE_MAX = 1.45;
const SATELLITE_DELAY_MIN_MS = 60;
const SATELLITE_DELAY_MAX_MS = 380;

export class ExplosionEffect {
  private readonly scene: Phaser.Scene;
  private readonly sprites: Set<Phaser.GameObjects.Sprite>;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sprites = new Set();
  }

  public spawnBurst(x: number, y: number): void {
    if (!this.isAvailable()) {
      return;
    }

    this.spawnSprite(x, y, CORE_SCALE, 0);

    const satellites = Phaser.Math.Between(SATELLITE_MIN, SATELLITE_MAX);
    for (let index = 0; index < satellites; index += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const radius = Phaser.Math.FloatBetween(SATELLITE_RADIUS_MIN, SATELLITE_RADIUS_MAX);
      this.spawnSprite(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
        Phaser.Math.FloatBetween(SATELLITE_SCALE_MIN, SATELLITE_SCALE_MAX),
        Phaser.Math.Between(SATELLITE_DELAY_MIN_MS, SATELLITE_DELAY_MAX_MS),
      );
    }
  }

  public stop(): void {
    if (this.scene.sys.isActive()) {
      for (const sprite of this.sprites) {
        sprite.destroy();
      }
    }

    this.sprites.clear();
  }

  private isAvailable(): boolean {
    return (
      this.scene.sys.isActive() &&
      this.scene.textures.exists(TextureKeys.Explosion) &&
      this.scene.anims.exists(AnimationKeys.Explosion)
    );
  }

  private spawnSprite(x: number, y: number, scale: number, delayMs: number): void {
    const sprite = this.scene.add.sprite(x, y, TextureKeys.Explosion, 0);
    sprite
      .setDepth(DEPTH)
      .setScale(scale)
      .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2))
      .setVisible(delayMs === 0);

    this.sprites.add(sprite);
    sprite.once(Phaser.Animations.Events.ANIMATION_START, () => {
      sprite.setVisible(true);
    });
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.sprites.delete(sprite);
      sprite.destroy();
    });

    if (delayMs === 0) {
      sprite.play(AnimationKeys.Explosion);
      return;
    }

    sprite.playAfterDelay(AnimationKeys.Explosion, delayMs);
  }
}
