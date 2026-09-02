import Phaser from 'phaser';
import { stage2Beam } from '../data/stage2Beam';

type Ember = {
  circle: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  lifeMs: number;
  elapsedMs: number;
  startRadius: number;
};

/**
 * Inverse-color additive afterimages behind the Stage 2 lance.
 * Circles, not ParticleEmitter — Phaser emitters were invisible in this project.
 */
export class BeamInverseTrail {
  private readonly scene: Phaser.Scene;
  private readonly sparks: Ember[];
  private accMs: number;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sparks = [];
    this.accMs = 0;
  }

  public reset(): void {
    this.accMs = 0;
    this.clear();
  }

  public update(delta: number, x: number, y: number, travelRotation: number): void {
    if (!this.scene.sys.isActive()) {
      return;
    }

    this.accMs += delta;
    while (this.accMs >= stage2Beam.trailIntervalMs) {
      this.accMs -= stage2Beam.trailIntervalMs;
      this.spawn(x, y, travelRotation);
    }

    this.advance(delta);
  }

  public stop(): void {
    this.accMs = 0;
    this.clear();
  }

  private spawn(x: number, y: number, travelRotation: number): void {
    const back = travelRotation + Math.PI;
    const count = Phaser.Math.Between(stage2Beam.trailCountMin, stage2Beam.trailCountMax);

    for (let index = 0; index < count; index += 1) {
      const angle = back + Phaser.Math.FloatBetween(-stage2Beam.trailSpreadRad, stage2Beam.trailSpreadRad);
      const speed = Phaser.Math.FloatBetween(stage2Beam.trailSpeedMin, stage2Beam.trailSpeedMax);
      const radius = Phaser.Math.FloatBetween(stage2Beam.trailRadiusMin, stage2Beam.trailRadiusMax);
      const circle = this.scene.add.circle(x, y, radius, stage2Beam.trailColor, 1);
      circle.setDepth(stage2Beam.depth).setBlendMode(Phaser.BlendModes.ADD);

      this.sparks.push({
        circle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifeMs: Phaser.Math.FloatBetween(stage2Beam.trailLifeMinMs, stage2Beam.trailLifeMaxMs),
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
      spark.circle.setRadius(spark.startRadius * (1 - t * 0.8));
      spark.circle.setAlpha(1 - t);

      if (spark.elapsedMs >= spark.lifeMs) {
        spark.circle.destroy();
        this.sparks.splice(index, 1);
      }
    }
  }

  private clear(): void {
    if (this.scene.sys.isActive()) {
      for (const spark of this.sparks) {
        spark.circle.destroy();
      }
    }

    this.sparks.length = 0;
  }
}
