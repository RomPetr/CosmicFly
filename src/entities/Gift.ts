import Phaser from 'phaser';
import { TextureKeys } from '../config/assetKeys';
import {
  GiftIds,
  giftHealth,
  giftPickup,
  giftShield,
  type GiftId,
} from '../data/gifts';

const TWO_PI = Math.PI * 2;
const WARN_BLINK_HZ = 8;

export class Gift extends Phaser.Physics.Arcade.Sprite {
  private kind: GiftId;
  private elapsedMs: number;
  private restX: number;
  private restY: number;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.GiftHealth);

    if (!scene.textures.exists(TextureKeys.GiftHealth)) {
      throw new Error(`Texture "${TextureKeys.GiftHealth}" is not registered`);
    }

    this.kind = GiftIds.Health;
    this.elapsedMs = 0;
    this.restX = x;
    this.restY = y;

    this.setOrigin(0.5, 0.5);
    this.setRotation(0);
    this.setActive(false);
    this.setVisible(false);
  }

  public activate(kind: GiftId, x: number, y: number): void {
    const def = kind === GiftIds.Shield ? giftShield : giftHealth;
    if (!this.scene.textures.exists(def.textureKey)) {
      throw new Error(`Texture "${def.textureKey}" is not registered`);
    }
    if (!this.scene.anims.exists(def.animationKey)) {
      throw new Error(`Animation "${def.animationKey}" is not registered`);
    }

    this.kind = kind;
    this.elapsedMs = 0;
    this.restX = x;
    this.restY = y;
    this.clampRestToWorld();

    this.setTexture(def.textureKey);
    this.setScale(giftPickup.scale);
    this.setRotation(0);
    this.setAlpha(1);
    this.setDepth(giftPickup.depth);
    this.enableBody(true, this.restX, this.restY, true, true);
    this.play(def.animationKey);

    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      this.deactivate();
      return;
    }

    body.reset(this.restX, this.restY);
    const unscaledRadius = giftPickup.colliderRadius / giftPickup.scale;
    const offsetX = this.width / 2 - unscaledRadius;
    const offsetY = this.height / 2 - unscaledRadius;
    this.setCircle(unscaledRadius, offsetX, offsetY);
    body.setAllowGravity(false);
    body.setCollideWorldBounds(false);
    body.setBounce(0);
    body.setVelocity(0, 0);
    body.setAngularVelocity(0);
  }

  public getKind(): GiftId {
    return this.kind;
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
    if (this.elapsedMs >= giftPickup.lifetimeMs) {
      this.deactivate();
      return;
    }

    const remainingMs = giftPickup.lifetimeMs - this.elapsedMs;
    if (remainingMs <= giftPickup.warnMs) {
      const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.elapsedMs * 0.001 * WARN_BLINK_HZ * TWO_PI));
      this.setAlpha(blink);
    } else if (this.alpha !== 1) {
      this.setAlpha(1);
    }

    this.clampRestToWorld();
    const bob =
      Math.sin((this.elapsedMs / 1000) * (TWO_PI / giftPickup.bobPeriodSec)) *
      giftPickup.bobAmplitudePx;
    this.setPosition(this.restX, this.restY + bob);
    this.setRotation(0);
  }

  public deactivate(): void {
    if (!this.scene.sys.isActive()) {
      return;
    }

    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.stop();
    }

    this.anims.stop();
    this.disableBody(true, true);
  }

  private clampRestToWorld(): void {
    const world = this.scene.physics?.world;
    if (!world) {
      return;
    }

    const bounds = world.bounds;
    const pad = giftPickup.colliderRadius;
    this.restX = Phaser.Math.Clamp(this.restX, bounds.x + pad, bounds.x + bounds.width - pad);
    this.restY = Phaser.Math.Clamp(this.restY, bounds.y + pad, bounds.y + bounds.height - pad);
  }
}
