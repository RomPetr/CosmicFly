import Phaser from 'phaser';
import {
  EnemyIds,
  enemies,
  middleEnemy,
  middleEnemyStage2,
  stingDartEnemy,
  type EnemyDef,
  type EnemyId,
} from '../data/enemies';
import { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

const POOL_CAPACITY = Object.values(enemies).reduce(
  (total, enemy) => total + enemy.spawn.maxAlive,
  0,
);
const SAFE_SPAWN_RADIUS = 140;
const EDGE_INSET = 24;
const SPAWN_ATTEMPTS = 20;

export class SpawnSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemies: Phaser.Physics.Arcade.Group;
  private readonly spawnPosition: Phaser.Math.Vector2;
  private enabled: boolean;
  private smallRespawnTimerMs: number;
  private middleRespawnRemainingMs: number | null;
  private middleSpawnedOnce: boolean;
  private stage2RespawnRemainingMs: number | null;
  private stage2SpawnedOnce: boolean;

  public constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.spawnPosition = new Phaser.Math.Vector2();
    this.enabled = false;
    this.smallRespawnTimerMs = 0;
    this.middleRespawnRemainingMs = null;
    this.middleSpawnedOnce = false;
    this.stage2RespawnRemainingMs = null;
    this.stage2SpawnedOnce = false;

    this.enemies = scene.physics.add.group({
      classType: Enemy,
      maxSize: POOL_CAPACITY,
      runChildUpdate: false,
      allowGravity: false,
    });
  }

  public getEnemies(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  public start(): void {
    this.enabled = true;
    this.resetSpawnState();

    for (let index = 0; index < stingDartEnemy.spawn.maxAlive; index += 1) {
      this.spawnEnemy(stingDartEnemy);
    }
  }

  public update(delta: number, distanceKm: number): void {
    if (!this.enabled) {
      return;
    }

    for (const child of this.enemies.getChildren()) {
      if (child instanceof Enemy && child.active) {
        child.updateBehavior(this.player.x, this.player.y, delta);
      }
    }

    this.updateSmallSpawns(delta);
    this.updateMiddleSpawn(delta, distanceKm);
    this.updateStage2MiddleSpawn(delta, distanceKm);
  }

  public onEnemyKilled(enemy: Enemy): void {
    const enemyId = enemy.getEnemyId();
    if (enemyId === EnemyIds.StingDart) {
      this.smallRespawnTimerMs = 0;
      return;
    }

    if (enemyId === EnemyIds.MiddleEnemy) {
      this.middleSpawnedOnce = true;
      this.middleRespawnRemainingMs = middleEnemy.spawn.respawnDelayMs;
      return;
    }

    if (enemyId === EnemyIds.MiddleEnemyStage2) {
      this.stage2SpawnedOnce = true;
      this.stage2RespawnRemainingMs = middleEnemyStage2.spawn.respawnDelayMs;
    }
  }

  public stop(): void {
    this.enabled = false;
    this.resetSpawnState();

    if (!this.scene.sys.isActive()) {
      return;
    }

    for (const child of this.enemies.getChildren()) {
      if (child instanceof Enemy) {
        child.deactivate();
      }
    }
  }

  public resetForShutdown(): void {
    this.enabled = false;
    this.resetSpawnState();
  }

  private updateSmallSpawns(delta: number): void {
    if (this.countActiveById(EnemyIds.StingDart) >= stingDartEnemy.spawn.maxAlive) {
      this.smallRespawnTimerMs = 0;
      return;
    }

    this.smallRespawnTimerMs += delta;
    if (this.smallRespawnTimerMs >= stingDartEnemy.spawn.respawnDelayMs) {
      this.smallRespawnTimerMs = 0;
      this.spawnEnemy(stingDartEnemy);
    }
  }

  private updateMiddleSpawn(delta: number, distanceKm: number): void {
    if (
      distanceKm < middleEnemy.spawn.minDistanceKm ||
      this.countActiveById(EnemyIds.MiddleEnemy) >= middleEnemy.spawn.maxAlive
    ) {
      return;
    }

    if (!this.middleSpawnedOnce) {
      this.middleSpawnedOnce = this.spawnEnemy(middleEnemy);
      return;
    }

    if (this.middleRespawnRemainingMs === null) {
      return;
    }

    this.middleRespawnRemainingMs = Math.max(0, this.middleRespawnRemainingMs - delta);
    if (this.middleRespawnRemainingMs === 0 && this.spawnEnemy(middleEnemy)) {
      this.middleRespawnRemainingMs = null;
    }
  }

  private updateStage2MiddleSpawn(delta: number, distanceKm: number): void {
    if (
      distanceKm < middleEnemyStage2.spawn.minDistanceKm ||
      this.countActiveById(EnemyIds.MiddleEnemyStage2) >= middleEnemyStage2.spawn.maxAlive
    ) {
      return;
    }

    if (!this.stage2SpawnedOnce) {
      this.stage2SpawnedOnce = this.spawnEnemy(middleEnemyStage2);
      return;
    }

    if (this.stage2RespawnRemainingMs === null) {
      return;
    }

    this.stage2RespawnRemainingMs = Math.max(0, this.stage2RespawnRemainingMs - delta);
    if (this.stage2RespawnRemainingMs === 0 && this.spawnEnemy(middleEnemyStage2)) {
      this.stage2RespawnRemainingMs = null;
    }
  }

  private spawnEnemy(def: EnemyDef): boolean {
    if (!this.enabled || this.countActiveById(def.id) >= def.spawn.maxAlive) {
      return false;
    }

    const position = this.pickSpawnPosition();
    const enemy = this.enemies.get(position.x, position.y);
    if (!(enemy instanceof Enemy)) {
      return false;
    }

    enemy.activate(def, position.x, position.y);
    return enemy.active;
  }

  private countActiveById(enemyId: EnemyId): number {
    let count = 0;
    for (const child of this.enemies.getChildren()) {
      if (child instanceof Enemy && child.active && child.getEnemyId() === enemyId) {
        count += 1;
      }
    }
    return count;
  }

  private resetSpawnState(): void {
    this.smallRespawnTimerMs = 0;
    this.middleRespawnRemainingMs = null;
    this.middleSpawnedOnce = false;
    this.stage2RespawnRemainingMs = null;
    this.stage2SpawnedOnce = false;
  }

  private pickSpawnPosition(): Phaser.Math.Vector2 {
    const { width, height } = this.scene.scale;

    for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt += 1) {
      this.placeOnRandomEdge(width, height);
      if (
        Phaser.Math.Distance.Between(
          this.spawnPosition.x,
          this.spawnPosition.y,
          this.player.x,
          this.player.y,
        ) >= SAFE_SPAWN_RADIUS
      ) {
        return this.spawnPosition;
      }
    }

    return this.placeOnFarthestCorner(width, height);
  }

  private placeOnRandomEdge(width: number, height: number): void {
    const maxX = Math.max(EDGE_INSET, Math.floor(width - EDGE_INSET));
    const maxY = Math.max(EDGE_INSET, Math.floor(height - EDGE_INSET));
    const edge = Phaser.Math.Between(0, 3);

    if (edge === 0) {
      this.spawnPosition.set(Phaser.Math.Between(EDGE_INSET, maxX), EDGE_INSET);
      return;
    }

    if (edge === 1) {
      this.spawnPosition.set(Phaser.Math.Between(EDGE_INSET, maxX), height - EDGE_INSET);
      return;
    }

    if (edge === 2) {
      this.spawnPosition.set(EDGE_INSET, Phaser.Math.Between(EDGE_INSET, maxY));
      return;
    }

    this.spawnPosition.set(width - EDGE_INSET, Phaser.Math.Between(EDGE_INSET, maxY));
  }

  private placeOnFarthestCorner(width: number, height: number): Phaser.Math.Vector2 {
    const corners = [
      { x: EDGE_INSET, y: EDGE_INSET },
      { x: width - EDGE_INSET, y: EDGE_INSET },
      { x: EDGE_INSET, y: height - EDGE_INSET },
      { x: width - EDGE_INSET, y: height - EDGE_INSET },
    ];

    let bestX = corners[0]?.x ?? EDGE_INSET;
    let bestY = corners[0]?.y ?? EDGE_INSET;
    let bestDist = -1;

    for (const corner of corners) {
      const dist = Phaser.Math.Distance.Between(corner.x, corner.y, this.player.x, this.player.y);
      if (dist > bestDist) {
        bestDist = dist;
        bestX = corner.x;
        bestY = corner.y;
      }
    }

    return this.spawnPosition.set(bestX, bestY);
  }
}
