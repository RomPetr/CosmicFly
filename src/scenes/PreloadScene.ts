import Phaser from 'phaser';
import { SceneKeys, SoundKeys, SoundPaths, TextureKeys, TexturePaths, type TextureKey } from '../config/assetKeys';

const PROGRESS_BAR_WIDTH = 320;
const PROGRESS_BAR_HEIGHT = 18;

export class PreloadScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKeys.Preload });
  }

  public preload(): void {
    this.load.image(TextureKeys.PlayerShip, TexturePaths[TextureKeys.PlayerShip]);
    this.load.image(TextureKeys.StingDart, TexturePaths[TextureKeys.StingDart]);
    this.load.image(TextureKeys.FlareMissile, TexturePaths[TextureKeys.FlareMissile]);
    this.load.image(TextureKeys.AshChunkA, TexturePaths[TextureKeys.AshChunkA]);
    this.load.image(TextureKeys.AshChunkB, TexturePaths[TextureKeys.AshChunkB]);

    for (const key of Object.values(SoundKeys)) {
      this.load.audio(key, SoundPaths[key]);
    }

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);

    const { width, height } = this.scale;
    const barX = width / 2 - PROGRESS_BAR_WIDTH / 2;

    this.add
      .rectangle(width / 2, height / 2, PROGRESS_BAR_WIDTH + 8, PROGRESS_BAR_HEIGHT + 8)
      .setStrokeStyle(2, 0x7fd4ff);

    const bar = this.add
      .rectangle(barX, height / 2, 0, PROGRESS_BAR_HEIGHT, 0x7fd4ff)
      .setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = PROGRESS_BAR_WIDTH * value;
    });

    if (this.load.list.size === 0) {
      bar.width = PROGRESS_BAR_WIDTH;
    }
  }

  public create(): void {
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);

    if (
      !this.textures.exists(TextureKeys.AshChunkA) ||
      !this.textures.exists(TextureKeys.AshChunkB)
    ) {
      throw new Error('Ash Chunk meteor textures are not registered');
    }

    this.createPulseBoltTexture();
    this.createEnemyBoltTexture();
    this.createStarfieldTextures();
    this.scene.start(SceneKeys.Menu);
  }

  private handleLoadError(file: Phaser.Loader.File): void {
    if (file.type !== 'audio') {
      return;
    }

    console.warn(`Failed to load audio "${file.key}" from ${String(file.src)}`);
  }

  private createPulseBoltTexture(): void {
    if (this.textures.exists(TextureKeys.PulseBolt)) {
      return;
    }

    const width = 16;
    const height = 6;
    const radius = height / 2;
    const graphics = this.make.graphics({}, false);

    graphics.fillStyle(0xffb04a, 1);
    graphics.fillRect(radius, 0, width - height, height);
    graphics.fillCircle(radius, radius, radius);
    graphics.fillCircle(width - radius, radius, radius);

    graphics.fillStyle(0xfff6e0, 1);
    graphics.fillRect(radius + 1, 1, width - height - 2, height - 2);
    graphics.fillCircle(radius + 1, radius, radius - 1);
    graphics.fillCircle(width - radius - 1, radius, radius - 1);

    graphics.generateTexture(TextureKeys.PulseBolt, width, height);
    graphics.destroy();
  }

  private createEnemyBoltTexture(): void {
    if (this.textures.exists(TextureKeys.EnemyBolt)) {
      return;
    }

    const width = 14;
    const height = 6;
    const radius = height / 2;
    const graphics = this.make.graphics({}, false);

    graphics.fillStyle(0x33264f, 1);
    graphics.fillRect(radius, 0, width - height, height);
    graphics.fillCircle(radius, radius, radius);
    graphics.fillCircle(width - radius, radius, radius);

    graphics.fillStyle(0xc8b8e8, 1);
    graphics.fillRect(radius + 1, 2, width - height - 2, height - 4);
    graphics.fillCircle(radius + 1, radius, radius - 2);
    graphics.fillCircle(width - radius - 1, radius, radius - 2);

    graphics.generateTexture(TextureKeys.EnemyBolt, width, height);
    graphics.destroy();
  }

  private createStarfieldTextures(): void {
    this.createStarfieldTexture(TextureKeys.StarfieldFar, 256, 52, 1.1, 0xc8d4ea, 0.5);
    this.createStarfieldTexture(TextureKeys.StarfieldNear, 256, 20, 1.7, 0xf4f7fb, 0.92);
  }

  private createStarfieldTexture(
    key: TextureKey,
    size: number,
    starCount: number,
    radius: number,
    color: number,
    alpha: number,
  ): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.make.graphics({}, false);

    for (let index = 0; index < starCount; index += 1) {
      const x = Phaser.Math.Between(2, size - 3);
      const y = Phaser.Math.Between(2, size - 3);
      const starRadius = Phaser.Math.FloatBetween(radius * 0.45, radius);
      const starAlpha = Phaser.Math.FloatBetween(alpha * 0.4, alpha);
      graphics.fillStyle(color, starAlpha);
      graphics.fillCircle(x, y, starRadius);
    }

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }
}
