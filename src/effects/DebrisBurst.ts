import Phaser from 'phaser';

export type DebrisConfig = {
  readonly minPieces: number;
  readonly maxPieces: number;
  readonly minLifeMs: number;
  readonly maxLifeMs: number;
  readonly minSpeed: number;
  readonly maxSpeed: number;
  readonly minSpin: number;
  readonly maxSpin: number;
  readonly minSize: number;
  readonly maxSize: number;
  readonly colors: readonly number[];
  readonly depth: number;
};

export const enemyDebrisConfig: DebrisConfig = {
  minPieces: 6,
  maxPieces: 10,
  minLifeMs: 400,
  maxLifeMs: 700,
  minSpeed: 90,
  maxSpeed: 240,
  minSpin: 4,
  maxSpin: 10,
  minSize: 3,
  maxSize: 6,
  colors: [0x145c38, 0x1a6b42, 0x5c6570, 0x8a93a0],
  depth: 5,
};

export const playerDebrisConfig: DebrisConfig = {
  minPieces: 28,
  maxPieces: 40,
  minLifeMs: 700,
  maxLifeMs: 1500,
  minSpeed: 110,
  maxSpeed: 430,
  minSpin: 5,
  maxSpin: 14,
  minSize: 2,
  maxSize: 5,
  colors: [0x9fb6d4, 0x6f8bb0, 0x3d5578, 0xffb04a, 0xfff0c2],
  depth: 13,
};

type DebrisPiece = {
  shape: Phaser.GameObjects.Shape;
  vx: number;
  vy: number;
  angularVelocity: number;
  lifeMs: number;
  elapsedMs: number;
};

export class DebrisBurst {
  private readonly scene: Phaser.Scene;
  private readonly config: DebrisConfig;
  private readonly pieces: DebrisPiece[];

  public constructor(scene: Phaser.Scene, config: DebrisConfig = enemyDebrisConfig) {
    this.scene = scene;
    this.config = config;
    this.pieces = [];
  }

  public spawn(x: number, y: number): void {
    const count = Phaser.Math.Between(this.config.minPieces, this.config.maxPieces);

    for (let index = 0; index < count; index += 1) {
      this.pieces.push(this.createPiece(x, y));
    }
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

  private createPiece(x: number, y: number): DebrisPiece {
    const { colors } = this.config;
    const color = colors[Phaser.Math.Between(0, colors.length - 1)] ?? 0xffffff;
    const size = Phaser.Math.Between(this.config.minSize, this.config.maxSize);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(this.config.minSpeed, this.config.maxSpeed);
    const spin =
      Phaser.Math.FloatBetween(this.config.minSpin, this.config.maxSpin) *
      (Math.random() < 0.5 ? -1 : 1);

    const shape =
      Math.random() < 0.5
        ? this.scene.add.triangle(x, y, 0, -size, size, size, -size, size, color)
        : this.scene.add.rectangle(
            x,
            y,
            size,
            size * Phaser.Math.FloatBetween(0.6, 1.4),
            color,
          );

    shape.setDepth(this.config.depth);
    shape.setRotation(angle);

    return {
      shape,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angularVelocity: spin,
      lifeMs: Phaser.Math.FloatBetween(this.config.minLifeMs, this.config.maxLifeMs),
      elapsedMs: 0,
    };
  }
}
