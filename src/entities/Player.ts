import Phaser from 'phaser';
import { physicsConfig } from '../config/physicsConfig';
import { flightConfig } from '../data/flight';
import { starterShip } from '../data/ships';
import type { InputManager } from '../managers/InputManager';
import { HealthBar, playerHealthBarStyle } from '../ui/HealthBar';

const HIT_FLASH_MS = 90;
const HIT_FLASH_ALPHA = 0.4;
const HIT_FEEDBACK_MS = 500;
const HIT_ROTATION_AMPLITUDE = 0.07;
const AIM_DEADZONE_PX = 10;

export type PlayerHitResult = {
  readonly applied: boolean;
  readonly killed: boolean;
};

export type BlinkHop = {
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  readonly rotation: number;
  readonly scale: number;
};

export class Player {
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly engineFlame: Phaser.GameObjects.Image;
  private readonly reverseFlameLeft: Phaser.GameObjects.Image;
  private readonly reverseFlameRight: Phaser.GameObjects.Image;
  private readonly inputManager: InputManager;
  private readonly healthBar: HealthBar;
  private facingAngle: number;
  private health: number;
  private invulnerableUntilMs: number;
  private flashUntilMs: number;
  private hitFeedbackStartedMs: number;
  private hitFeedbackUntilMs: number;
  private hitRotationAmplitude: number;
  private blinkReadyAtMs: number;

  public constructor(scene: Phaser.Scene, x: number, y: number, inputManager: InputManager) {
    this.inputManager = inputManager;
    this.facingAngle = flightConfig.northAngleRad;
    this.health = starterShip.maxHealth;
    this.invulnerableUntilMs = 0;
    this.flashUntilMs = 0;
    this.hitFeedbackStartedMs = 0;
    this.hitFeedbackUntilMs = 0;
    this.hitRotationAmplitude = HIT_ROTATION_AMPLITUDE;
    this.blinkReadyAtMs = 0;

    if (!scene.textures.exists(starterShip.textureKey)) {
      throw new Error(`Texture "${starterShip.textureKey}" is not registered`);
    }
    if (!scene.textures.exists(starterShip.engineFlame.textureKey)) {
      throw new Error(`Texture "${starterShip.engineFlame.textureKey}" is not registered`);
    }

    this.engineFlame = this.createFlame(scene, x, y, starterShip.engineFlame.scale);
    this.reverseFlameLeft = this.createFlame(scene, x, y, starterShip.reverseFlame.scale);
    this.reverseFlameRight = this.createFlame(scene, x, y, starterShip.reverseFlame.scale);

    this.sprite = scene.physics.add.sprite(x, y, starterShip.textureKey);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(starterShip.scale);
    this.sprite.setRotation(this.facingAngle + starterShip.angleOffset);
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

    this.healthBar = new HealthBar(scene, playerHealthBarStyle);
    this.healthBar.setVisible(true);
    this.syncHealthBar();
  }

