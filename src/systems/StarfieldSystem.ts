import Phaser from 'phaser';
import { TextureKeys } from '../config/assetKeys';
import { flightConfig } from '../data/flight';
import { starfieldConfig } from '../data/starfield';

const TAU = Math.PI * 2;

type TwinkleStar = {
  readonly sprite: Phaser.GameObjects.Image;
  readonly parallax: number;
  readonly baseScale: number;
  readonly baseAlpha: number;
  readonly alphaAmplitude: number;
  readonly angularSpeed: number;
  phase: number;
};

export class StarfieldSystem {
  private readonly scene: Phaser.Scene;
  private readonly viewWidth: number;
  private readonly viewHeight: number;
  private readonly farLayer: Phaser.GameObjects.TileSprite;
  private readonly nearLayer: Phaser.GameObjects.TileSprite;
  private readonly twinkleStars: TwinkleStar[];
  private currentScrollPxPerSec: number;
  private distancePx: number;
  private enabled: boolean;

  public constructor(scene: Phaser.Scene, initialDistanceKm = 0) {
    this.currentScrollPxPerSec = flightConfig.baseScrollPxPerSec;
    this.distancePx = Math.max(0, initialDistanceKm) / flightConfig.kmPerPx;
    this.enabled = true;
    this.scene = scene;

    const { width, height } = scene.scale;
    this.viewWidth = width;
    this.viewHeight = height;

    if (!scene.textures.exists(TextureKeys.StarfieldFar)) {
      throw new Error(`Texture "${TextureKeys.StarfieldFar}" is not registered`);
    }

    if (!scene.textures.exists(TextureKeys.StarfieldNear)) {
      throw new Error(`Texture "${TextureKeys.StarfieldNear}" is not registered`);
    }

    if (!scene.textures.exists(TextureKeys.TwinkleStar)) {
      throw new Error(`Texture "${TextureKeys.TwinkleStar}" is not registered`);
    }

    this.farLayer = scene.add
      .tileSprite(0, 0, width, height, TextureKeys.StarfieldFar)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-20);

    this.nearLayer = scene.add
      .tileSprite(0, 0, width, height, TextureKeys.StarfieldNear)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-19);

    this.twinkleStars = [];
    for (let index = 0; index < starfieldConfig.twinkle.count; index += 1) {
      this.twinkleStars.push(this.createTwinkleStar());
    }
  }

  public update(delta: number, moveY: number, facingAngle: number): void {
    if (!this.enabled || !this.scene.sys.isActive()) {
      return;
    }

    const dt = delta / 1000;
    const target = this.computeTargetScrollSpeed(moveY, facingAngle);
    const lerpAlpha = 1 - Math.exp(-flightConfig.scrollLerpPerSec * dt);
    this.currentScrollPxPerSec += (target - this.currentScrollPxPerSec) * lerpAlpha;

    const scrollDelta = this.currentScrollPxPerSec * dt;
    this.distancePx += scrollDelta;

    // Phaser 3: raising tilePositionY samples further down the texture, so content
    // appears to move up. Decrement so stars enter at the top and leave at the bottom.
    this.farLayer.tilePositionY -= scrollDelta * flightConfig.farParallax;
    this.nearLayer.tilePositionY -= scrollDelta;

    this.updateTwinkleStars(dt, scrollDelta);
  }

  public getScrollSpeed(): number {
    return this.currentScrollPxPerSec;
  }

  public getDistanceKm(): number {
    return this.distancePx * flightConfig.kmPerPx;
  }

  public stop(): void {
    this.enabled = false;
    this.twinkleStars.length = 0;
  }

  private computeTargetScrollSpeed(moveY: number, facingAngle: number): number {
    let target: number = flightConfig.baseScrollPxPerSec;

    if (moveY < 0) {
      target = flightConfig.boostedScrollPxPerSec;
    }

    const facingDelta = Phaser.Math.Angle.Wrap(facingAngle - flightConfig.northAngleRad);
    if (Math.abs(facingDelta) <= flightConfig.facingNorthConeRad) {
      target *= flightConfig.facingBoostMultiplier;
    }

    return target;
  }

  private createTwinkleStar(): TwinkleStar {
    const config = starfieldConfig.twinkle;
    const { palette } = starfieldConfig;
    const color = palette[Phaser.Math.Between(0, palette.length - 1)] ?? palette[0];
    const baseScale = Phaser.Math.FloatBetween(config.minScale, config.maxScale);
    const baseAlpha = Phaser.Math.FloatBetween(config.minAlpha, config.maxAlpha);

    const sprite = this.scene.add
      .image(
        Phaser.Math.Between(0, this.viewWidth),
        Phaser.Math.Between(0, this.viewHeight),
        TextureKeys.TwinkleStar,
      )
      .setScrollFactor(0)
      .setDepth(config.depth)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(color)
      .setScale(baseScale)
      .setAlpha(baseAlpha);

    return {
      sprite,
      parallax: Phaser.Math.FloatBetween(config.minParallax, config.maxParallax),
      baseScale,
      baseAlpha,
      alphaAmplitude: Phaser.Math.FloatBetween(
        config.minAlphaAmplitude,
        config.maxAlphaAmplitude,
      ),
      angularSpeed: Phaser.Math.FloatBetween(config.minSpeedRadPerSec, config.maxSpeedRadPerSec),
      phase: Phaser.Math.FloatBetween(0, TAU),
    };
  }

  private updateTwinkleStars(dt: number, scrollDelta: number): void {
    const { scaleAmplitude, wrapMarginPx } = starfieldConfig.twinkle;

    for (const star of this.twinkleStars) {
      star.phase += star.angularSpeed * dt;
      if (star.phase > TAU) {
        star.phase -= TAU;
      }

      const wave = Math.sin(star.phase);
      const { sprite } = star;

      sprite.y += scrollDelta * star.parallax;
      if (sprite.y > this.viewHeight + wrapMarginPx) {
        sprite.y = -wrapMarginPx;
        sprite.x = Phaser.Math.Between(0, this.viewWidth);
      }

      sprite.setAlpha(star.baseAlpha + star.alphaAmplitude * wave);
      sprite.setScale(star.baseScale * (1 + scaleAmplitude * wave));
    }
  }
}
