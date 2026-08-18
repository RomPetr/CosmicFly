import Phaser from 'phaser';
import { physicsConfig } from '../config/physicsConfig';
import { starterShip } from '../data/ships';
import type { InputManager } from '../managers/InputManager';

export class Player {
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly inputManager: InputManager;
  private facingAngle: number;

  public constructor(scene: Phaser.Scene, x: number, y: number, inputManager: InputManager) {
    this.inputManager = inputManager;
    this.facingAngle = 0;

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
