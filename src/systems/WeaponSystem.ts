import Phaser from 'phaser';
import { starterShip } from '../data/ships';
import { weapons, type WeaponDef } from '../data/weapons';
import type { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import type { InputManager } from '../managers/InputManager';
import { gameState } from '../state/GameState';

const PROJECTILE_POOL_SIZE = 40;

export class WeaponSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly inputManager: InputManager;
  private readonly projectiles: Phaser.Physics.Arcade.Group;
  private readonly weapon: WeaponDef;
  private readonly muzzlePosition: Phaser.Math.Vector2;
  private cooldownRemainingMs: number;
  private firingEnabled: boolean;

  public constructor(scene: Phaser.Scene, player: Player, inputManager: InputManager) {
    this.scene = scene;
    this.player = player;
    this.inputManager = inputManager;
    this.weapon = weapons[starterShip.weaponId];
    this.muzzlePosition = new Phaser.Math.Vector2();
    this.cooldownRemainingMs = 0;
    this.firingEnabled = true;

    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      maxSize: PROJECTILE_POOL_SIZE,
      runChildUpdate: false,
      allowGravity: false,
    });
  }

  public update(delta: number): void {
    if (!this.firingEnabled) {
      return;
    }

    this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - delta);

    if (!this.canFire()) {
      return;
    }

    this.spawnVolley();
    this.cooldownRemainingMs = this.weapon.intervalMs;
  }

  public stop(): void {
    this.firingEnabled = false;

    if (!this.scene.sys.isActive()) {
      return;
    }

    for (const child of this.projectiles.getChildren()) {
      if (child instanceof Projectile) {
        child.deactivate();
      }
    }
  }

  private canFire(): boolean {
    if (!this.firingEnabled || this.cooldownRemainingMs > 0) {
      return false;
    }

    if (!this.scene.game.hasFocus) {
      return false;
    }

    return gameState.autoFire || this.inputManager.isFiring();
  }

  private spawnVolley(): void {
    const aim = this.inputManager.getAimPosition();
    const muzzle = this.player.getMuzzlePosition(this.muzzlePosition);
    const rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, aim.x, aim.y);

    for (let index = 0; index < this.weapon.projectileCount; index += 1) {
      const bolt = this.projectiles.get(muzzle.x, muzzle.y);
      if (!(bolt instanceof Projectile)) {
        return;
      }

      bolt.fire(
        muzzle.x,
        muzzle.y,
        rotation,
        this.weapon.projectileSpeed,
        this.weapon.lifetimeMs,
        this.weapon.damage,
      );
    }
  }
}
