import Phaser from 'phaser';
import { TextureKeys } from '../config/assetKeys';
import { EnemyIds, type EnemyDef, type EnemyId } from '../data/enemies';
import { ramming } from '../data/ramming';
import type { PlayerProjectileDamage } from '../data/weapons';
import { HealthBar, enemyHealthBarStyle } from '../ui/HealthBar';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private readonly healthBar: HealthBar;
  private definition: EnemyDef | null;
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
  private knockbackRemainingMs: number;
  private spinRemainingRad: number;
  private spinOmegaRadPerSec: number;
  private ramLockedUntilMs: number;
  private chargeCooldownMs: number;
  private chargeRemainingMs: number;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.StingDart);

    if (!scene.textures.exists(TextureKeys.StingDart)) {
      throw new Error(`Texture "${TextureKeys.StingDart}" is not registered`);
    }

    this.definition = null;
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
    this.knockbackRemainingMs = 0;
    this.spinRemainingRad = 0;
    this.spinOmegaRadPerSec = 0;
    this.ramLockedUntilMs = 0;
    this.chargeCooldownMs = 0;
    this.chargeRemainingMs = 0;

    this.setOrigin(0.5, 0.5);
    this.setActive(false);
    this.setVisible(false);

    this.healthBar = new HealthBar(scene, enemyHealthBarStyle);
  }

  public activate(def: EnemyDef, x: number, y: number): void {
    if (!this.scene.textures.exists(def.textureKey)) {
      throw new Error(`Texture "${def.textureKey}" is not registered`);
    }

    this.definition = def;
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
    this.clearRamState();
    if (this.canCharge()) {
      this.chargeCooldownMs = this.randomChargeCooldown();
    }

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
    this.healthBar.setVisible(true);
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

    if (this.knockbackRemainingMs > 0) {
      this.interruptCharge();
      this.knockbackRemainingMs = Math.max(0, this.knockbackRemainingMs - delta);
      this.tickSpin(deltaSeconds);
      this.syncHealthBar();
      return;
    }

    this.tickCharge(delta);

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
    const charging = this.chargeRemainingMs > 0;
    const weave = charging ? 0 : Math.sin(this.weavePhase) * this.weaveStrength;
    let approachWeight: number;
    let orbitWeight = charging ? ramming.middleCharge.orbitStrength : this.orbitStrength;

    if (charging) {
      approachWeight = 1;
    } else if (distance > this.approachDistance) {
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
    const speed = charging
      ? this.moveSpeed * ramming.middleCharge.speedMultiplier
      : this.moveSpeed;
    const desiredScale = desiredLength > 0.001 ? speed / desiredLength : 0;
    const targetVelocityX = desiredX * desiredScale;
    const targetVelocityY = desiredY * desiredScale;
    const steeringAlpha = 1 - Math.exp(-this.steeringLerpPerSec * deltaSeconds);

    body.velocity.x += (targetVelocityX - body.velocity.x) * steeringAlpha;
    body.velocity.y += (targetVelocityY - body.velocity.y) * steeringAlpha;

    this.tickSpin(deltaSeconds);
    if (this.spinRemainingRad === 0 && body.velocity.lengthSq() > 1) {
      this.setRotation(Math.atan2(body.velocity.y, body.velocity.x) + this.noseOffset);
    }

    this.syncHealthBar();
  }

  public consumeFireRequest(delta: number): boolean {
    if (!this.active || this.knockbackRemainingMs > 0) {
      return false;
    }

    this.fireCooldownMs -= delta;
    if (this.fireCooldownMs > 0) {
      return false;
    }

    this.fireCooldownMs = this.randomFireInterval();
    return true;
  }

  public takeDamage(damage: PlayerProjectileDamage): boolean {
    if (!this.active || this.hull <= 0) {
      return false;
    }

    const multiplier = this.definition?.incomingDamageMultipliers[damage.sourceId] ?? 1;
    const amount = damage.baseDamage * multiplier;
    this.hull = Math.max(0, this.hull - amount);
    this.syncHealthBar();
    return this.hull <= 0;
  }

  public takeHullDamage(amount: number): boolean {
    if (!this.active || this.hull <= 0 || amount <= 0) {
      return false;
    }

    this.hull = Math.max(0, this.hull - amount);
    this.syncHealthBar();
    return this.hull <= 0;
  }

  public applyKnockback(vx: number, vy: number, stunMs: number): void {
    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    body.setVelocity(vx, vy);
    this.knockbackRemainingMs = Math.max(0, stunMs);
    this.interruptCharge();
  }

  public applySpin(turns: number, durationMs: number): void {
    const durationSec = durationMs / 1000;
    if (turns === 0 || durationSec <= 0) {
      this.spinRemainingRad = 0;
      this.spinOmegaRadPerSec = 0;
      return;
    }

    this.spinRemainingRad = turns * Math.PI * 2;
    this.spinOmegaRadPerSec = this.spinRemainingRad / durationSec;
  }

  public tryLockRam(nowMs: number, cooldownMs: number): boolean {
    if (nowMs < this.ramLockedUntilMs) {
      return false;
    }

    this.ramLockedUntilMs = nowMs + cooldownMs;
    return true;
  }

  public getDefinition(): EnemyDef | null {
    return this.definition;
  }

  public getEnemyId(): EnemyId | null {
    return this.definition?.id ?? null;
  }

  public getFacingRotation(): number {
    return this.rotation - this.noseOffset;
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

    this.disableBody(true, true);
    this.healthBar.setVisible(false);
  }

  private tickSpin(deltaSeconds: number): void {
    if (this.spinRemainingRad === 0 || this.spinOmegaRadPerSec === 0) {
      return;
    }

    const step = this.spinOmegaRadPerSec * deltaSeconds;
    if (Math.abs(step) >= Math.abs(this.spinRemainingRad)) {
      this.setRotation(this.rotation + this.spinRemainingRad);
      this.spinRemainingRad = 0;
      this.spinOmegaRadPerSec = 0;
      return;
    }

    this.setRotation(this.rotation + step);
    this.spinRemainingRad -= step;
  }

  private clearRamState(): void {
    this.knockbackRemainingMs = 0;
    this.spinRemainingRad = 0;
    this.spinOmegaRadPerSec = 0;
    this.ramLockedUntilMs = 0;
    this.chargeCooldownMs = 0;
    this.chargeRemainingMs = 0;
  }

  private canCharge(): boolean {
    return this.definition?.id === EnemyIds.MiddleEnemy;
  }

  private tickCharge(delta: number): void {
    if (!this.canCharge()) {
      return;
    }

    if (this.chargeRemainingMs > 0) {
      this.chargeRemainingMs = Math.max(0, this.chargeRemainingMs - delta);
      if (this.chargeRemainingMs === 0) {
        this.chargeCooldownMs = this.randomChargeCooldown();
      }
      return;
    }

    this.chargeCooldownMs -= delta;
    if (this.chargeCooldownMs <= 0) {
      this.chargeRemainingMs = Phaser.Math.FloatBetween(
        ramming.middleCharge.durationMinMs,
        ramming.middleCharge.durationMaxMs,
      );
      this.chargeCooldownMs = 0;
    }
  }

  private interruptCharge(): void {
    if (this.chargeRemainingMs <= 0) {
      return;
    }

    this.chargeRemainingMs = 0;
    this.chargeCooldownMs = this.randomChargeCooldown();
  }

  private randomChargeCooldown(): number {
    return Phaser.Math.FloatBetween(
      ramming.middleCharge.cooldownMinMs,
      ramming.middleCharge.cooldownMaxMs,
    );
  }

  private syncHealthBar(): void {
    this.healthBar.positionAbove(this.x, this.y - this.displayHeight * 0.5);

    if (this.hull <= 0 || this.maxHull <= 0) {
      this.healthBar.setVisible(false);
      return;
    }

    this.healthBar.setRatio(this.hull / this.maxHull);
  }

  private randomFireInterval(): number {
    return Phaser.Math.FloatBetween(this.fireIntervalMinMs, this.fireIntervalMaxMs);
  }
}
