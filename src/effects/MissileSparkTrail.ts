import Phaser from 'phaser';
import { TextureKeys } from '../config/assetKeys';

const FOLLOW_OFFSET_PX = 11;
const SPARK_SPREAD_DEG = 18;
const SPARK_DEPTH = 1;
const LIFESPAN_MIN_MS = 180;
const LIFESPAN_MAX_MS = 320;
const SPEED_MIN = 40;
const SPEED_MAX = 90;
const SCALE_START = 0.45;
const FREQUENCY_MS = 16;
const MAX_ALIVE_PARTICLES = 24;
const COLOR_START = 0xffee88;
const COLOR_END = 0xff6622;

export class MissileSparkTrail {
  private readonly scene: Phaser.Scene;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter | null;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.emitter = null;
  }

  public start(target: Phaser.GameObjects.Sprite, travelRotation: number): void {
    if (!this.scene.sys.isActive() || !this.scene.textures.exists(TextureKeys.MissileSpark)) {
      return;
    }

    if (this.emitter === null) {
      this.emitter = this.scene.add.particles(target.x, target.y, TextureKeys.MissileSpark, {
        blendMode: Phaser.BlendModes.ADD,
        lifespan: { min: LIFESPAN_MIN_MS, max: LIFESPAN_MAX_MS },
        speed: { min: SPEED_MIN, max: SPEED_MAX },
        scale: { start: SCALE_START, end: 0 },
        color: [COLOR_START, COLOR_END],
        frequency: FREQUENCY_MS,
        quantity: 1,
        gravityY: 0,
        emitting: false,
        maxAliveParticles: MAX_ALIVE_PARTICLES,
      });
      this.emitter.setDepth(SPARK_DEPTH);
    }

    this.aimBehind(target, travelRotation);
    this.emitter.start();
  }

  public stop(): void {
    const emitter = this.emitter;
    if (emitter === null) {
      return;
    }

    if (!this.scene.sys.isActive()) {
      this.emitter = null;
      return;
    }

    emitter.stop(true);
    emitter.stopFollow();
  }

  private aimBehind(target: Phaser.GameObjects.Sprite, travelRotation: number): void {
    const emitter = this.emitter;
    if (emitter === null) {
      return;
    }

    const back = travelRotation + Math.PI;
    const offsetX = Math.cos(back) * FOLLOW_OFFSET_PX;
    const offsetY = Math.sin(back) * FOLLOW_OFFSET_PX;
    const angleDeg = Phaser.Math.RadToDeg(back);

    emitter.startFollow(target, offsetX, offsetY);
    emitter.setEmitterAngle({ min: angleDeg - SPARK_SPREAD_DEG, max: angleDeg + SPARK_SPREAD_DEG });
  }
}
