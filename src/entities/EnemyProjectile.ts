import Phaser from 'phaser';
import { TextureKeys, type TextureKey } from '../config/assetKeys';
import { stage2Beam } from '../data/stage2Beam';
import { BeamInverseTrail } from '../effects/BeamInverseTrail';

export class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
  private readonly trail: BeamInverseTrail;
  private elapsedMs = 0;
  private lifetimeMs = 0;
  private damage = 0;
  private rotationJitterAmplitude = 0;
  private fadeOut = false;
  private inverseTrail = false;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.EnemyBolt);

    if (!scene.textures.exists(TextureKeys.EnemyBolt)) {
      throw new Error(`Texture "${TextureKeys.EnemyBolt}" is not registered`);
    }

    this.trail = new BeamInverseTrail(scene);
    this.setOrigin(0.5, 0.5);
    this.setActive(false);
    this.setVisible(false);
  }

  public fire(
    x: number,
    y: number,
    rotation: number,
    speed: number,
    lifetimeMs: number,
    damage: number,
    rotationJitterAmplitude: number,
    textureKey: TextureKey,
    scale: number,
  ): boolean {
    if (!this.scene.textures.exists(textureKey)) {
      return false;
    }

    this.fadeOut = textureKey === TextureKeys.Stage2Beam;
    this.inverseTrail = this.fadeOut;
    this.trail.reset();

    this.setTexture(textureKey);
    this.setScale(scale);
    this.setAlpha(1);
    if (this.fadeOut) {
      this.setOrigin(stage2Beam.originX, stage2Beam.originY);
    } else {
      this.setOrigin(0.5, 0.5);
    }
    this.enableBody(true, x, y, true, true);
    this.setRotation(rotation);
    this.setDepth(2);

    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      this.deactivate();
      return false;
    }

    body.reset(x, y);
    body.setSize(this.width, this.height, true);
    body.setAllowGravity(false);
    body.setCollideWorldBounds(false);
    this.scene.physics.velocityFromRotation(rotation, speed, body.velocity);

    this.elapsedMs = 0;
    this.lifetimeMs = lifetimeMs;
    this.damage = damage;
    this.rotationJitterAmplitude = rotationJitterAmplitude;
    return true;
  }

  public getDamage(): number {
    return this.damage;
  }

  public getRotationJitterAmplitude(): number {
    return this.rotationJitterAmplitude;
  }

  public tickTrail(delta: number): void {
    if (!this.active || !this.inverseTrail) {
      return;
    }

    const back = this.rotation + Math.PI;
    const trailDistance = this.displayWidth * stage2Beam.trailSpawnBackRatio;
    const trailX = this.x + Math.cos(back) * trailDistance;
    const trailY = this.y + Math.sin(back) * trailDistance;
    this.trail.update(delta, trailX, trailY, this.rotation);
  }

  public preUpdate(time: number, delta: number): void {
    if (!this.active || !this.scene.sys.isActive()) {
      return;
    }

    super.preUpdate(time, delta);
    this.elapsedMs += delta;

    if (this.fadeOut && this.lifetimeMs > 0) {
      this.setAlpha(Math.max(0, 1 - this.elapsedMs / this.lifetimeMs));
    }

    if (this.elapsedMs >= this.lifetimeMs || this.isOutOfWorld()) {
      this.deactivate();
    }
  }

  public deactivate(): void {
    this.trail.stop();
    this.fadeOut = false;
    this.inverseTrail = false;
    this.setAlpha(1);
    this.setOrigin(0.5, 0.5);

    if (!this.scene.sys.isActive()) {
      return;
    }

    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.stop();
    }

    this.disableBody(true, true);
  }

  private isOutOfWorld(): boolean {
    const world = this.scene.physics?.world;
    if (!world || !this.scene.sys.isActive()) {
      return false;
    }

    const bounds = world.bounds;
    const margin = Math.max(this.displayWidth, this.displayHeight);
    return (
      this.x < bounds.x - margin ||
      this.x > bounds.x + bounds.width + margin ||
      this.y < bounds.y - margin ||
      this.y > bounds.y + bounds.height + margin
    );
  }
}
