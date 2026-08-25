import Phaser from 'phaser';
import { starterShip } from '../data/ships';
import type { BlinkHop } from '../entities/Player';

const AFTERIMAGE_COUNT = 5;
const AFTERIMAGE_LIFE_MS = 220;
const BURST_LIFE_MS = 180;
const DEPTH = 4;
const TINT = 0x7fd4ff;
const STREAK_COLOR = 0xaef6ff;

type Ghost = {
  image: Phaser.GameObjects.Image;
  elapsedMs: number;
  lifeMs: number;
};

type Burst = {
  circle: Phaser.GameObjects.Arc;
  elapsedMs: number;
  lifeMs: number;
  startScale: number;
};

/**
 * Blink / phase hop: a string of cyan afterimages along the jump plus a pair of
 * additive flashes at the departure and arrival points (Hyper Light / Dead Cells feel).
 */
export class BlinkTrail {
  private readonly scene: Phaser.Scene;
  private readonly ghosts: Ghost[];
  private readonly bursts: Burst[];
  private streak: Phaser.GameObjects.Rectangle | null;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ghosts = [];
    this.bursts = [];
    this.streak = null;
  }

  public spawn(hop: BlinkHop): void {
    if (!this.scene.sys.isActive() || !this.scene.textures.exists(starterShip.textureKey)) {
      return;
    }

    this.clearStreak();

    const dx = hop.toX - hop.fromX;
    const dy = hop.toY - hop.fromY;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    this.streak = this.scene.add.rectangle(hop.fromX, hop.fromY, length, 6, STREAK_COLOR, 0.55);
    this.streak
      .setOrigin(0, 0.5)
      .setRotation(angle)
      .setDepth(DEPTH)
      .setBlendMode(Phaser.BlendModes.ADD);

    for (let index = 0; index < AFTERIMAGE_COUNT; index += 1) {
      const t = (index + 1) / (AFTERIMAGE_COUNT + 1);
      const image = this.scene.add.image(
        hop.fromX + dx * t,
        hop.fromY + dy * t,
        starterShip.textureKey,
      );
      image
        .setOrigin(0.5, 0.5)
        .setScale(hop.scale)
        .setRotation(hop.rotation)
        .setTint(TINT)
        .setAlpha(0.55 * (1 - t * 0.35))
        .setDepth(DEPTH)
        .setBlendMode(Phaser.BlendModes.ADD);

      this.ghosts.push({
        image,
        elapsedMs: -index * 18,
        lifeMs: AFTERIMAGE_LIFE_MS,
      });
    }

    this.spawnBurst(hop.fromX, hop.fromY, 10);
    this.spawnBurst(hop.toX, hop.toY, 16);
  }

  public update(delta: number): void {
    if (!this.scene.sys.isActive()) {
      return;
    }

    for (let index = this.ghosts.length - 1; index >= 0; index -= 1) {
      const ghost = this.ghosts[index];
      if (ghost === undefined) {
        continue;
      }

      ghost.elapsedMs += delta;
      if (ghost.elapsedMs < 0) {
        ghost.image.setVisible(false);
        continue;
      }

      ghost.image.setVisible(true);
      const t = Math.min(1, ghost.elapsedMs / ghost.lifeMs);
      ghost.image.setAlpha((1 - t) * 0.55);
      if (t >= 1) {
        ghost.image.destroy();
        this.ghosts.splice(index, 1);
      }
    }

    for (let index = this.bursts.length - 1; index >= 0; index -= 1) {
      const burst = this.bursts[index];
      if (burst === undefined) {
        continue;
      }

      burst.elapsedMs += delta;
      const t = Math.min(1, burst.elapsedMs / burst.lifeMs);
      burst.circle.setScale(burst.startScale * (1 + t * 1.8));
      burst.circle.setAlpha(1 - t);
      if (t >= 1) {
        burst.circle.destroy();
        this.bursts.splice(index, 1);
      }
    }

    if (this.streak !== null) {
      const next = this.streak.alpha - (delta / AFTERIMAGE_LIFE_MS) * 0.55;
      if (next <= 0) {
        this.clearStreak();
      } else {
        this.streak.setAlpha(next);
      }
    }
  }

  public stop(): void {
    const active = this.scene.sys.isActive();
    if (active) {
      for (const ghost of this.ghosts) {
        ghost.image.destroy();
      }
      for (const burst of this.bursts) {
        burst.circle.destroy();
      }
    }
    this.ghosts.length = 0;
    this.bursts.length = 0;
    this.clearStreak();
  }

  private spawnBurst(x: number, y: number, radius: number): void {
    const circle = this.scene.add.circle(x, y, radius, STREAK_COLOR, 0.85);
    circle.setDepth(DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
    this.bursts.push({
      circle,
      elapsedMs: 0,
      lifeMs: BURST_LIFE_MS,
      startScale: 1,
    });
  }

  private clearStreak(): void {
    if (this.streak !== null) {
      if (this.scene.sys.isActive()) {
        this.streak.destroy();
      }
      this.streak = null;
    }
  }
}
