import Phaser from 'phaser';
import { starterShip } from '../data/ships';
import { EnemyIds, type EnemyDef } from '../data/enemies';
import {
  bubbleSmallEnemyRamDamage,
  enemyRamDamage,
  playerRamDamage,
  ramming,
} from '../data/ramming';
import { Enemy } from '../entities/Enemy';
import { EnemyProjectile } from '../entities/EnemyProjectile';
import { Meteor } from '../entities/Meteor';
import type { Player, PlayerHitResult } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

type PhysicsObject = Parameters<Phaser.Types.Physics.Arcade.ArcadePhysicsCallback>[0];

const ZERO_LENGTH = 0.001;

export class CollisionSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly onEnemyKilled: (enemy: Enemy) => void;
  private readonly onMeteorHit: (meteor: Meteor, destroyed: boolean) => void;
  private readonly onPlayerHit: (result: PlayerHitResult) => void;
  private readonly onShipRam: () => void;
  private readonly colliders: Phaser.Physics.Arcade.Collider[];
  private enabled: boolean;

  public constructor(
    scene: Phaser.Scene,
    projectiles: Phaser.Physics.Arcade.Group,
    enemyProjectiles: Phaser.Physics.Arcade.Group,
    enemies: Phaser.Physics.Arcade.Group,
    meteors: Phaser.Physics.Arcade.Group,
    player: Player,
    onEnemyKilled: (enemy: Enemy) => void,
    onMeteorHit: (meteor: Meteor, destroyed: boolean) => void,
    onPlayerHit: (result: PlayerHitResult) => void,
    onShipRam: () => void,
  ) {
    this.scene = scene;
    this.player = player;
    this.onEnemyKilled = onEnemyKilled;
    this.onMeteorHit = onMeteorHit;
    this.onPlayerHit = onPlayerHit;
    this.onShipRam = onShipRam;
    this.enabled = true;
    this.colliders = [
      scene.physics.add.overlap(
        projectiles,
        enemies,
        this.handleProjectileEnemy,
        this.canProjectileHitEnemy,
        this,
      ),
      scene.physics.add.overlap(
        projectiles,
        meteors,
        this.handleProjectileMeteor,
        this.canProjectileHitMeteor,
        this,
      ),
      scene.physics.add.overlap(
        player.getSprite(),
        meteors,
        this.handlePlayerMeteor,
        this.canPlayerHitMeteor,
        this,
      ),
      scene.physics.add.overlap(
        enemyProjectiles,
        player.getSprite(),
        this.handleEnemyProjectilePlayer,
        this.canEnemyProjectileHitPlayer,
        this,
      ),
      scene.physics.add.overlap(
        player.getSprite(),
        enemies,
        this.handlePlayerEnemy,
        this.canPlayerRamEnemy,
        this,
      ),
    ];
  }

  public stop(): void {
    this.enabled = false;

    if (!this.scene.sys.isActive()) {
      this.colliders.length = 0;
      return;
    }

    for (const collider of this.colliders) {
      if (collider.active) {
        collider.destroy();
      }
    }

    this.colliders.length = 0;
  }

  private canProjectileHitEnemy(object1: PhysicsObject, object2: PhysicsObject): boolean {
    if (!this.enabled) {
      return false;
    }

    const projectile = this.asProjectile(object1) ?? this.asProjectile(object2);
    const enemy = this.asEnemy(object1) ?? this.asEnemy(object2);
    return (
      projectile !== undefined && enemy !== undefined && projectile.active && enemy.active
    );
  }

  private handleProjectileEnemy(object1: PhysicsObject, object2: PhysicsObject): void {
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

  private canProjectileHitMeteor(object1: PhysicsObject, object2: PhysicsObject): boolean {
    if (!this.enabled) {
      return false;
    }

    const projectile = this.asProjectile(object1) ?? this.asProjectile(object2);
    const meteor = this.asMeteor(object1) ?? this.asMeteor(object2);
    return (
      projectile !== undefined && meteor !== undefined && projectile.active && meteor.active
    );
  }

  private handleProjectileMeteor(object1: PhysicsObject, object2: PhysicsObject): void {
    const projectile = this.asProjectile(object1) ?? this.asProjectile(object2);
    const meteor = this.asMeteor(object1) ?? this.asMeteor(object2);
    if (projectile === undefined || meteor === undefined) {
      return;
    }

    if (!projectile.active || !meteor.active) {
      return;
    }

    const damage = projectile.getDamage();
    projectile.deactivate();

    const destroyed = meteor.takeDamage(damage.baseDamage);
    this.onMeteorHit(meteor, destroyed);

    if (destroyed) {
      meteor.deactivate();
    }
  }

  private canPlayerHitMeteor(_object1: PhysicsObject, object2: PhysicsObject): boolean {
    if (!this.enabled || this.player.getHealth() <= 0) {
      return false;
    }

    const meteor = this.asMeteor(object2) ?? this.asMeteor(_object1);
    return meteor !== undefined && meteor.active;
  }

  private handlePlayerMeteor(object1: PhysicsObject, object2: PhysicsObject): void {
    const meteor = this.asMeteor(object1) ?? this.asMeteor(object2);
    if (meteor === undefined || !meteor.active) {
      return;
    }

    const damage = meteor.getContactDamage();
    meteor.deactivate();

    const result = this.player.takeHit(damage, undefined, 'meteor');
    if (result.applied) {
      this.onPlayerHit(result);
    }
  }

  private canEnemyProjectileHitPlayer(
    object1: PhysicsObject,
    object2: PhysicsObject,
  ): boolean {
    if (!this.enabled || this.player.getHealth() <= 0) {
      return false;
    }

    const projectile = this.asEnemyProjectile(object1) ?? this.asEnemyProjectile(object2);
    return projectile !== undefined && projectile.active;
  }

  private handleEnemyProjectilePlayer(object1: PhysicsObject, object2: PhysicsObject): void {
    const projectile = this.asEnemyProjectile(object1) ?? this.asEnemyProjectile(object2);
    if (projectile === undefined || !projectile.active) {
      return;
    }

    const damage = projectile.getDamage();
    const rotationJitterAmplitude = projectile.getRotationJitterAmplitude();
    projectile.deactivate();
    const result = this.player.takeHit(damage, rotationJitterAmplitude, 'projectile');
    if (result.applied) {
      this.onPlayerHit(result);
    }
  }

  private canPlayerRamEnemy(object1: PhysicsObject, object2: PhysicsObject): boolean {
    if (!this.enabled || this.player.getHealth() <= 0) {
      return false;
    }

    const enemy = this.asEnemy(object1) ?? this.asEnemy(object2);
    return enemy !== undefined && enemy.active;
  }

  private handlePlayerEnemy(object1: PhysicsObject, object2: PhysicsObject): void {
    const enemy = this.asEnemy(object1) ?? this.asEnemy(object2);
    if (enemy === undefined || !enemy.active) {
      return;
    }

    const def = enemy.getDefinition();
    if (def === null) {
      return;
    }

    const playerSprite = this.player.getSprite();
    let nx = enemy.x - playerSprite.x;
    let ny = enemy.y - playerSprite.y;
    const length = Math.hypot(nx, ny);
    if (length < ZERO_LENGTH) {
      nx = 0;
      ny = -1;
    } else {
      nx /= length;
      ny /= length;
    }

    this.separateCircles(
      playerSprite,
      enemy,
      nx,
      ny,
      starterShip.colliderRadius,
      def.colliderRadius,
      length < ZERO_LENGTH ? 0 : length,
    );

    if (!enemy.tryLockRam(this.scene.time.now, ramming.contactCooldownMs)) {
      return;
    }

    this.onShipRam();

    if (this.player.hasShield()) {
      this.applyShieldRam(enemy, def, nx, ny);
      return;
    }

    this.applyUnshieldedRam(enemy, def, nx, ny);
  }

  private applyShieldRam(enemy: Enemy, def: EnemyDef, nx: number, ny: number): void {
    this.player.applyKnockback(
      -nx * ramming.bubblePlayerImpulse,
      -ny * ramming.bubblePlayerImpulse,
    );

    if (def.id === EnemyIds.StingDart) {
      enemy.applyKnockback(
        nx * ramming.bubbleSmallEnemyImpulse,
        ny * ramming.bubbleSmallEnemyImpulse,
        ramming.bubbleSmallKnockbackStunMs,
      );
      const turns = Phaser.Math.RND.pick([...ramming.bubbleSmallSpinTurns]);
      const sign = Phaser.Math.RND.pick([-1, 1]);
      enemy.applySpin(turns * sign, ramming.bubbleSmallKnockbackStunMs);
      const killed = enemy.takeHullDamage(bubbleSmallEnemyRamDamage(def.maxHull));
      this.onPlayerHit(this.player.reportShieldRam());
      if (killed) {
        this.onEnemyKilled(enemy);
      }
      return;
    }

    enemy.applyKnockback(
      nx * ramming.bubbleMiddleEnemyImpulse,
      ny * ramming.bubbleMiddleEnemyImpulse,
      ramming.knockbackStunMs,
    );
    this.onPlayerHit(this.player.reportShieldRam());
  }

  private applyUnshieldedRam(enemy: Enemy, def: EnemyDef, nx: number, ny: number): void {
    this.player.applyKnockback(-nx * ramming.playerImpulse, -ny * ramming.playerImpulse);
    enemy.applyKnockback(
      nx * ramming.enemyImpulse,
      ny * ramming.enemyImpulse,
      ramming.knockbackStunMs,
    );

    const playerResult = this.player.takeHit(
      playerRamDamage(starterShip.maxHealth),
      undefined,
      'ram',
    );
    const enemyKilled = enemy.takeHullDamage(enemyRamDamage(def.maxHull));

    if (enemyKilled) {
      this.onEnemyKilled(enemy);
    }
    if (playerResult.applied) {
      this.onPlayerHit(playerResult);
    }
  }

  private separateCircles(
    playerSprite: Phaser.Physics.Arcade.Sprite,
    enemy: Enemy,
    nx: number,
    ny: number,
    playerRadius: number,
    enemyRadius: number,
    currentDistance: number,
  ): void {
    const minDistance = playerRadius + enemyRadius + ramming.separatePaddingPx;
    const overlap = minDistance - currentDistance;
    if (overlap <= 0) {
      return;
    }

    const half = overlap * 0.5;
    playerSprite.x -= nx * half;
    playerSprite.y -= ny * half;
    enemy.x += nx * half;
    enemy.y += ny * half;

    const playerBody = playerSprite.body;
    if (playerBody instanceof Phaser.Physics.Arcade.Body) {
      playerBody.updateFromGameObject();
    }

    const enemyBody = enemy.body;
    if (enemyBody instanceof Phaser.Physics.Arcade.Body) {
      enemyBody.updateFromGameObject();
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

  private asEnemyProjectile(object: PhysicsObject): EnemyProjectile | undefined {
    const gameObject = this.asGameObject(object);
    return gameObject instanceof EnemyProjectile ? gameObject : undefined;
  }

  private asMeteor(object: PhysicsObject): Meteor | undefined {
    const gameObject = this.asGameObject(object);
    return gameObject instanceof Meteor ? gameObject : undefined;
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
