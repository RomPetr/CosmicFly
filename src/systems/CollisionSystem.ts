import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';

type PhysicsObject = Parameters<Phaser.Types.Physics.Arcade.ArcadePhysicsCallback>[0];

export class CollisionSystem {
  private readonly scene: Phaser.Scene;
  private readonly onEnemyKilled: (enemy: Enemy) => void;
  private readonly collider: Phaser.Physics.Arcade.Collider;
  private enabled: boolean;

  public constructor(
    scene: Phaser.Scene,
    projectiles: Phaser.Physics.Arcade.Group,
    enemies: Phaser.Physics.Arcade.Group,
    onEnemyKilled: (enemy: Enemy) => void,
  ) {
    this.scene = scene;
    this.onEnemyKilled = onEnemyKilled;
    this.enabled = true;
    this.collider = scene.physics.add.overlap(
      projectiles,
      enemies,
      this.handleOverlap,
      this.canCollide,
      this,
    );
  }

  public stop(): void {
    this.enabled = false;

    if (!this.scene.sys.isActive() || !this.collider.active) {
      return;
    }

    this.collider.destroy();
  }

  private canCollide(object1: PhysicsObject, object2: PhysicsObject): boolean {
    if (!this.enabled) {
      return false;
    }

    const projectile = this.asProjectile(object1) ?? this.asProjectile(object2);
    const enemy = this.asEnemy(object1) ?? this.asEnemy(object2);
    return (
      projectile !== undefined && enemy !== undefined && projectile.active && enemy.active
    );
  }

  private handleOverlap(object1: PhysicsObject, object2: PhysicsObject): void {
    const projectile = this.asProjectile(object1) ?? this.asProjectile(object2);
    const enemy = this.asEnemy(object1) ?? this.asEnemy(object2);
    if (projectile === undefined || enemy === undefined) {
      return;
    }

    if (!projectile.active || !enemy.active) {
      return;
    }

    const damage = projectile.getDamage();
    projectile.deactivate();

    if (enemy.takeDamage(damage)) {
      this.onEnemyKilled(enemy);
    }
  }

  private asProjectile(object: PhysicsObject): Projectile | undefined {
    const gameObject = this.asGameObject(object);
    return gameObject instanceof Projectile ? gameObject : undefined;
  }

  private asEnemy(object: PhysicsObject): Enemy | undefined {
    const gameObject = this.asGameObject(object);
    return gameObject instanceof Enemy ? gameObject : undefined;
  }

  private asGameObject(object: PhysicsObject): Phaser.GameObjects.GameObject | undefined {
    if (object instanceof Phaser.GameObjects.GameObject) {
      return object;
    }

    if (object instanceof Phaser.Physics.Arcade.Body || object instanceof Phaser.Physics.Arcade.StaticBody) {
      return object.gameObject;
    }

    return undefined;
  }
}
