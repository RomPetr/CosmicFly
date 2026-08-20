import Phaser from 'phaser';
import { TextureKeys, type TextureKey } from '../config/assetKeys';
import type { MeteorDef } from '../data/meteors';

export class Meteor extends Phaser.Physics.Arcade.Sprite {
  private hull: number;
  private contactDamage: number;
  private ownSpeed: number;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.AshChunkA);

    if (!scene.textures.exists(TextureKeys.AshChunkA)) {
      throw new Error(`Texture "${TextureKeys.AshChunkA}" is not registered`);
    }

    this.hull = 0;
    this.contactDamage = 0;
    this.ownSpeed = 0;

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
    this.contactDamage = def.contactDamage;
    this.ownSpeed = Phaser.Math.FloatBetween(def.speedMin, def.speedMax);

    this.setTexture(textureKey);
    this.setScale(scale);
    this.setTint(def.tint);
    this.setDepth(1);
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
  }

  public syncFallSpeed(scrollSpeed: number): void {
    if (!this.active) {
      return;
    }

    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocityY(this.ownSpeed + scrollSpeed);
    }
  }

  public takeDamage(amount: number): boolean {
    if (!this.active || this.hull <= 0) {
      return false;
    }

    this.hull = Math.max(0, this.hull - amount);
    return this.hull <= 0;
  }

  public getContactDamage(): number {
    return this.contactDamage;
  }

  public deactivate(): void {
    if (!this.scene.sys.isActive()) {
      return;
    }

    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.stop();
    }

    this.disableBody(true, true);
  }

  private pickTexture(textureKeys: readonly TextureKey[]): TextureKey {
    const index = Phaser.Math.Between(0, textureKeys.length - 1);
    return textureKeys[index] ?? TextureKeys.AshChunkA;
  }
}
