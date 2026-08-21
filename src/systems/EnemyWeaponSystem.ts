import Phaser from 'phaser';
import { stingDartBlaster } from '../data/enemyWeapons';
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
      maxSize: stingDartBlaster.poolSize,
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
    const projectile = this.projectiles.get(enemy.x, enemy.y);
    if (!(projectile instanceof EnemyProjectile)) {
      return;
    }

    const aimRotation = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player.x,
      this.player.y,
    );
    const rotation = aimRotation + Phaser.Math.FloatBetween(
      -stingDartBlaster.aimSpreadRadians,
      stingDartBlaster.aimSpreadRadians,
    );

    const spawned = projectile.fire(
      enemy.x,
      enemy.y,
      rotation,
      stingDartBlaster.projectileSpeed,
      stingDartBlaster.lifetimeMs,
      stingDartBlaster.damage,
      stingDartBlaster.scale,
    );
    if (spawned) {
      this.audioManager.playSfx(stingDartBlaster.soundKey);
    }
  }
}
