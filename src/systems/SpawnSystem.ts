import Phaser from 'phaser';
import { stingDartEnemy } from '../data/enemies';
import { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

const MAX_ALIVE = 3;
const RESPAWN_DELAY_MS = 1500;
const SAFE_SPAWN_RADIUS = 140;
const EDGE_INSET = 24;
const SPAWN_ATTEMPTS = 20;

export class SpawnSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemies: Phaser.Physics.Arcade.Group;
  private readonly spawnPosition: Phaser.Math.Vector2;
  private enabled: boolean;
  private respawnTimerMs: number;

  public constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.spawnPosition = new Phaser.Math.Vector2();
    this.enabled = false;
    this.respawnTimerMs = 0;

    this.enemies = scene.physics.add.group({
      classType: Enemy,
      maxSize: MAX_ALIVE,
      runChildUpdate: false,
      allowGravity: false,
    });
  }

  public getEnemies(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  public start(): void {
    this.enabled = true;
    this.respawnTimerMs = 0;

    for (let index = 0; index < MAX_ALIVE; index += 1) {
      this.spawnOne();
    }
  }

  public update(delta: number): void {
    if (!this.enabled) {
      return;
    }

    for (const child of this.enemies.getChildren()) {
      if (child instanceof Enemy && child.active) {
        child.updateBehavior(this.player.x, this.player.y, delta);
      }
    }

    if (this.enemies.countActive(true) >= MAX_ALIVE) {
      this.respawnTimerMs = 0;
      return;
    }

    this.respawnTimerMs += delta;
    if (this.respawnTimerMs >= RESPAWN_DELAY_MS) {
      this.respawnTimerMs = 0;
      this.spawnOne();
    }
  }

  public stop(): void {
    this.enabled = false;
    this.respawnTimerMs = 0;

    if (!this.scene.sys.isActive()) {
      return;
    }

    for (const child of this.enemies.getChildren()) {
      if (child instanceof Enemy) {
        child.deactivate();
      }
    }
  }

  private spawnOne(): void {
    if (!this.enabled || this.enemies.countActive(true) >= MAX_ALIVE) {
      return;
    }

    const position = this.pickSpawnPosition();
    const enemy = this.enemies.get(position.x, position.y);
    if (!(enemy instanceof Enemy)) {
      return;
    }

    enemy.activate(stingDartEnemy, position.x, position.y);
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
