import Phaser from 'phaser';
import { TextureKeys } from '../config/assetKeys';
import { flightConfig } from '../data/flight';

export class StarfieldSystem {
  private readonly farLayer: Phaser.GameObjects.TileSprite;
  private readonly nearLayer: Phaser.GameObjects.TileSprite;
  private currentScrollPxPerSec: number;
  private distancePx: number;
  private enabled: boolean;

  public constructor(scene: Phaser.Scene) {
    this.currentScrollPxPerSec = flightConfig.baseScrollPxPerSec;
    this.distancePx = 0;
    this.enabled = true;

    const { width, height } = scene.scale;

    if (!scene.textures.exists(TextureKeys.StarfieldFar)) {
      throw new Error(`Texture "${TextureKeys.StarfieldFar}" is not registered`);
    }

    if (!scene.textures.exists(TextureKeys.StarfieldNear)) {
      throw new Error(`Texture "${TextureKeys.StarfieldNear}" is not registered`);
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
  }

  public update(delta: number, moveY: number, facingAngle: number): void {
    if (!this.enabled) {
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
  }

  public getScrollSpeed(): number {
    return this.currentScrollPxPerSec;
  }

  public getDistanceKm(): number {
    return this.distancePx * flightConfig.kmPerPx;
  }

  public stop(): void {
    this.enabled = false;
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
}
