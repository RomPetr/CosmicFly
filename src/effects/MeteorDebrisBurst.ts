import Phaser from 'phaser';

const MIN_SPIN = 4;
const MAX_SPIN = 12;
const PIECE_COLORS = [0x8a7a68, 0x6d6257, 0xa4937f, 0x4f4a45] as const;

type BurstConfig = {
  readonly minPieces: number;
  readonly maxPieces: number;
  readonly minLifeMs: number;
  readonly maxLifeMs: number;
  readonly minSpeed: number;
  readonly maxSpeed: number;
  readonly minSize: number;
  readonly maxSize: number;
};

const HIT_BURST: BurstConfig = {
  minPieces: 3,
  maxPieces: 5,
  minLifeMs: 180,
  maxLifeMs: 350,
  minSpeed: 50,
  maxSpeed: 140,
  minSize: 1,
  maxSize: 2,
};

const DESTROYED_BURST: BurstConfig = {
  minPieces: 14,
  maxPieces: 22,
  minLifeMs: 450,
  maxLifeMs: 900,
  minSpeed: 90,
  maxSpeed: 300,
  minSize: 1,
  maxSize: 4,
};

type MeteorDebrisPiece = {
  shape: Phaser.GameObjects.Shape;
  vx: number;
  vy: number;
  angularVelocity: number;
  lifeMs: number;
  elapsedMs: number;
};

export class MeteorDebrisBurst {
  private readonly scene: Phaser.Scene;
  private readonly pieces: MeteorDebrisPiece[];

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.pieces = [];
  }

  public spawnHit(x: number, y: number): void {
    this.spawn(x, y, HIT_BURST);
  }

  public spawnDestroyed(x: number, y: number): void {
    this.spawn(x, y, DESTROYED_BURST);
  }

  public update(delta: number): void {
    if (!this.scene.sys.isActive()) {
      return;
    }

    const dt = delta / 1000;

    for (let index = this.pieces.length - 1; index >= 0; index -= 1) {
      const piece = this.pieces[index];
      if (piece === undefined) {
        continue;
      }

      piece.elapsedMs += delta;
      piece.shape.x += piece.vx * dt;
      piece.shape.y += piece.vy * dt;
      piece.shape.rotation += piece.angularVelocity * dt;
      piece.shape.setAlpha(Math.max(0, 1 - piece.elapsedMs / piece.lifeMs));

      if (piece.elapsedMs >= piece.lifeMs) {
        piece.shape.destroy();
        this.pieces.splice(index, 1);
      }
    }
  }

  public stop(): void {
    if (this.scene.sys.isActive()) {
      for (const piece of this.pieces) {
        if (piece.shape.scene !== undefined) {
          piece.shape.destroy();
        }
      }
    }

    this.pieces.length = 0;
  }

  private spawn(x: number, y: number, config: BurstConfig): void {
    const count = Phaser.Math.Between(config.minPieces, config.maxPieces);

    for (let index = 0; index < count; index += 1) {
      this.pieces.push(this.createPiece(x, y, config));
    }
  }

  private createPiece(x: number, y: number, config: BurstConfig): MeteorDebrisPiece {
    const color = PIECE_COLORS[Phaser.Math.Between(0, PIECE_COLORS.length - 1)] ?? 0x8a7a68;
    const size = Phaser.Math.FloatBetween(config.minSize, config.maxSize);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(config.minSpeed, config.maxSpeed);
    const spin =
      Phaser.Math.FloatBetween(MIN_SPIN, MAX_SPIN) * (Math.random() < 0.5 ? -1 : 1);
    const halfSize = size / 2;

    const shape =
      Math.random() < 0.5
        ? this.scene.add.triangle(
            x,
            y,
            0,
            -halfSize,
            halfSize,
            halfSize,
            -halfSize,
            halfSize,
            color,
          )
        : this.scene.add.rectangle(
            x,
            y,
            size,
            size * Phaser.Math.FloatBetween(0.6, 1.4),
            color,
          );

    shape.setDepth(5);
    shape.setRotation(angle);

    return {
      shape,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angularVelocity: spin,
      lifeMs: Phaser.Math.FloatBetween(config.minLifeMs, config.maxLifeMs),
      elapsedMs: 0,
    };
  }
}
