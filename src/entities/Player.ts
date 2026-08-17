import Phaser from 'phaser';
import { SkinTints, TextureKeys } from '../config/assetKeys';
import { physicsConfig } from '../config/physicsConfig';
import { starterShip } from '../data/ships';
import type { InputManager } from '../managers/InputManager';
import { gameState } from '../state/GameState';

const MUZZLE_OFFSET_PX = 26;

export class Player {
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly inputManager: InputManager;

  public constructor(scene: Phaser.Scene, x: number, y: number, inputManager: InputManager) {
    this.inputManager = inputManager;

    if (!scene.textures.exists(TextureKeys.PlayerShip)) {
      throw new Error(`Texture "${TextureKeys.PlayerShip}" is not registered`);
    }

    this.sprite = scene.physics.add.sprite(x, y, TextureKeys.PlayerShip);
    this.sprite.setOrigin(0.5, 0.5);

    const body = this.sprite.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error('Player requires a dynamic Arcade Physics body');
    }

    const radius = starterShip.colliderRadius;
    const offset = this.sprite.width / 2 - radius;
    this.sprite.setCircle(radius, offset, offset);
    this.sprite.setDrag(starterShip.drag);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(physicsConfig.edgeBounce);
    body.setMaxSpeed(starterShip.maxSpeed);

    this.sprite.setTint(SkinTints[gameState.selectedSkinId]);
  }

  public update(): void {
    const move = this.inputManager.getMoveVector();
    this.sprite.setAcceleration(
      move.x * starterShip.acceleration,
      move.y * starterShip.acceleration,
    );

    const aim = this.inputManager.getAimPosition();
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, aim.x, aim.y);
    this.sprite.setRotation(angle);
  }

  public get x(): number {
    return this.sprite.x;
  }

  public get y(): number {
    return this.sprite.y;
  }

  public get rotation(): number {
    return this.sprite.rotation;
  }

  public getMuzzlePosition(out: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    return out.set(
      this.sprite.x + Math.cos(this.sprite.rotation) * MUZZLE_OFFSET_PX,
      this.sprite.y + Math.sin(this.sprite.rotation) * MUZZLE_OFFSET_PX,
    );
  }
}
