import Phaser from 'phaser';
import { missileSparkColors, missileSparks } from '../data/missileSparks';

type Ember = {
  circle: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  lifeMs: number;
  elapsedMs: number;
  startRadius: number;
};

type SparkBand = {
  readonly countMin: number;
  readonly countMax: number;
  readonly speedMin: number;
  readonly speedMax: number;
  readonly lifeMinMs: number;
  readonly lifeMaxMs: number;
  readonly radiusMin: number;
  readonly radiusMax: number;
};

/**
 * Campfire embers from a missile nozzle. Additive circles, not ParticleEmitter:
 * Phaser particles + canvas textures were invisible in this project.
 */
export class MissileSparkTrail {
  private readonly scene: Phaser.Scene;
  private readonly sparks: Ember[];
  private active: boolean;
  private streamAccMs: number;
  private emberAccMs: number;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sparks = [];
    this.active = false;
    this.streamAccMs = 0;
    this.emberAccMs = 0;
  }

  public start(target: Phaser.GameObjects.Sprite, travelRotation: number): void {
    this.clearSparks();
    this.active = true;
    this.streamAccMs = 0;
    this.emberAccMs = 0;
    this.spawnBand(target, travelRotation, missileSparks.burst, Math.PI * 2);
  }

  public update(delta: number, target: Phaser.GameObjects.Sprite, travelRotation: number): void {
    if (!this.active || !this.scene.sys.isActive()) {
      return;
    }

    this.streamAccMs += delta;
    this.emberAccMs += delta;

    while (this.streamAccMs >= missileSparks.stream.intervalMs) {
      this.streamAccMs -= missileSparks.stream.intervalMs;
      this.spawnBand(target, travelRotation, missileSparks.stream, missileSparks.stream.spreadRad);
    }

    while (this.emberAccMs >= missileSparks.ember.intervalMs) {
      this.emberAccMs -= missileSparks.ember.intervalMs;
      this.spawnBand(target, travelRotation, missileSparks.ember, Math.PI * 2);
    }

    this.advance(delta);
  }

  public stop(): void {
    this.active = false;
    this.streamAccMs = 0;
    this.emberAccMs = 0;
    this.clearSparks();
  }

  private spawnBand(
    target: Phaser.GameObjects.Sprite,
    travelRotation: number,
    band: SparkBand,
    spreadRad: number,
  ): void {
    if (!this.scene.sys.isActive()) {
      return;
    }

    const nozzle = this.nozzleWorld(target, travelRotation);
    const count = Phaser.Math.Between(band.countMin, band.countMax);
    const back = travelRotation + Math.PI;

    for (let index = 0; index < count; index += 1) {
      const angle = back + Phaser.Math.FloatBetween(-spreadRad, spreadRad);
      const speed = Phaser.Math.FloatBetween(band.speedMin, band.speedMax);
      const radius = Phaser.Math.FloatBetween(band.radiusMin, band.radiusMax);
      const color = missileSparkColors[Phaser.Math.Between(0, missileSparkColors.length - 1)] ?? 0xffb04a;
      const circle = this.scene.add.circle(nozzle.x, nozzle.y, radius, color, 1);
      circle.setDepth(missileSparks.depth).setBlendMode(Phaser.BlendModes.ADD);

      this.sparks.push({
        circle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifeMs: Phaser.Math.FloatBetween(band.lifeMinMs, band.lifeMaxMs),
        elapsedMs: 0,
        startRadius: radius,
      });
    }
  }

  private advance(delta: number): void {
    const dt = delta / 1000;

    for (let index = this.sparks.length - 1; index >= 0; index -= 1) {
      const spark = this.sparks[index];
      if (spark === undefined) {
        continue;
      }

      spark.elapsedMs += delta;
      const t = Math.min(1, spark.elapsedMs / spark.lifeMs);
      spark.circle.x += spark.vx * dt;
      spark.circle.y += spark.vy * dt;
      spark.circle.setRadius(spark.startRadius * (1 - t * 0.85));
      spark.circle.setAlpha(1 - t);

      if (spark.elapsedMs >= spark.lifeMs) {
        spark.circle.destroy();
        this.sparks.splice(index, 1);
      }
    }
  }

  private nozzleWorld(
    target: Phaser.GameObjects.Sprite,
    travelRotation: number,
  ): { x: number; y: number } {
    const back = travelRotation + Math.PI;
    const distance = target.displayHeight * missileSparks.nozzleOffsetRatio;
    return {
      x: target.x + Math.cos(back) * distance,
      y: target.y + Math.sin(back) * distance,
    };
  }

  private clearSparks(): void {
    if (this.scene.sys.isActive()) {
      for (const spark of this.sparks) {
        spark.circle.destroy();
      }
    }

    this.sparks.length = 0;
  }
}
