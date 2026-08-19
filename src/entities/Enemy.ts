import Phaser from 'phaser';
import { TextureKeys } from '../config/assetKeys';
import type { EnemyDef } from '../data/enemies';

const HEALTH_BAR_WIDTH = 30;
const HEALTH_BAR_HEIGHT = 3;
const HEALTH_BAR_GAP = 6;
const HEALTH_BAR_BACKGROUND = 0x141820;
const HEALTH_BAR_FILL_HEALTHY = 0x3ecf6a;
const HEALTH_BAR_FILL_WOUNDED = 0xe6a23c;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private readonly barBackground: Phaser.GameObjects.Rectangle;
  private readonly barFill: Phaser.GameObjects.Rectangle;
  private hull: number;
  private maxHull: number;
  private moveSpeed: number;
  private noseOffset: number;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.StingDart);

    if (!scene.textures.exists(TextureKeys.StingDart)) {
      throw new Error(`Texture "${TextureKeys.StingDart}" is not registered`);
    }

    this.hull = 0;
    this.maxHull = 0;
    this.moveSpeed = 0;
    this.noseOffset = 0;

    this.setOrigin(0.5, 0.5);
    this.setActive(false);
    this.setVisible(false);

    this.barBackground = scene.add.rectangle(
      x,
      y,
      HEALTH_BAR_WIDTH,
      HEALTH_BAR_HEIGHT,
      HEALTH_BAR_BACKGROUND,
    );
    this.barBackground.setOrigin(0.5, 0.5);
    this.barBackground.setDepth(6);
    this.barBackground.setVisible(false);

    this.barFill = scene.add.rectangle(
      x,
      y,
      HEALTH_BAR_WIDTH,
      HEALTH_BAR_HEIGHT,
      HEALTH_BAR_FILL_HEALTHY,
    );
    this.barFill.setOrigin(0, 0.5);
    this.barFill.setDepth(7);
    this.barFill.setVisible(false);
  }

  public activate(def: EnemyDef, x: number, y: number): void {
    if (!this.scene.textures.exists(def.textureKey)) {
      throw new Error(`Texture "${def.textureKey}" is not registered`);
    }

    this.hull = def.maxHull;
    this.maxHull = def.maxHull;
    this.moveSpeed = def.speed;
    this.noseOffset = def.angleOffset;

    this.setTexture(def.textureKey);
    this.setScale(def.scale);
    this.setTint(def.tint);
    this.setDepth(1);
    this.enableBody(true, x, y, true, true);

    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      this.deactivate();
      return;
    }

    body.reset(x, y);
    const unscaledRadius = def.colliderRadius / def.scale;
    const offsetX = this.width / 2 - unscaledRadius;
    const offsetY = this.height / 2 - unscaledRadius;
    this.setCircle(unscaledRadius, offsetX, offsetY);
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);
    body.setBounce(0);

    this.syncHealthBar();
    this.barBackground.setVisible(true);
    this.barFill.setVisible(true);
  }

  public updateChase(targetX: number, targetY: number): void {
    if (!this.active) {
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      this.scene.physics.velocityFromRotation(angle, this.moveSpeed, body.velocity);
    }

    this.setRotation(angle + this.noseOffset);
    this.syncHealthBar();
  }

  public takeDamage(amount: number): boolean {
    if (!this.active || this.hull <= 0) {
      return false;
    }

    this.hull = Math.max(0, this.hull - amount);
    this.syncHealthBar();
    return this.hull <= 0;
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
    this.barBackground.setVisible(false);
    this.barFill.setVisible(false);
  }

  private syncHealthBar(): void {
    const barY = this.y - this.displayHeight * 0.5 - HEALTH_BAR_GAP;
    this.barBackground.setPosition(this.x, barY);
    this.barFill.setPosition(this.x - HEALTH_BAR_WIDTH / 2, barY);

    if (this.hull <= 0 || this.maxHull <= 0) {
      this.barBackground.setVisible(false);
      this.barFill.setVisible(false);
      return;
    }

    this.barFill.width = HEALTH_BAR_WIDTH * (this.hull / this.maxHull);
    this.barFill.setFillStyle(
      this.hull <= 1 ? HEALTH_BAR_FILL_WOUNDED : HEALTH_BAR_FILL_HEALTHY,
    );
  }
}
