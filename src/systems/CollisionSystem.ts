import Phaser from 'phaser';
import { starterShip } from '../data/ships';
import type { WeaponId } from '../data/weapons';
import { EnemyIds, type EnemyDef } from '../data/enemies';
import {
  bubbleMiddleEnemyRamDamage,
  bubbleSmallEnemyRamDamage,
  enemyRamDamage,
  playerMiddleRamDamage,
  playerRamDamage,
  ramming,
  type RamSoundKind,
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
  private readonly onRamSound: (kind: RamSoundKind) => void;
  private readonly onPlayerProjectileImpact: (x: number, y: number, sourceId: WeaponId) => void;
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
    onRamSound: (kind: RamSoundKind) => void,
    onPlayerProjectileImpact: (x: number, y: number, sourceId: WeaponId) => void,
  ) {
    this.scene = scene;
    this.player = player;
    this.onEnemyKilled = onEnemyKilled;
    this.onMeteorHit = onMeteorHit;
    this.onPlayerHit = onPlayerHit;
    this.onRamSound = onRamSound;
    this.onPlayerProjectileImpact = onPlayerProjectileImpact;
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
    this.onPlayerProjectileImpact(projectile.x, projectile.y, damage.sourceId);
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
    this.onPlayerProjectileImpact(projectile.x, projectile.y, damage.sourceId);
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

    const playerSprite = this.player.getSprite();
    let nx = meteor.x - playerSprite.x;
    let ny = meteor.y - playerSprite.y;
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
      meteor,
      nx,
      ny,
      starterShip.colliderRadius,
      meteor.getWorldColliderRadius(),
      length < ZERO_LENGTH ? 0 : length,
    );

    if (!meteor.tryLockRam(this.scene.time.now, ramming.contactCooldownMs)) {
      return;
    }

    this.onRamSound('meteor');

    if (this.player.hasShield()) {
      this.applyShieldMeteorRam(meteor, nx, ny);
      return;
    }

    this.applyUnshieldedMeteorRam(meteor, nx, ny);
  }

  private applyShieldMeteorRam(meteor: Meteor, nx: number, ny: number): void {
    this.player.applyKnockback(
      -nx * ramming.bubblePlayerImpulse,
      -ny * ramming.bubblePlayerImpulse,
    );
    this.onPlayerHit(this.player.reportShieldRam());
    this.onMeteorHit(meteor, true);
    meteor.deactivate();
  }

  private applyUnshieldedMeteorRam(meteor: Meteor, nx: number, ny: number): void {
    this.player.applyKnockback(-nx * ramming.playerImpulse, -ny * ramming.playerImpulse);
    meteor.applyKnockback(
      nx * ramming.enemyImpulse,
      ny * ramming.enemyImpulse,
      ramming.knockbackStunMs,
    );

    const shrunk = meteor.shrinkInHalf();
    if (!shrunk) {
      this.onMeteorHit(meteor, true);
      meteor.deactivate();
    } else {
      this.onMeteorHit(meteor, false);
    }

    const playerResult = this.player.takeHit(
      playerRamDamage(starterShip.maxHealth),
      undefined,
      'ram',
    );
    if (playerResult.applied) {
      this.onPlayerHit(playerResult);
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

    const kind: RamSoundKind = def.id === EnemyIds.MiddleEnemy ? 'middle' : 'small';
    this.onRamSound(kind);

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
      ramming.bubbleMiddleKnockbackStunMs,
    );
    const yawDeg = Phaser.Math.Between(10, 120);
    const yawSign = Phaser.Math.RND.pick([-1, 1]);
    enemy.applySpin((yawDeg / 360) * yawSign, ramming.bubbleMiddleKnockbackStunMs);
    const killed = enemy.takeHullDamage(bubbleMiddleEnemyRamDamage(def.maxHull));
    this.onPlayerHit(this.player.reportShieldRam());
    if (killed) {
      this.onEnemyKilled(enemy);
    }
  }

  private applyUnshieldedRam(enemy: Enemy, def: EnemyDef, nx: number, ny: number): void {
    this.player.applyKnockback(-nx * ramming.playerImpulse, -ny * ramming.playerImpulse);
    enemy.applyKnockback(
      nx * ramming.enemyImpulse,
      ny * ramming.enemyImpulse,
      ramming.knockbackStunMs,
    );

    const playerDamage =
      def.id === EnemyIds.MiddleEnemy
        ? playerMiddleRamDamage(starterShip.maxHealth)
        : playerRamDamage(starterShip.maxHealth);
    const playerResult = this.player.takeHit(playerDamage, undefined, 'ram');
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
    other: Phaser.Physics.Arcade.Sprite,
    nx: number,
    ny: number,
    playerRadius: number,
    otherRadius: number,
    currentDistance: number,
  ): void {
    const minDistance = playerRadius + otherRadius + ramming.separatePaddingPx;
    const overlap = minDistance - currentDistance;
    if (overlap <= 0) {
      return;
    }

    const half = overlap * 0.5;
    playerSprite.x -= nx * half;
    playerSprite.y -= ny * half;
    other.x += nx * half;
    other.y += ny * half;

    const playerBody = playerSprite.body;
    if (playerBody instanceof Phaser.Physics.Arcade.Body) {
      playerBody.updateFromGameObject();
    }

    const otherBody = other.body;
    if (otherBody instanceof Phaser.Physics.Arcade.Body) {
      otherBody.updateFromGameObject();
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
