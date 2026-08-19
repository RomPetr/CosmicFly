import Phaser from 'phaser';
import { starterShip } from '../data/ships';
import { weapons, type WeaponDef } from '../data/weapons';
import type { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import type { InputManager } from '../managers/InputManager';

const PROJECTILE_POOL_SIZE = 40;

export class WeaponSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly inputManager: InputManager;
  private readonly projectiles: Phaser.Physics.Arcade.Group;
  private readonly pulseWeapon: WeaponDef;
  private readonly missileWeapon: WeaponDef;
  private readonly muzzlePosition: Phaser.Math.Vector2;
  private pulseCooldownRemainingMs: number;
  private missileCooldownRemainingMs: number;
  private firingEnabled: boolean;

  public constructor(scene: Phaser.Scene, player: Player, inputManager: InputManager) {
    this.scene = scene;
    this.player = player;
    this.inputManager = inputManager;
    this.pulseWeapon = weapons[starterShip.pulseWeaponId];
    this.missileWeapon = weapons[starterShip.missileWeaponId];
    this.muzzlePosition = new Phaser.Math.Vector2();
    this.pulseCooldownRemainingMs = 0;
    this.missileCooldownRemainingMs = 0;
    this.firingEnabled = true;

    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      maxSize: PROJECTILE_POOL_SIZE,
      runChildUpdate: false,
      allowGravity: false,
    });
  }

  public getProjectiles(): Phaser.Physics.Arcade.Group {
    return this.projectiles;
  }

  public update(delta: number): void {
    if (!this.firingEnabled) {
      return;
    }

    this.pulseCooldownRemainingMs = Math.max(0, this.pulseCooldownRemainingMs - delta);
    this.missileCooldownRemainingMs = Math.max(0, this.missileCooldownRemainingMs - delta);

    if (this.canFirePulse()) {
      this.spawnVolley(this.pulseWeapon);
      this.pulseCooldownRemainingMs = this.pulseWeapon.intervalMs;
    }

    if (this.canFireMissile()) {
      this.spawnVolley(this.missileWeapon);
      this.missileCooldownRemainingMs = this.missileWeapon.intervalMs;
    }
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

  private canFirePulse(): boolean {
    return (
      this.firingEnabled &&
      this.pulseCooldownRemainingMs <= 0 &&
      this.inputManager.isFiringPulse()
    );
  }

  private canFireMissile(): boolean {
    return (
      this.firingEnabled &&
      this.missileCooldownRemainingMs <= 0 &&
      this.inputManager.isFiringMissile()
    );
  }

  private spawnVolley(weapon: WeaponDef): void {
    const aim = this.inputManager.getAimPosition();
    const muzzle = this.player.getMuzzlePosition(this.muzzlePosition);
    const rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, aim.x, aim.y);

    for (let index = 0; index < weapon.projectileCount; index += 1) {
      const bolt = this.projectiles.get(muzzle.x, muzzle.y);
      if (!(bolt instanceof Projectile)) {
        return;
      }

      bolt.fire(
        muzzle.x,
        muzzle.y,
        rotation,
        weapon.projectileSpeed,
        weapon.lifetimeMs,
        weapon.damage,
        weapon.textureKey,
        weapon.scale,
        weapon.angleOffset,
      );
    }
  }
}