  public update(): void {
    const move = this.inputManager.getMoveVector();
    this.sprite.setAcceleration(
      move.x * starterShip.acceleration,
      move.y * starterShip.acceleration,
    );

    const aim = this.inputManager.getAimPosition();
    if (
      Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, aim.x, aim.y) > AIM_DEADZONE_PX
    ) {
      this.facingAngle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, aim.x, aim.y);
    }

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
    if (this.reverseFlameLeft.visible) {
      this.syncReverseFlames();
    }

    this.syncHealthBar();
  }

  public setEngineThrustActive(active: boolean): void {
    this.engineFlame.setVisible(active);
    if (active) {
      this.syncEngineFlame();
    }
  }

  public setReverseThrustActive(active: boolean): void {
    this.reverseFlameLeft.setVisible(active);
    this.reverseFlameRight.setVisible(active);
    if (active) {
      this.syncReverseFlames();
    }
  }

  public tryBlink(): BlinkHop | null {
    const now = this.sprite.scene.time.now;
    if (now < this.blinkReadyAtMs || this.health <= 0 || !this.sprite.visible) {
      return null;
    }

    const distance = this.sprite.displayHeight * starterShip.blink.lengthMultiplier;
    const toX = this.sprite.x + Math.cos(this.facingAngle) * distance;
    const toY = this.sprite.y + Math.sin(this.facingAngle) * distance;
    const { width, height } = this.sprite.scene.scale;
    const pad = starterShip.colliderRadius;
    const clampedX = Phaser.Math.Clamp(toX, pad, width - pad);
    const clampedY = Phaser.Math.Clamp(toY, pad, height - pad);

    if (
      Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, clampedX, clampedY) <
      starterShip.blink.minTravelPx
    ) {
      return null;
    }

    const hop: BlinkHop = {
      fromX: this.sprite.x,
      fromY: this.sprite.y,
      toX: clampedX,
      toY: clampedY,
      rotation: this.sprite.rotation,
      scale: this.sprite.scaleX,
    };

    const body = this.sprite.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      this.sprite.setAcceleration(0, 0);
      body.reset(clampedX, clampedY);
    } else {
      this.sprite.setPosition(clampedX, clampedY);
    }

    this.blinkReadyAtMs = now + starterShip.blink.cooldownMs;
    this.invulnerableUntilMs = Math.max(this.invulnerableUntilMs, now + starterShip.blink.iFramesMs);
    this.flashUntilMs = now + HIT_FLASH_MS;
    this.sprite.setAlpha(HIT_FLASH_ALPHA);
    this.syncEngineFlame();
    this.syncReverseFlames();
    this.syncHealthBar();
    return hop;
  }

  public takeHit(
    amount: number,
    rotationJitterAmplitude = HIT_ROTATION_AMPLITUDE,
  ): PlayerHitResult {
    const now = this.sprite.scene.time.now;
    if (this.health <= 0) {
      return { applied: false, killed: true };
    }

    if (now < this.invulnerableUntilMs || amount <= 0) {
      return { applied: false, killed: false };
    }

    this.health = Math.max(0, this.health - amount);
    this.syncHealthBar();

    this.invulnerableUntilMs = now + starterShip.hitIFramesMs;
    this.flashUntilMs = now + HIT_FLASH_MS;
    this.hitFeedbackStartedMs = now;
    this.hitFeedbackUntilMs = now + HIT_FEEDBACK_MS;
    this.hitRotationAmplitude = Math.max(0, rotationJitterAmplitude);
    this.sprite.setAlpha(HIT_FLASH_ALPHA);

    return { applied: true, killed: this.health <= 0 };
  }

  /** Hides the ship and disables its body; re-enabling resets the body in place. */
  public setDormant(dormant: boolean): void {
    const body = this.sprite.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      if (dormant) {
        this.sprite.setAcceleration(0, 0);
        body.stop();
        body.enable = false;
      } else {
        body.reset(this.sprite.x, this.sprite.y);
        body.enable = true;
      }
    }

    this.sprite.setVisible(!dormant);
    this.healthBar.setVisible(!dormant);
    if (dormant) {
      this.engineFlame.setVisible(false);
      this.reverseFlameLeft.setVisible(false);
      this.reverseFlameRight.setVisible(false);
    } else {
      this.syncHealthBar();
    }
  }

  public hideForDestruction(): void {
    this.sprite.setVisible(false);
    this.engineFlame.setVisible(false);
    this.reverseFlameLeft.setVisible(false);
    this.reverseFlameRight.setVisible(false);
    this.healthBar.setVisible(false);

    const body = this.sprite.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.stop();
      this.sprite.setAcceleration(0, 0);
    }
  }

  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  public getHealth(): number {
    return this.health;
  }

  public getHealthPercent(): number {
    return Math.ceil((this.health / starterShip.maxHealth) * 100);
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

  private syncHealthBar(): void {
    this.healthBar.positionAbove(this.sprite.x, this.sprite.y - this.sprite.displayHeight * 0.5);
    this.healthBar.setRatio(this.health / starterShip.maxHealth);
  }

  private createFlame(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
  ): Phaser.GameObjects.Image {
    return scene.add
      .image(x, y, starterShip.engineFlame.textureKey)
      .setOrigin(0.5, 0.5)
      .setScale(scale)
      .setDepth(starterShip.engineFlame.depth)
      .setVisible(false);
  }

  private syncEngineFlame(): void {
    this.engineFlame
      .setPosition(
        this.sprite.x - Math.cos(this.facingAngle) * starterShip.engineFlame.offsetPx,
        this.sprite.y - Math.sin(this.facingAngle) * starterShip.engineFlame.offsetPx,
      )
      .setRotation(this.sprite.rotation);
  }

  private syncReverseFlames(): void {
    const { offsetPx, spreadPx, splayRad } = starterShip.reverseFlame;
    const noseX = this.sprite.x + Math.cos(this.facingAngle) * offsetPx;
    const noseY = this.sprite.y + Math.sin(this.facingAngle) * offsetPx;
    const perpX = -Math.sin(this.facingAngle);
    const perpY = Math.cos(this.facingAngle);
    // Reverse jets point along the nose; +π flips the rear-exhaust sprite forward.
    const forwardRotation = this.sprite.rotation + Math.PI;

    this.reverseFlameLeft
      .setPosition(noseX + perpX * spreadPx, noseY + perpY * spreadPx)
      .setRotation(forwardRotation - splayRad);
    this.reverseFlameRight
      .setPosition(noseX - perpX * spreadPx, noseY - perpY * spreadPx)
      .setRotation(forwardRotation + splayRad);
  }
}
