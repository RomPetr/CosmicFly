import Phaser from 'phaser';
import { TextureKeys, type TextureKey } from '../config/assetKeys';
import { WeaponIds, type PlayerProjectileDamage } from '../data/weapons';
import { MissileSparkTrail } from '../effects/MissileSparkTrail';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  private elapsedMs: number;
  private lifetimeMs: number;
  private damage: PlayerProjectileDamage;
  private sparkTrail: MissileSparkTrail | null;
  private travelRotation: number;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.PulseBolt);

    if (!scene.textures.exists(TextureKeys.PulseBolt)) {
      throw new Error(`Texture "${TextureKeys.PulseBolt}" is not registered`);
    }

    this.elapsedMs = 0;
    this.lifetimeMs = 0;
    this.damage = {
      sourceId: WeaponIds.PulseBeam,
      baseDamage: 0,
    };
    this.sparkTrail = null;
    this.travelRotation = 0;

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
    damage: PlayerProjectileDamage,
    textureKey: TextureKey,
    scale: number,
    angleOffset: number,
  ): void {
    if (!this.scene.textures.exists(textureKey)) {
      throw new Error(`Texture "${textureKey}" is not registered`);
    }

    this.setTexture(textureKey);
    this.setScale(scale);
    this.enableBody(true, x, y, true, true);
    this.setRotation(rotation + angleOffset);
    this.setDepth(2);

    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      this.deactivate();
      return;
    }

    body.reset(x, y);
    body.setSize(this.width, this.height, true);
    body.setAllowGravity(false);
    body.setCollideWorldBounds(false);
    this.scene.physics.velocityFromRotation(rotation, speed, body.velocity);

    this.elapsedMs = 0;
    this.lifetimeMs = lifetimeMs;
    this.damage = damage;
    this.travelRotation = rotation;

    if (damage.sourceId === WeaponIds.FlareMissiles) {
      this.startSparkTrail(rotation);
    } else {
      this.stopSparkTrail();
    }
  }

  public getDamage(): PlayerProjectileDamage {
    return this.damage;
  }

  public syncSparks(delta: number): void {
    if (!this.active || this.sparkTrail === null) {
      return;
    }

    if (this.damage.sourceId !== WeaponIds.FlareMissiles) {
      return;
    }

    this.sparkTrail.update(delta, this, this.travelRotation);
  }

  public preUpdate(time: number, delta: number): void {
    if (!this.active) {
      return;
    }

    if (!this.scene.sys.isActive()) {
      return;
    }

    super.preUpdate(time, delta);

    this.elapsedMs += delta;
    if (this.elapsedMs >= this.lifetimeMs || this.isOutOfWorld()) {
      this.deactivate();
    }
  }

  public deactivate(): void {
    this.stopSparkTrail();

    if (!this.scene.sys.isActive()) {
      return;
    }

    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.stop();
    }

    this.disableBody(true, true);
  }

  private startSparkTrail(travelRotation: number): void {
    if (this.sparkTrail === null) {
      this.sparkTrail = new MissileSparkTrail(this.scene);
    }

    this.sparkTrail.start(this, travelRotation);
  }

  private stopSparkTrail(): void {
    this.sparkTrail?.stop();
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
