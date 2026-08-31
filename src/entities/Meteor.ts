import Phaser from 'phaser';
import { TextureKeys, type TextureKey } from '../config/assetKeys';
import type { MeteorDef } from '../data/meteors';
import { ramming } from '../data/ramming';
import { MeteorSurfaceLighting } from '../effects/MeteorSurfaceLighting';

const SPRITE_DEPTH = 1;
const OUTLINE_DEPTH_OFFSET = -0.1;

export class Meteor extends Phaser.Physics.Arcade.Sprite {
  private readonly surfaceLighting: MeteorSurfaceLighting;
  private readonly outline: Phaser.GameObjects.Image;
  private hull: number;
  private ownSpeed: number;
  private colliderRadius: number;
  private halved: boolean;
  private knockbackRemainingMs: number;
  private ramLockedUntilMs: number;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.AshChunkA);

    if (!scene.textures.exists(TextureKeys.AshChunkA)) {
      throw new Error(`Texture "${TextureKeys.AshChunkA}" is not registered`);
    }

    this.surfaceLighting = new MeteorSurfaceLighting(scene);
    this.outline = scene.add.image(x, y, TextureKeys.AshChunkA);
    this.outline.setOrigin(0.5, 0.5);
    this.outline.setDepth(SPRITE_DEPTH + OUTLINE_DEPTH_OFFSET);
    this.outline.setVisible(false);
    this.hull = 0;
    this.ownSpeed = 0;
    this.colliderRadius = 0;
    this.halved = false;
    this.knockbackRemainingMs = 0;
    this.ramLockedUntilMs = 0;

    this.setOrigin(0.5, 0.5);
    this.setActive(false);
    this.setVisible(false);
  }

  public activate(def: MeteorDef, x: number, y: number): void {
    const textureKey = this.pickTexture(def.textureKeys);
    if (!this.scene.textures.exists(textureKey)) {
      throw new Error(`Texture "${textureKey}" is not registered`);
    }

    const scale = Phaser.Math.FloatBetween(def.scaleMin, def.scaleMax);
    const spinSign = Math.random() < 0.5 ? -1 : 1;
    const angularVelocity = Phaser.Math.FloatBetween(def.spinMin, def.spinMax) * spinSign;

    this.hull = def.maxHull;
    this.ownSpeed = Phaser.Math.FloatBetween(def.speedMin, def.speedMax);
    this.colliderRadius = def.colliderRadius;
    this.clearRamState();

    this.setTexture(textureKey);
    this.setScale(scale);
    this.setTint(def.tint);
    this.setDepth(SPRITE_DEPTH);
    this.enableBody(true, x, y, true, true);

    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      this.deactivate();
      return;
    }

    body.reset(x, y);
    const offsetX = this.width / 2 - def.colliderRadius;
    const offsetY = this.height / 2 - def.colliderRadius;
    this.setCircle(def.colliderRadius, offsetX, offsetY);
    body.setAllowGravity(false);
    body.setCollideWorldBounds(false);
    body.setBounce(0);
    body.setVelocity(0, this.ownSpeed);
    body.setAngularVelocity(angularVelocity);

    this.outline.setTexture(textureKey);
    this.outline.setScale(scale * def.outlineScaleFactor);
    this.outline.setTint(def.outlineTint);
    this.outline.setAlpha(def.outlineAlpha);
    this.outline.setVisible(true);
    this.syncOutline();
    this.surfaceLighting.activate(this.x, this.y, this.displayWidth, this.displayHeight, this.depth);
  }

  public syncFallSpeed(scrollSpeed: number, delta: number): void {
    if (!this.active) {
      return;
    }

    if (this.knockbackRemainingMs > 0) {
      this.knockbackRemainingMs = Math.max(0, this.knockbackRemainingMs - delta);
      return;
    }

    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocityY(this.ownSpeed + scrollSpeed);
    }
  }

  public updateVisual(delta: number): void {
    if (!this.active) {
      return;
    }

    this.syncOutline();
    this.surfaceLighting.update(delta, this.x, this.y);
  }

  public takeDamage(amount: number): boolean {
    if (!this.active || this.hull <= 0) {
      return false;
    }

    this.hull = Math.max(0, this.hull - amount);
    return this.hull <= 0;
  }

  public applyKnockback(vx: number, vy: number, stunMs: number): void {
    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    body.setVelocity(vx, vy);
    this.knockbackRemainingMs = Math.max(0, stunMs);
  }

  public tryLockRam(nowMs: number, cooldownMs: number): boolean {
    if (nowMs < this.ramLockedUntilMs) {
      return false;
    }

    this.ramLockedUntilMs = nowMs + cooldownMs;
    return true;
  }

  public shrinkInHalf(): boolean {
    if (this.halved) {
      return false;
    }

    this.halved = true;
    this.setScale(this.scaleX * ramming.meteorShrinkFactor);
    this.outline.setScale(this.outline.scaleX * ramming.meteorShrinkFactor);

    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.updateFromGameObject();
    }

    this.surfaceLighting.activate(
      this.x,
      this.y,
      this.displayWidth,
      this.displayHeight,
      this.depth,
    );
    return true;
  }

  public isHalved(): boolean {
    return this.halved;
  }

  public getWorldColliderRadius(): number {
    return this.colliderRadius * Math.abs(this.scaleX);
  }

  public deactivate(): void {
    this.clearRamState();

    if (!this.scene.sys.isActive()) {
      return;
    }

    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.stop();
    }

    this.outline.setVisible(false);
    this.surfaceLighting.deactivate();
    this.disableBody(true, true);
  }

  private clearRamState(): void {
    this.halved = false;
    this.knockbackRemainingMs = 0;
    this.ramLockedUntilMs = 0;
  }

  private syncOutline(): void {
    this.outline.setPosition(this.x, this.y);
    this.outline.setRotation(this.rotation);
  }

  private pickTexture(textureKeys: readonly TextureKey[]): TextureKey {
    const index = Phaser.Math.Between(0, textureKeys.length - 1);
    return textureKeys[index] ?? TextureKeys.AshChunkA;
  }
}
