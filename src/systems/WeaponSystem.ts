import Phaser from 'phaser';
import { starterShip } from '../data/ships';
import { weapons, type WeaponDef } from '../data/weapons';
import type { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import type { AudioManager } from '../managers/AudioManager';
import type { InputManager } from '../managers/InputManager';
import { LaserHeatModel } from './LaserHeatModel';

const PROJECTILE_POOL_SIZE = 40;

export type LaserHeatState = {
  readonly heat: number;
  readonly heatRatio: number;
  readonly lockout: boolean;
  readonly fillColor: number;
  readonly canFirePulse: boolean;
};

export class WeaponSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly inputManager: InputManager;
  private readonly audioManager: AudioManager;
  private readonly projectiles: Phaser.Physics.Arcade.Group;
  private readonly pulseWeapon: WeaponDef;
  private readonly missileWeapon: WeaponDef;
  private readonly heatModel: LaserHeatModel;
  private readonly muzzlePosition: Phaser.Math.Vector2;
  private pulseCooldownRemainingMs: number;
  private missileCooldownRemainingMs: number;
  private firingEnabled: boolean;

  public constructor(
    scene: Phaser.Scene,
    player: Player,
    inputManager: InputManager,
    audioManager: AudioManager,
  ) {
    this.scene = scene;
    this.player = player;
    this.inputManager = inputManager;
    this.audioManager = audioManager;
    this.pulseWeapon = weapons[starterShip.pulseWeaponId];
    this.missileWeapon = weapons[starterShip.missileWeaponId];
    this.heatModel = new LaserHeatModel();
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

  public getHeatState(): LaserHeatState {
    return {
      heat: this.heatModel.getHeat(),
      heatRatio: this.heatModel.getHeatRatio(),
      lockout: this.heatModel.isLockout(),
      fillColor: this.heatModel.getFillColor(),
      canFirePulse: this.heatModel.canFirePulse(),
    };
  }

  public update(delta: number): void {
    if (!this.firingEnabled) {
      return;
    }

    this.heatModel.update(delta, this.inputManager.isFiringPulse());

    this.pulseCooldownRemainingMs = Math.max(0, this.pulseCooldownRemainingMs - delta);
    this.missileCooldownRemainingMs = Math.max(0, this.missileCooldownRemainingMs - delta);

    if (this.canFirePulse()) {
      this.spawnVolley(this.pulseWeapon);
      this.pulseCooldownRemainingMs = this.heatModel.getPulseIntervalMs();
    }

    if (this.canFireMissile()) {
      this.spawnVolley(this.missileWeapon);
      this.missileCooldownRemainingMs = this.missileWeapon.intervalMs;
    }

    for (const child of this.projectiles.getChildren()) {
      if (child instanceof Projectile) {
        child.syncSparks(delta);
      }
    }
  }

  public stop(): void {
    this.firingEnabled = false;
    this.heatModel.reset();
    this.deactivateProjectiles();
  }

  public clearForDock(): void {
    this.heatModel.reset();
    this.pulseCooldownRemainingMs = 0;
    this.missileCooldownRemainingMs = 0;
    this.deactivateProjectiles();
  }

  private deactivateProjectiles(): void {
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
      this.inputManager.isFiringPulse() &&
      this.heatModel.canFirePulse()
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
    let spawned = false;

    for (let index = 0; index < weapon.projectileCount; index += 1) {
      const bolt = this.projectiles.get(muzzle.x, muzzle.y);
      if (!(bolt instanceof Projectile)) {
        break;
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
      spawned = true;
    }

    if (spawned) {
      this.audioManager.playSfx(weapon.soundKey);
    }
  }
}
