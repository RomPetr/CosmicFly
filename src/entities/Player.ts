import Phaser from 'phaser';
import { physicsConfig } from '../config/physicsConfig';
import { starterShip } from '../data/ships';
import type { InputManager } from '../managers/InputManager';

const HIT_FLASH_MS = 90;
const HIT_FLASH_ALPHA = 0.4;

export class Player {
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly inputManager: InputManager;
  private facingAngle: number;
  private hull: number;
  private shield: number;
  private invulnerableUntilMs: number;
  private flashUntilMs: number;

  public constructor(scene: Phaser.Scene, x: number, y: number, inputManager: InputManager) {
    this.inputManager = inputManager;
    this.facingAngle = 0;
    this.hull = starterShip.maxHull;
    this.shield = starterShip.maxShield;
    this.invulnerableUntilMs = 0;
    this.flashUntilMs = 0;

    if (!scene.textures.exists(starterShip.textureKey)) {
      throw new Error(`Texture "${starterShip.textureKey}" is not registered`);
    }

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
    this.sprite.setRotation(this.facingAngle + starterShip.angleOffset);

    if (this.sprite.alpha < 1 && this.sprite.scene.time.now >= this.flashUntilMs) {
      this.sprite.setAlpha(1);
    }
  }

  public takeHit(amount: number): boolean {
    const now = this.sprite.scene.time.now;
    if (this.hull <= 0) {
      return true;
    }

    if (now < this.invulnerableUntilMs || amount <= 0) {
      return false;
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
    this.sprite.setAlpha(HIT_FLASH_ALPHA);

    return this.hull <= 0;
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
}
