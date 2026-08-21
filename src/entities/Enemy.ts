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
  private preferredDistance: number;
  private retreatDistance: number;
  private approachDistance: number;
  private orbitStrength: number;
  private weaveStrength: number;
  private steeringLerpPerSec: number;
  private fireIntervalMinMs: number;
  private fireIntervalMaxMs: number;
  private fireCooldownMs: number;
  private orbitDirection: number;
  private orbitSwitchRemainingMs: number;
  private weavePhase: number;
  private weaveFrequency: number;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.StingDart);

    if (!scene.textures.exists(TextureKeys.StingDart)) {
      throw new Error(`Texture "${TextureKeys.StingDart}" is not registered`);
    }

    this.hull = 0;
    this.maxHull = 0;
    this.moveSpeed = 0;
    this.noseOffset = 0;
    this.preferredDistance = 0;
    this.retreatDistance = 0;
    this.approachDistance = 0;
    this.orbitStrength = 0;
    this.weaveStrength = 0;
    this.steeringLerpPerSec = 0;
    this.fireIntervalMinMs = 0;
    this.fireIntervalMaxMs = 0;
    this.fireCooldownMs = 0;
    this.orbitDirection = 1;
    this.orbitSwitchRemainingMs = 0;
    this.weavePhase = 0;
    this.weaveFrequency = 0;

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
    this.preferredDistance = def.preferredDistance;
    this.retreatDistance = def.retreatDistance;
    this.approachDistance = def.approachDistance;
    this.orbitStrength = def.orbitStrength;
    this.weaveStrength = def.weaveStrength;
    this.steeringLerpPerSec = def.steeringLerpPerSec;
    this.fireIntervalMinMs = def.fireIntervalMinMs;
    this.fireIntervalMaxMs = def.fireIntervalMaxMs;
    this.fireCooldownMs = this.randomFireInterval();
    this.orbitDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    this.orbitSwitchRemainingMs = Phaser.Math.FloatBetween(1800, 4200);
    this.weavePhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.weaveFrequency = Phaser.Math.FloatBetween(
      def.weaveFrequencyMin,
      def.weaveFrequencyMax,
    );

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
    body.setVelocity(0, 0);

    this.syncHealthBar();
    this.barBackground.setVisible(true);
    this.barFill.setVisible(true);
  }

  public updateBehavior(targetX: number, targetY: number, delta: number): void {
    if (!this.active) {
      return;
    }

    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    const deltaSeconds = delta / 1000;
    const offsetX = targetX - this.x;
    const offsetY = targetY - this.y;
    const distance = Math.hypot(offsetX, offsetY);
    const inverseDistance = distance > 0.001 ? 1 / distance : 0;
    const towardX = offsetX * inverseDistance;
    const towardY = offsetY * inverseDistance;
    const perpendicularX = -towardY * this.orbitDirection;
    const perpendicularY = towardX * this.orbitDirection;

    this.orbitSwitchRemainingMs -= delta;
    if (this.orbitSwitchRemainingMs <= 0) {
      this.orbitDirection *= -1;
      this.orbitSwitchRemainingMs = Phaser.Math.FloatBetween(1800, 4200);
    }

    this.weavePhase += this.weaveFrequency * deltaSeconds;
    const weave = Math.sin(this.weavePhase) * this.weaveStrength;
    let approachWeight: number;
    let orbitWeight = this.orbitStrength;

    if (distance > this.approachDistance) {
      approachWeight = 1;
      orbitWeight *= 0.45;
    } else if (distance < this.retreatDistance) {
      approachWeight = -1;
    } else {
      const preferredOffset = (distance - this.preferredDistance) /
        Math.max(1, this.approachDistance - this.retreatDistance);
      approachWeight = Phaser.Math.Clamp(preferredOffset * 2.5, -0.45, 0.45);
    }

    const desiredX = towardX * approachWeight + perpendicularX * (orbitWeight + weave);
    const desiredY = towardY * approachWeight + perpendicularY * (orbitWeight + weave);
    const desiredLength = Math.hypot(desiredX, desiredY);
    const desiredScale = desiredLength > 0.001 ? this.moveSpeed / desiredLength : 0;
    const targetVelocityX = desiredX * desiredScale;
    const targetVelocityY = desiredY * desiredScale;
    const steeringAlpha = 1 - Math.exp(-this.steeringLerpPerSec * deltaSeconds);

    body.velocity.x += (targetVelocityX - body.velocity.x) * steeringAlpha;
    body.velocity.y += (targetVelocityY - body.velocity.y) * steeringAlpha;

    if (body.velocity.lengthSq() > 1) {
      this.setRotation(Math.atan2(body.velocity.y, body.velocity.x) + this.noseOffset);
    }

    this.syncHealthBar();
  }

  public consumeFireRequest(delta: number): boolean {
    if (!this.active) {
      return false;
    }

    this.fireCooldownMs -= delta;
    if (this.fireCooldownMs > 0) {
      return false;
    }

    this.fireCooldownMs = this.randomFireInterval();
    return true;
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

  private randomFireInterval(): number {
    return Phaser.Math.FloatBetween(this.fireIntervalMinMs, this.fireIntervalMaxMs);
  }
}
