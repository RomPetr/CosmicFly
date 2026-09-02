import Phaser from 'phaser';
import { enemyWeapons, type EnemyWeaponDef } from '../data/enemyWeapons';
import { Enemy } from '../entities/Enemy';
import { EnemyProjectile } from '../entities/EnemyProjectile';
import type { Player } from '../entities/Player';
import type { AudioManager } from '../managers/AudioManager';

export class EnemyWeaponSystem {
  private readonly scene: Phaser.Scene;
  private readonly enemies: Phaser.Physics.Arcade.Group;
  private readonly player: Player;
  private readonly audioManager: AudioManager;
  private readonly projectiles: Phaser.Physics.Arcade.Group;
  private firingEnabled = true;

  public constructor(
    scene: Phaser.Scene,
    enemies: Phaser.Physics.Arcade.Group,
    player: Player,
    audioManager: AudioManager,
  ) {
    this.scene = scene;
    this.enemies = enemies;
    this.player = player;
    this.audioManager = audioManager;
    this.projectiles = scene.physics.add.group({
      classType: EnemyProjectile,
      maxSize: Object.values(enemyWeapons).reduce(
        (total, weapon) => total + weapon.poolSize,
        0,
      ),
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

    for (const child of this.enemies.getChildren()) {
      if (child instanceof Enemy && child.active && child.consumeFireRequest(delta)) {
        this.fireFrom(child);
      }
    }
  }

  public stop(): void {
    this.firingEnabled = false;
    this.deactivateProjectiles();
  }

  public clearForDock(): void {
    this.deactivateProjectiles();
  }

  private deactivateProjectiles(): void {
    if (!this.scene.sys.isActive()) {
      return;
    }

    for (const child of this.projectiles.getChildren()) {
      if (child instanceof EnemyProjectile) {
        child.deactivate();
      }
    }
  }

  private fireFrom(enemy: Enemy): void {
    const enemyDef = enemy.getDefinition();
    if (enemyDef === null) {
      return;
    }

    const weapon = enemyWeapons[enemyDef.weaponId];
    const facingRotation = enemy.getFacingRotation();
    let volleySpawned = false;

    for (const muzzle of weapon.muzzleOffsets) {
      if (this.fireFromMuzzle(enemy, weapon, facingRotation, muzzle.forward, muzzle.lateral)) {
        volleySpawned = true;
      }
    }

    if (volleySpawned) {
      this.audioManager.playSfx(weapon.soundKey);
    }
  }

  private fireFromMuzzle(
    enemy: Enemy,
    weapon: EnemyWeaponDef,
    facingRotation: number,
    forwardOffset: number,
    lateralOffset: number,
  ): boolean {
    const forwardX = Math.cos(facingRotation);
    const forwardY = Math.sin(facingRotation);
    const muzzleX = enemy.x + forwardX * forwardOffset - forwardY * lateralOffset;
    const muzzleY = enemy.y + forwardY * forwardOffset + forwardX * lateralOffset;
    const projectile = this.projectiles.get(muzzleX, muzzleY);
    if (!(projectile instanceof EnemyProjectile)) {
      return false;
    }

    const aimRotation = Phaser.Math.Angle.Between(
      muzzleX,
      muzzleY,
      this.player.x,
      this.player.y,
    );
    const rotation = aimRotation + Phaser.Math.FloatBetween(
      -weapon.aimSpreadRadians,
      weapon.aimSpreadRadians,
    );

    return projectile.fire(
      muzzleX,
      muzzleY,
      rotation,
      weapon.projectileSpeed,
      weapon.lifetimeMs,
      weapon.damage,
      weapon.rotationJitterAmplitude,
      weapon.textureKey,
      weapon.scale,
    );
  }
}
