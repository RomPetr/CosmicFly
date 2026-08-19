import Phaser from 'phaser';

const MIN_PIECES = 6;
const MAX_PIECES = 10;
const MIN_LIFE_MS = 400;
const MAX_LIFE_MS = 700;
const MIN_SPEED = 90;
const MAX_SPEED = 240;
const MIN_SPIN = 4;
const MAX_SPIN = 10;
const PIECE_COLORS = [0x145c38, 0x1a6b42, 0x5c6570, 0x8a93a0] as const;

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
  private readonly pieces: DebrisPiece[];

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.pieces = [];
  }

  public spawn(x: number, y: number): void {
    const count = Phaser.Math.Between(MIN_PIECES, MAX_PIECES);

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
    const color = PIECE_COLORS[Phaser.Math.Between(0, PIECE_COLORS.length - 1)] ?? 0x145c38;
    const size = Phaser.Math.Between(3, 6);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(MIN_SPEED, MAX_SPEED);
    const spin = Phaser.Math.FloatBetween(MIN_SPIN, MAX_SPIN) * (Math.random() < 0.5 ? -1 : 1);

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

    shape.setDepth(5);
    shape.setRotation(angle);

    return {
      shape,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angularVelocity: spin,
      lifeMs: Phaser.Math.FloatBetween(MIN_LIFE_MS, MAX_LIFE_MS),
      elapsedMs: 0,
    };
  }
}
