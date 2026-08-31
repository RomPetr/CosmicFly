import Phaser from 'phaser';
import { ashChunkMeteor } from '../data/meteors';
import { Meteor } from '../entities/Meteor';
import type { Player } from '../entities/Player';

export class MeteorSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly meteors: Phaser.Physics.Arcade.Group;
  private readonly spawnPosition: Phaser.Math.Vector2;
  private enabled: boolean;
  private spawnTimerMs: number;

  public constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.spawnPosition = new Phaser.Math.Vector2();
    this.enabled = false;
    this.spawnTimerMs = 0;

    this.meteors = scene.physics.add.group({
      classType: Meteor,
      maxSize: ashChunkMeteor.maxAlive,
      runChildUpdate: false,
      allowGravity: false,
    });
  }

  public getMeteors(): Phaser.Physics.Arcade.Group {
    return this.meteors;
  }

  public start(): void {
    this.enabled = true;
    this.spawnTimerMs = 0;
    this.spawnOne();
  }

  public update(delta: number, scrollSpeed: number): void {
    if (!this.enabled) {
      return;
    }

    const recycleY = this.scene.scale.height + ashChunkMeteor.recycleMarginPx;

    for (const child of this.meteors.getChildren()) {
      if (!(child instanceof Meteor) || !child.active) {
        continue;
      }

      child.syncFallSpeed(scrollSpeed, delta);
      child.updateVisual(delta);
      if (child.y > recycleY) {
        child.deactivate();
      }
    }

    if (this.meteors.countActive(true) >= ashChunkMeteor.maxAlive) {
      this.spawnTimerMs = 0;
      return;
    }

    this.spawnTimerMs += delta;
    if (this.spawnTimerMs >= ashChunkMeteor.spawnIntervalMs) {
      this.spawnTimerMs = 0;
      this.spawnOne();
    }
  }

  public stop(): void {
    this.enabled = false;
    this.spawnTimerMs = 0;

    if (!this.scene.sys.isActive()) {
      return;
    }

    for (const child of this.meteors.getChildren()) {
      if (child instanceof Meteor) {
        child.deactivate();
      }
    }
  }

  private spawnOne(): void {
    if (!this.enabled || this.meteors.countActive(true) >= ashChunkMeteor.maxAlive) {
      return;
    }

    const position = this.pickSpawnPosition();
    const meteor = this.meteors.get(position.x, position.y);
    if (!(meteor instanceof Meteor)) {
      return;
    }

    meteor.activate(ashChunkMeteor, position.x, position.y);
  }

  private pickSpawnPosition(): Phaser.Math.Vector2 {
    const { width } = this.scene.scale;
    const def = ashChunkMeteor;
    const minX = def.edgeInsetPx;
    const maxX = Math.max(minX, Math.floor(width - def.edgeInsetPx));
    const spawnY = -def.spawnMarginPx;

    for (let attempt = 0; attempt < def.spawnAttempts; attempt += 1) {
      const spawnX = Phaser.Math.Between(minX, maxX);
      if (
        Phaser.Math.Distance.Between(spawnX, spawnY, this.player.x, this.player.y) >= def.safeRadius
      ) {
        return this.spawnPosition.set(spawnX, spawnY);
      }
    }

    const leftDist = Phaser.Math.Distance.Between(minX, spawnY, this.player.x, this.player.y);
    const rightDist = Phaser.Math.Distance.Between(maxX, spawnY, this.player.x, this.player.y);
    const spawnX = leftDist >= rightDist ? minX : maxX;
    return this.spawnPosition.set(spawnX, spawnY);
  }
}
