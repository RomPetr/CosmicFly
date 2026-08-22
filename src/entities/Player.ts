import Phaser from 'phaser';
import { physicsConfig } from '../config/physicsConfig';
import { starterShip } from '../data/ships';
import type { InputManager } from '../managers/InputManager';

const HIT_FLASH_MS = 90;
const HIT_FLASH_ALPHA = 0.4;
const HIT_FEEDBACK_MS = 500;
const HIT_ROTATION_AMPLITUDE = 0.07;

export type PlayerHitResult = {
  readonly applied: boolean;
  readonly killed: boolean;
};

export class Player {
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly engineFlame: Phaser.GameObjects.Image;
  private readonly inputManager: InputManager;
  private facingAngle: number;
  private hull: number;
  private shield: number;
  private invulnerableUntilMs: number;
  private flashUntilMs: number;
  private hitFeedbackStartedMs: number;
  private hitFeedbackUntilMs: number;
  private hitRotationAmplitude: number;

  public constructor(scene: Phaser.Scene, x: number, y: number, inputManager: InputManager) {
    this.inputManager = inputManager;
    this.facingAngle = 0;
    this.hull = starterShip.maxHull;
    this.shield = starterShip.maxShield;
    this.invulnerableUntilMs = 0;
    this.flashUntilMs = 0;
    this.hitFeedbackStartedMs = 0;
    this.hitFeedbackUntilMs = 0;
    this.hitRotationAmplitude = HIT_ROTATION_AMPLITUDE;

    if (!scene.textures.exists(starterShip.textureKey)) {
      throw new Error(`Texture "${starterShip.textureKey}" is not registered`);
    }
    if (!scene.textures.exists(starterShip.engineFlame.textureKey)) {
      throw new Error(`Texture "${starterShip.engineFlame.textureKey}" is not registered`);
    }

    this.engineFlame = scene.add.image(x, y, starterShip.engineFlame.textureKey);
    this.engineFlame
      .setOrigin(0.5, 0.5)
      .setScale(starterShip.engineFlame.scale)
      .setDepth(starterShip.engineFlame.depth)
      .setVisible(false);
    this.sprite = scene.physics.add.sprite(x, y, starterShip.textureKey);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(starterShip.scale);
    this.sprite.clearTint();

    const body = this.sprite.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error('Player requires a dynamic Arcade Physics body');
    }

    const unscaledRadius = starterShip.colliderRadius / starterShip.scale;
    const offsetX = this.sprite.width / 2 - unscaledRadius;
    const offsetY = this.sprite.height / 2 - unscaledRadius;
    this.sprite.setCircle(unscaledRadius, offsetX, offsetY);
    this.sprite.setDrag(starterShip.drag);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(physicsConfig.edgeBounce);
    body.setMaxSpeed(starterShip.maxSpeed);
  }

  public update(): void {
    const move = this.inputManager.getMoveVector();
    this.sprite.setAcceleration(
      move.x * starterShip.acceleration,
      move.y * starterShip.acceleration,
    );

    const aim = this.inputManager.getAimPosition();
    this.facingAngle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, aim.x, aim.y);
    const now = this.sprite.scene.time.now;
    const baseRotation = this.facingAngle + starterShip.angleOffset;

    if (now < this.hitFeedbackUntilMs) {
      const elapsedMs = now - this.hitFeedbackStartedMs;
      const decay = (this.hitFeedbackUntilMs - now) / HIT_FEEDBACK_MS;
      const rotationJitter = Math.sin(elapsedMs * 0.09) * this.hitRotationAmplitude * decay;
      this.sprite.setRotation(baseRotation + rotationJitter);
    } else {
      this.sprite.setRotation(baseRotation);
      if (this.hitFeedbackUntilMs > 0) {
        this.hitFeedbackUntilMs = 0;
      }
    }

    if (this.sprite.alpha < 1 && now >= this.flashUntilMs) {
      this.sprite.setAlpha(1);
    }

    if (this.engineFlame.visible) {
      this.syncEngineFlame();
    }
  }

  public setEngineThrustActive(active: boolean): void {
    this.engineFlame.setVisible(active);
    if (active) {
      this.syncEngineFlame();
    }
  }

  public takeHit(
    amount: number,
    rotationJitterAmplitude = HIT_ROTATION_AMPLITUDE,
  ): PlayerHitResult {
    const now = this.sprite.scene.time.now;
    if (this.hull <= 0) {
      return { applied: false, killed: true };
    }

    if (now < this.invulnerableUntilMs || amount <= 0) {
      return { applied: false, killed: false };
    }

    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }

    if (remaining > 0) {
      this.hull = Math.max(0, this.hull - remaining);
    }

    this.invulnerableUntilMs = now + starterShip.hitIFramesMs;
    this.flashUntilMs = now + HIT_FLASH_MS;
    this.hitFeedbackStartedMs = now;
    this.hitFeedbackUntilMs = now + HIT_FEEDBACK_MS;
    this.hitRotationAmplitude = Math.max(0, rotationJitterAmplitude);
    this.sprite.setAlpha(HIT_FLASH_ALPHA);

    return { applied: true, killed: this.hull <= 0 };
  }

  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  public getHull(): number {
    return this.hull;
  }

  public getShield(): number {
    return this.shield;
  }

  public get x(): number {
    return this.sprite.x;
  }

  public get y(): number {
    return this.sprite.y;
  }

  public get rotation(): number {
    return this.facingAngle;
  }

  public getMuzzlePosition(out: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    return out.set(
      this.sprite.x + Math.cos(this.facingAngle) * starterShip.muzzleOffsetPx,
      this.sprite.y + Math.sin(this.facingAngle) * starterShip.muzzleOffsetPx,
    );
  }

  private syncEngineFlame(): void {
    this.engineFlame
      .setPosition(
        this.sprite.x - Math.cos(this.facingAngle) * starterShip.engineFlame.offsetPx,
        this.sprite.y - Math.sin(this.facingAngle) * starterShip.engineFlame.offsetPx,
      )
      .setRotation(this.sprite.rotation);
  }
}
